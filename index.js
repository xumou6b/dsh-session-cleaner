/**
 * Session Cleaner — Host half.
 *
 * The saved-session store has no delete API, so this plugin removes a session
 * by deleting the session directory owned by the configured persistence
 * backend. It refuses live sessions (an open or running Session still owns a
 * write handle), then asks the session query index to reconcile so the next
 * list call no longer returns the removed rows.
 *
 * The same operation backs both the Client RPC channel and the
 * `delete_sessions` agent tool.
 */
import { rm } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';

/** Package name, matching the bundle and the Client module id. */
export const name = 'session-cleaner';

/** Services required before this plugin activates. */
export const inject = ['connection', 'sessionPersistence', 'sessions', 'agents', 'tools', 'webServer'];

/** Generic Connection RPC channel serving the Client half. */
const RPC_CHANNEL = '/session-cleaner';

/** Upper bound for one delete request. */
const MAX_DELETE = 200;

/**
 * Escape one value into a single safe path segment, matching the JSONL
 * persistence backend's own encoding. A SessionId is an unvalidated branded
 * string, so it must never be interpolated into a path directly.
 * @param raw - the value to encode.
 * @returns the escaped single path segment.
 */
function encodeSegment(raw) {
  if (raw === '.') return '~002E';
  if (raw === '..') return '~002E~002E';
  let out = '';
  for (let index = 0; index < raw.length; index += 1) {
    const code = raw.charCodeAt(index);
    const character = String.fromCharCode(code);
    if (character !== '~' && /^[A-Za-z0-9._-]$/.test(character)) out += character;
    else out += `~${code.toString(16).toUpperCase().padStart(4, '0')}`;
  }
  return out;
}

/**
 * Build the human-navigable project directory key used by the JSONL backend.
 * @param cwd - the Session's project directory.
 * @returns the single safe directory name.
 */
function projectKey(cwd) {
  let readable = '';
  let separatorRun = false;
  for (let index = 0; index < cwd.length; index += 1) {
    const code = cwd.charCodeAt(index);
    const character = String.fromCharCode(code);
    if (character === '/' || character === '\\' || character === ':') {
      if (!separatorRun) readable += '-';
      separatorRun = true;
    } else if (character !== '~' && /^[A-Za-z0-9._-]$/.test(character)) {
      readable += character;
      separatorRun = false;
    } else {
      readable += `~${code.toString(16).toUpperCase().padStart(4, '0')}`;
      separatorRun = false;
    }
  }
  return `--${(readable.replace(/^-+/, '') || 'root').slice(0, 251)}--`;
}

/** Render any thrown value as a user-safe single-line message. */
function messageOf(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Resolve the directory that exactly one stored Session owns. The concrete
 * JSONL backend exposes `locate()`; the documented `root` field is the
 * fallback for a backend that exposes only the configured root. The result is
 * only accepted when it names this exact Session inside the configured root.
 * @param persistence - the mounted session-persistence service.
 * @param header - the stored header naming the Session and its cwd.
 * @returns the absolute session directory, or undefined when it cannot be
 * resolved safely.
 */
function sessionDirectory(persistence, header) {
  let candidate;
  if (typeof persistence.locate === 'function') {
    try {
      const located = persistence.locate(header);
      if (located !== undefined && typeof located.path === 'string') candidate = dirname(located.path);
    } catch {
      candidate = undefined;
    }
  }
  if (candidate === undefined && typeof persistence.root === 'string') {
    const cwd = header.cwd;
    candidate = join(
      persistence.root,
      cwd === undefined ? '_no-cwd' : projectKey(cwd),
      encodeSegment(header.id),
    );
  }
  if (candidate === undefined) return undefined;

  const absolute = resolve(candidate);
  const leaf = absolute.split(sep).pop();
  if (leaf !== encodeSegment(header.id)) return undefined;

  if (typeof persistence.root === 'string') {
    const root = resolve(persistence.root);
    const prefix = root.endsWith(sep) ? root : `${root}${sep}`;
    const inside = process.platform === 'win32'
      ? absolute.toLowerCase().startsWith(prefix.toLowerCase())
      : absolute.startsWith(prefix);
    if (!inside) return undefined;
  }
  return absolute;
}

/** Delete one Session's on-disk directory and its artifacts. */
class SessionCleaner {
  /** @param ctx - the owning Host context. */
  constructor(ctx) {
    this.ctx = ctx;
    /** Sessions whose removal is already in flight. */
    this.inFlight = new Set();
    /** Cached session-persistence service reference. */
    this.persistence = ctx.sessionPersistence;
  }

  /**
   * List stored sessions with their current deletability.
   * @param options - optional title enrichment and cancellation.
   * @returns stored sessions, newest first.
   */
  async list(options = {}) {
    const { signal, withTitles = false } = options;
    const snapshots = await this.persistence.list({ signal });
    const liveSessions = new Map(this.ctx.sessions.list().map((session) => [session.id, session]));
    const agents = new Map(this.ctx.agents.list().map((agent) => [agent.id, agent]));

    const rows = snapshots.map(({ header, eventCount }) => {
      const live = liveSessions.get(header.id);
      const agent = agents.get(header.id);
      const running = agent !== undefined && agent.status === 'running';
      return {
        id: header.id,
        cwd: header.cwd,
        createdAt: header.createdAt,
        blank: live !== undefined ? live.seq === 0 : eventCount === 0,
        live: live !== undefined,
        running,
        deletable: live === undefined,
        reason: live !== undefined ? (running ? 'running' : 'live') : null,
      };
    });
    rows.sort((left, right) => right.createdAt - left.createdAt);

    if (withTitles && rows.length > 0) {
      const slice = rows.slice(0, 100);
      const query = this.ctx.get('sessionQuery');
      if (query !== undefined) {
        try {
          const observations = await query.readTitleSnapshots(slice.map((row) => row.id), signal);
          for (const observation of observations) {
            if (observation.status !== 'fulfilled') continue;
            const { session, title } = observation.value;
            const row = slice.find((candidate) => candidate.id === session.id);
            if (row !== undefined && typeof title === 'string' && title !== '') row.title = title;
          }
        } catch (error) {
          this.ctx.logger.warn(`session-cleaner: title read failed: ${messageOf(error)}`);
        }
      }
    }

    return {
      sessions: rows,
      total: rows.length,
      deletableCount: rows.filter((row) => row.deletable).length,
    };
  }

  /**
   * Permanently remove the named stored Sessions.
   * @param ids - stored Session identities.
   * @param signal - caller cancellation.
   * @returns per-session success and failure outcomes.
   */
  async remove(ids, signal) {
    const unique = [...new Set(ids)];
    const deleted = [];
    const failed = [];

    for (const id of unique) {
      if (signal?.aborted) throw signal.reason instanceof Error ? signal.reason : new Error('session-cleaner: aborted');
      if (this.inFlight.has(id)) {
        failed.push({ id, code: 'busy', message: 'this session is already being removed' });
        continue;
      }
      if (this.ctx.sessions.get(id) !== undefined || this.ctx.agents.get(id) !== undefined) {
        failed.push({ id, code: 'live', message: 'an open or running session cannot be removed' });
        continue;
      }
      this.inFlight.add(id);
      try {
        const snapshot = await this.persistence.stat(id, { signal });
        if (snapshot === undefined) {
          failed.push({ id, code: 'not-found', message: 'the stored session does not exist' });
          continue;
        }
        const directory = sessionDirectory(this.persistence, snapshot.header);
        if (directory === undefined) {
          failed.push({ id, code: 'unsupported-location', message: 'the storage backend cannot locate this session directory' });
          continue;
        }
        await rm(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 120 });
        const stillStored = await this.persistence.stat(id, { signal });
        if (stillStored !== undefined) {
          throw new Error('the session directory is still present after removal');
        }
        deleted.push(id);
        try {
          this.ctx.emit('api-session/removed', id);
        } catch (error) {
          this.ctx.logger.warn(`session-cleaner: removal notice failed for "${id}": ${messageOf(error)}`);
        }
        this.ctx.logger.info(`session-cleaner: removed session "${id}"`);
      } catch (error) {
        if (signal?.aborted) throw signal.reason instanceof Error ? signal.reason : new Error('session-cleaner: aborted');
        failed.push({ id, code: 'io', message: messageOf(error) });
      } finally {
        this.inFlight.delete(id);
      }
    }

    if (deleted.length > 0) {
      const query = this.ctx.get('sessionQuery');
      if (query !== undefined) {
        try {
          await query.listSessions();
        } catch (error) {
          this.ctx.logger.warn(`session-cleaner: search index refresh failed: ${messageOf(error)}`);
        }
      }
    }

    return { deleted, failed };
  }
}

/** Render the list outcome as model-facing text. */
function renderListResult(value) {
  const lines = value.sessions.slice(0, 100).map((session) => {
    const title = session.title === undefined ? '' : ` — ${session.title}`;
    const blank = session.blank ? ' (blank)' : '';
    const state = session.deletable ? '' : ` (not deletable: ${session.reason ?? 'in use'})`;
    return `- ${session.id}${title}${blank}${state}`;
  });
  const header = `${value.total} saved session(s), ${value.deletableCount} deletable.`;
  return `${header}\n${lines.join('\n')}`;
}

/** Render the delete outcome as model-facing text. */
function renderDeleteResult(value) {
  const deleted = Array.isArray(value.deleted) ? value.deleted : [];
  const failed = Array.isArray(value.failed) ? value.failed : [];
  const lines = [`Deleted ${deleted.length} session(s).`];
  if (failed.length > 0) {
    lines.push(`Failed to delete ${failed.length}:`);
    for (const failure of failed.slice(0, 50)) lines.push(`- ${failure.id}: ${failure.message ?? failure.code}`);
  }
  return lines.join('\n');
}

/** The `delete_sessions` model tool, backed by the same cleaner. */
function createTool(cleaner) {
  return {
    name: 'delete_sessions',
    description: 'Permanently delete saved chat sessions and their message logs from disk. Use action="list" to inspect session ids and whether each is deletable; use action="delete" with sessionIds to remove one or more sessions. Open or running sessions cannot be deleted. Deletion is irreversible, so only delete sessions the user explicitly identified.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'delete'],
          description: 'list shows stored sessions and deletability; delete removes the given sessionIds.',
        },
        sessionIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Stored session ids to delete. Required for action="delete"; at most 200.',
        },
      },
      required: ['action'],
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action: { type: 'string' },
          total: { type: 'integer' },
          deletableCount: { type: 'integer' },
          sessions: { type: 'array', items: { type: 'object', additionalProperties: true } },
          deleted: { type: 'array', items: { type: 'string' } },
          failed: { type: 'array', items: { type: 'object', additionalProperties: true } },
        },
        required: ['action'],
      },
      render(_args, value) {
        return [{
          type: 'text',
          text: value.action === 'list' ? renderListResult(value) : renderDeleteResult(value),
        }];
      },
    },
    async execute(args, exec) {
      if (args.action === 'list') {
        return { action: 'list', ...(await cleaner.list({ signal: exec.signal, withTitles: true })) };
      }
      const ids = Array.isArray(args.sessionIds) ? args.sessionIds : [];
      if (ids.length === 0) throw new Error('action="delete" requires a non-empty sessionIds array');
      if (ids.length > MAX_DELETE) throw new Error(`at most ${MAX_DELETE} sessions can be deleted in one call`);
      return { action: 'delete', ...(await cleaner.remove(ids, exec.signal)) };
    },
  };
}

/**
 * Activate the Host half.
 * @param ctx - Host context with persistence, session state, connection, and tools.
 */
export function apply(ctx) {
  const cleaner = new SessionCleaner(ctx);

  /** Send one JSON body with an explicit status. */
  function sendJson(res, status, payload) {
    const text = JSON.stringify(payload);
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': Buffer.byteLength(text),
      'cache-control': 'no-store',
    });
    res.end(text);
  }

  /** Dispatch one authenticated RPC call. */
  async function handleCall(endpoint, payload, signal) {
    try {
      if (endpoint === 'list') {
        return { ok: true, value: await cleaner.list({ signal }) };
      }
      if (endpoint === 'delete') {
        const ids = payload !== null && typeof payload === 'object' && Array.isArray(payload.ids) ? payload.ids : undefined;
        if (ids === undefined || ids.length === 0) {
          return {
            ok: false,
            error: { code: 'session-cleaner/bad-request', message: 'ids must be a non-empty array', details: {} },
          };
        }
        if (ids.length > MAX_DELETE || ids.some((id) => typeof id !== 'string' || id.length === 0 || id.length > 256)) {
          return {
            ok: false,
            error: { code: 'session-cleaner/bad-request', message: `ids must contain at most ${MAX_DELETE} session identities`, details: {} },
          };
        }
        return { ok: true, value: await cleaner.remove(ids, signal) };
      }
      return {
        ok: false,
        error: { code: 'session-cleaner/not-found', message: `unknown endpoint ${JSON.stringify(endpoint)}`, details: {} },
      };
    } catch (error) {
      ctx.logger.warn(`session-cleaner: rpc ${endpoint} failed: ${messageOf(error)}`);
      return {
        ok: false,
        error: { code: 'session-cleaner/failed', message: messageOf(error), details: {} },
      };
    }
  }

  /** One generic Connection RPC channel using the Client carrier's envelope. */
  async function handleRoute(req, res) {
    const admission = ctx.connection.admit(req);
    if ('rejection' in admission) {
      res.writeHead(admission.rejection);
      res.end(admission.rejection === 401 ? 'unauthorized' : 'forbidden');
      return;
    }
    if (admission.peer !== ctx.connection.browserPeer) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end('method not allowed');
      return;
    }
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    if (!pathname.startsWith(`${RPC_CHANNEL}/`)) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    const endpoint = pathname.slice(RPC_CHANNEL.length + 1);
    if (!/^[A-Za-z0-9_$.-]+$/.test(endpoint)) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    const contentType = String(req.headers['content-type'] ?? '').split(';', 1)[0].trim().toLowerCase();
    if (contentType !== 'application/json') {
      res.writeHead(415);
      res.end('content type must be application/json');
      return;
    }
    let body;
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 1_048_576) {
          res.writeHead(413);
          res.end('request body too large');
          return;
        }
        chunks.push(chunk);
      }
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      res.writeHead(400);
      res.end('body is not JSON');
      return;
    }
    if (body === null || typeof body !== 'object'
      || body.type !== 'client-request'
      || typeof body.rpcId !== 'string'
      || body.method !== endpoint) {
      res.writeHead(400);
      res.end('invalid client-request envelope');
      return;
    }
    const controller = new AbortController();
    res.on('close', () => controller.abort());
    const result = await handleCall(endpoint, body.payload, controller.signal);
    if (!res.destroyed && !res.writableEnded) {
      sendJson(res, 200, { type: 'server-response', rpcId: body.rpcId, result });
    }
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: RPC_CHANNEL,
    handler: (req, res) => {
      handleRoute(req, res).catch((error) => {
        ctx.logger.warn(`session-cleaner: route failed: ${messageOf(error)}`);
        if (!res.destroyed && !res.headersSent) {
          res.writeHead(500);
          res.end('internal error');
        }
      });
    },
  }), 'session-cleaner.rpc');

  ctx.effect(() => ctx.tools.register(createTool(cleaner)), 'session-cleaner.delete_sessions');
}
