window.__ModuleLoader__.load({
  id: '@local/session-cleaner',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PACKAGE_NAME = '@local/session-cleaner';
    const NS = 'session-cleaner';
    const RPC_CHANNEL = '/session-cleaner';

    const zh = {
      'session.untitled': '未命名会话',
      'toggle.label': '批量删除会话',
      'menu.toggle': '多选删除…',
      'select.row': '选择会话“{title}”',
      'panel.title': '批量删除会话',
      'panel.hint': '勾选左侧会话后一次删除多个；全选会包含未显示的会话。',
      'panel.count': '已选 {n} 个会话',
      'panel.selectAll': '全选可删除',
      'panel.clear': '清空',
      'panel.delete': '删除选中',
      'panel.cancel': '退出多选',
      'panel.hostError': '无法读取可删除状态：{message}',
      'confirm.title': '永久删除 {n} 个会话？',
      'confirm.desc': '会话日志会从磁盘删除，且无法恢复。正在打开或运行的会话不会被删除。',
      'confirm.cancel': '取消',
      'confirm.delete': '永久删除',
      'confirm.busy': '正在删除…',
      'confirm.more': '以及另外 {n} 个会话',
      'dialog.error': '删除失败：{message}',
      'result.title': '删除结果',
      'result.deleted': '已删除 {n} 个会话。',
      'result.failedCount': '{n} 个会话未能删除：',
      'result.more': '以及另外 {n} 个失败。',
      'result.empty': '没有删除任何会话。',
      'result.close': '关闭',
      'error.unknown': '未知错误',
      'error.not-found': '会话不存在',
      'error.live': '会话正在打开或运行',
      'error.unsupported-location': '当前存储无法定位会话文件',
      'error.busy': '会话正在删除中',
      'error.forbidden': '没有权限执行此操作',
      'error.bad-request': '请求无效',
    };

    const en = {
      'session.untitled': 'Untitled session',
      'toggle.label': 'Delete multiple sessions',
      'menu.toggle': 'Delete multiple…',
      'select.row': 'Select session “{title}”',
      'panel.title': 'Delete multiple sessions',
      'panel.hint': 'Check sessions on the left to delete several at once. Select all includes sessions not currently shown.',
      'panel.count': '{n} selected',
      'panel.selectAll': 'Select all deletable',
      'panel.clear': 'Clear',
      'panel.delete': 'Delete selected',
      'panel.cancel': 'Exit multi-select',
      'panel.hostError': 'Couldn’t read deletability: {message}',
      'confirm.title': 'Permanently delete {n} sessions?',
      'confirm.desc': 'Session logs are removed from disk and can’t be recovered. Sessions that are open or running won’t be deleted.',
      'confirm.cancel': 'Cancel',
      'confirm.delete': 'Delete permanently',
      'confirm.busy': 'Deleting…',
      'confirm.more': 'and {n} more sessions',
      'dialog.error': 'Deletion failed: {message}',
      'result.title': 'Deletion result',
      'result.deleted': 'Deleted {n} sessions.',
      'result.failedCount': '{n} sessions could not be deleted:',
      'result.more': 'and {n} more failures.',
      'result.empty': 'No sessions were deleted.',
      'result.close': 'Close',
      'error.unknown': 'Unknown error',
      'error.not-found': 'Session not found',
      'error.live': 'Session is open or running',
      'error.unsupported-location': 'This storage can’t locate session files',
      'error.busy': 'Session is already being deleted',
      'error.forbidden': 'Not allowed',
      'error.bad-request': 'Invalid request',
    };

    const CSS = `
.sc-menu-item{display:flex;align-items:center;gap:8px;width:100%;height:28px;padding:0 8px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:18px;text-align:left;cursor:pointer}
.sc-menu-item:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent)}
.sc-menu-item:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.sc-menu-item[data-active="true"]{color:var(--dsw-alias-state-error-primary)}
.sc-bar{position:fixed;left:12px;bottom:72px;z-index:1500;width:min(272px,calc(100vw - 24px));box-sizing:border-box;display:flex;flex-direction:column;gap:6px;padding:10px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);pointer-events:auto}
.sc-panel-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.sc-panel-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}
.sc-panel-count{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.sc-panel-hint{margin:0;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}
.sc-panel-error{margin:0;font-size:11px;line-height:16px;color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere}
.sc-panel-actions{display:flex;flex-wrap:wrap;gap:4px}
.sc-btn{height:26px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;cursor:pointer;white-space:nowrap}
.sc-btn:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent)}
.sc-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.sc-btn:disabled{opacity:.45;cursor:not-allowed}
.sc-btn-danger{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent);color:var(--dsw-alias-state-error-primary)}
.sc-btn-danger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent)}
.sc-btn-quiet{width:100%;border-color:transparent;color:var(--dsw-alias-label-secondary)}
.sc-check-cell{display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%}
.sc-check{width:14px;height:14px;margin:0;cursor:pointer;accent-color:var(--dsw-alias-brand-primary)}
.sc-check:disabled{cursor:not-allowed;opacity:.45}
.sc-backdrop{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:24px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 62%,transparent);backdrop-filter:blur(2px);pointer-events:auto}
.sc-dialog{width:min(440px,100%);max-height:min(72vh,560px);overflow:auto;box-sizing:border-box;padding:20px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);outline:none}
.sc-dialog-title{margin:0 0 8px;font-size:16px;line-height:24px;font-weight:600}
.sc-dialog-desc{margin:0 0 12px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.sc-confirm-list{list-style:none;margin:0 0 12px;padding:0;display:flex;flex-direction:column;gap:4px;max-height:180px;overflow:auto}
.sc-confirm-item{padding:6px 8px;border-radius:6px;background:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent);font-size:12px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sc-more{margin:0 0 12px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.sc-dialog-error{margin:0 0 12px;padding:8px 10px;border-radius:6px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px;white-space:pre-wrap;overflow-wrap:anywhere}
.sc-dialog-actions{display:flex;justify-content:flex-end;gap:8px}
.sc-result-ok{margin:0 0 10px;font-size:13px;line-height:20px;color:var(--dsw-alias-state-success-primary)}
.sc-result-fail{margin:0 0 12px;font-size:12px;line-height:18px;color:var(--dsw-alias-state-error-primary)}
.sc-result-fail ul{margin:6px 0 0;padding-left:18px}
.sc-result-fail li{overflow-wrap:anywhere}
`;

    function installStyles() {
      const style = document.createElement('style');
      style.dataset.plugin = PACKAGE_NAME;
      style.dataset.pluginCss = `${PACKAGE_NAME}/session-cleaner.css`;
      style.textContent = CSS;
      document.head.appendChild(style);
      return () => style.remove();
    }

    /** Minimal snapshot store with a stable getSnapshot identity. */
    function createStore(initial) {
      let snapshot = initial;
      const listeners = new Set();
      return {
        getSnapshot() {
          return snapshot;
        },
        subscribe(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        set(next) {
          if (next === snapshot) return;
          snapshot = next;
          for (const listener of [...listeners]) listener();
        },
      };
    }

    function useSnapshot(store, selector) {
      const read = () => selector(store.getSnapshot());
      return React.useSyncExternalStore(store.subscribe, read, read);
    }

    function isRetained(row) {
      const retained = row.retainedBy;
      if (retained === undefined || retained === null || typeof retained !== 'object') return false;
      for (const key of Object.keys(retained)) {
        if ((retained[key] ?? 0) > 0) return true;
      }
      return false;
    }

    function messageOf(error) {
      if (error instanceof Error && typeof error.message === 'string' && error.message !== '') return error.message;
      return String(error);
    }

    function reasonText(code, t) {
      switch (code) {
        case 'live':
        case 'running': return t('error.live');
        case 'not-found': return t('error.not-found');
        case 'unsupported-location': return t('error.unsupported-location');
        case 'busy': return t('error.busy');
        case 'forbidden': return t('error.forbidden');
        case 'bad-request': return t('error.bad-request');
        default: return t('error.unknown');
      }
    }

    function TrashIcon({ size = 16 }) {
      return h('svg', {
        viewBox: '0 0 16 16', width: size, height: size, 'aria-hidden': true,
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.4,
        strokeLinecap: 'round', strokeLinejoin: 'round',
      },
      h('path', { d: 'M3.5 4.5h9' }),
      h('path', { d: 'M6 4.5V3.4c0-.5.4-.9.9-.9h2.2c.5 0 .9.4.9.9v1.1' }),
      h('path', { d: 'M4.6 4.5l.5 8c0 .6.5 1 1 1h3.8c.5 0 1-.4 1-1l.5-8' }),
      h('path', { d: 'M6.7 7v4M9.3 7v4' }));
    }

    function ToggleMenuItem(props) {
      const { t, useSelection, toggleMode, useMenuOpenState } = props;
      const [, setMenuOpen] = useMenuOpenState();
      const active = useSelection((state) => state.active);
      const label = active ? t('panel.cancel') : t('menu.toggle');
      return h('button', {
        type: 'button', role: 'menuitem', className: 'sc-menu-item',
        'data-active': active ? 'true' : undefined,
        onClick: () => {
          setMenuOpen(false);
          toggleMode();
        },
      },
      h(TrashIcon, { size: 14 }),
      h('span', null, label));
    }

    function SelectionBar(props) {
      const {
        t, useSelection, useSessions, selectAll, clearSelection,
        requestDelete, exitSelection,
      } = props;
      const active = useSelection((state) => state.active);
      const count = useSelection((state) => state.selected.size);
      const busy = useSelection((state) => state.busy);
      const hostById = useSelection((state) => state.hostById);
      const hostPhase = useSelection((state) => state.hostPhase);
      const hostError = useSelection((state) => state.hostError);
      const list = useSessions((state) => state);
      const eligible = React.useMemo(() => {
        let total = 0;
        for (const id of list.ids) {
          const row = list.byId[id];
          if (row === undefined || row.blank) continue;
          const entry = hostById[id];
          if (entry !== undefined ? entry.deletable : (!row.running && !isRetained(row))) total += 1;
        }
        return total;
      }, [list, hostById]);

      if (!active) return null;

      return h('div', { className: 'sc-bar', role: 'group', 'aria-label': t('panel.title') },
        h('div', { className: 'sc-panel-head' },
          h('span', { className: 'sc-panel-title' }, t('panel.title')),
          h('span', { className: 'sc-panel-count' }, t('panel.count', { n: count }))),
        h('p', { className: 'sc-panel-hint' }, t('panel.hint')),
        hostPhase === 'error' && h('p', { className: 'sc-panel-error', role: 'alert' },
          t('panel.hostError', { message: hostError ?? t('error.unknown') })),
        h('div', { className: 'sc-panel-actions' },
          h('button', {
            type: 'button', className: 'sc-btn',
            disabled: busy || eligible === 0 || count === eligible,
            onClick: selectAll,
          }, t('panel.selectAll')),
          h('button', {
            type: 'button', className: 'sc-btn',
            disabled: busy || count === 0, onClick: clearSelection,
          }, t('panel.clear')),
          h('button', {
            type: 'button', className: 'sc-btn sc-btn-danger',
            disabled: busy || count === 0, onClick: requestDelete,
          }, t('panel.delete'))),
        h('button', {
          type: 'button', className: 'sc-btn sc-btn-quiet',
          disabled: busy, onClick: exitSelection,
        }, t('panel.cancel')));
    }

    function RowCheckbox(props) {
      const { sessionId, t, useSelection, useSessions, toggleSession, isRowDeletable } = props;
      const active = useSelection((state) => state.active);
      const checked = useSelection((state) => state.selected.has(sessionId));
      const hostEntry = useSelection((state) => state.hostById[sessionId]);
      const row = useSessions((state) => state.byId[sessionId]);
      if (!active || row === undefined) return null;
      const deletable = hostEntry !== undefined ? hostEntry.deletable : isRowDeletable(row);
      const reason = hostEntry !== undefined
        ? hostEntry.reason
        : (row.running ? 'running' : (isRetained(row) ? 'live' : null));
      return h('span', {
        className: 'sc-check-cell',
        onClick: (event) => event.stopPropagation(),
      },
      h('input', {
        type: 'checkbox', className: 'sc-check', checked,
        disabled: !deletable,
        title: deletable ? undefined : reasonText(reason, t),
        'aria-label': t('select.row', { title: row.displayTitle || t('session.untitled') }),
        onChange: () => toggleSession(sessionId),
      }));
    }

    function failureText(failure, t) {
      if (failure.code === 'io' && typeof failure.message === 'string' && failure.message !== '') return failure.message;
      return reasonText(failure.code, t);
    }

    function SessionCleanerDialog(props) {
      const {
        t, useSelection, useSessions, closeDialog, confirmDelete, closeResult,
      } = props;
      const confirmOpen = useSelection((state) => state.confirmOpen);
      const busy = useSelection((state) => state.busy);
      const result = useSelection((state) => state.result);
      const error = useSelection((state) => state.error);
      const selected = useSelection((state) => state.selected);
      const list = useSessions((state) => state);
      const dialogRef = React.useRef(null);
      const cancelRef = React.useRef(null);

      React.useEffect(() => {
        if (!confirmOpen) return;
        const previous = document.activeElement;
        const timer = window.setTimeout(() => {
          if (cancelRef.current !== null) cancelRef.current.focus();
          else if (dialogRef.current !== null) dialogRef.current.focus();
        }, 0);
        return () => {
          window.clearTimeout(timer);
          if (previous !== null && typeof previous.focus === 'function') previous.focus();
        };
      }, [confirmOpen]);

      React.useEffect(() => {
        if (!confirmOpen || result === null) return;
        if (dialogRef.current !== null) dialogRef.current.focus();
      }, [confirmOpen, result]);

      React.useEffect(() => {
        if (!confirmOpen) return undefined;
        const onKeyDown = (event) => {
          if (event.key !== 'Escape' || busy) return;
          event.preventDefault();
          if (result !== null) closeResult();
          else closeDialog();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
      }, [confirmOpen, busy, result, closeDialog, closeResult]);

      React.useEffect(() => {
        if (!confirmOpen || result !== null || selected.size > 0) return;
        closeDialog();
      }, [confirmOpen, result, selected, closeDialog]);

      if (!confirmOpen) return null;

      const selectedIds = [...selected];
      const titleFor = (id) => {
        const row = list.byId[id];
        return row !== undefined && row.displayTitle !== '' ? row.displayTitle : t('session.untitled');
      };

      const onDialogKeyDown = (event) => {
        if (event.key !== 'Tab') return;
        const root = dialogRef.current;
        if (root === null) return;
        const focusable = [...root.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
        if (focusable.length === 0) {
          event.preventDefault();
          root.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };

      if (result !== null) {
        const deleted = Array.isArray(result.deleted) ? result.deleted : [];
        const failed = Array.isArray(result.failed) ? result.failed : [];
        return h('div', {
          className: 'sc-backdrop',
          onMouseDown: (event) => { if (event.target === event.currentTarget) closeResult(); },
        },
        h('div', {
          className: 'sc-dialog', role: 'dialog', 'aria-modal': 'true',
          'aria-labelledby': 'sc-dialog-title', tabIndex: -1,
          ref: dialogRef, onKeyDown: onDialogKeyDown,
        },
        h('h2', { id: 'sc-dialog-title', className: 'sc-dialog-title' }, t('result.title')),
        deleted.length > 0 && h('p', { className: 'sc-result-ok' }, t('result.deleted', { n: deleted.length })),
        failed.length > 0 && h('div', { className: 'sc-result-fail' },
          h('p', { style: { margin: 0 } }, t('result.failedCount', { n: failed.length })),
          h('ul', null, failed.slice(0, 10).map((failure) => h('li', { key: failure.id },
            `${titleFor(failure.id)}: ${failureText(failure, t)}`))),
          failed.length > 10 && h('p', { style: { margin: '6px 0 0' } }, t('result.more', { n: failed.length - 10 }))),
        deleted.length === 0 && failed.length === 0 && h('p', { className: 'sc-dialog-desc' }, t('result.empty')),
        h('div', { className: 'sc-dialog-actions' },
          h('button', { type: 'button', className: 'sc-btn', onClick: closeResult }, t('result.close')))));
      }

      const preview = selectedIds.slice(0, 6);
      const hidden = Math.max(0, selectedIds.length - preview.length);
      return h('div', {
        className: 'sc-backdrop',
        onMouseDown: (event) => { if (event.target === event.currentTarget && !busy) closeDialog(); },
      },
      h('div', {
        className: 'sc-dialog', role: 'dialog', 'aria-modal': 'true',
        'aria-labelledby': 'sc-dialog-title', 'aria-describedby': 'sc-dialog-desc',
        tabIndex: -1, ref: dialogRef, onKeyDown: onDialogKeyDown,
      },
      h('h2', { id: 'sc-dialog-title', className: 'sc-dialog-title' }, t('confirm.title', { n: selectedIds.length })),
      h('p', { id: 'sc-dialog-desc', className: 'sc-dialog-desc' }, t('confirm.desc')),
      preview.length > 0 && h('ul', { className: 'sc-confirm-list' }, preview.map((id) => h('li', {
        key: id, className: 'sc-confirm-item', title: titleFor(id),
      }, titleFor(id)))),
      hidden > 0 && h('p', { className: 'sc-more' }, t('confirm.more', { n: hidden })),
      error !== null && h('p', { className: 'sc-dialog-error', role: 'alert' }, t('dialog.error', { message: error })),
      h('div', { className: 'sc-dialog-actions' },
        h('button', {
          type: 'button', className: 'sc-btn', ref: cancelRef,
          disabled: busy, onClick: closeDialog,
        }, t('confirm.cancel')),
        h('button', {
          type: 'button', className: 'sc-btn sc-btn-danger',
          disabled: busy || selectedIds.length === 0, onClick: confirmDelete,
        }, busy ? t('confirm.busy') : t('confirm.delete')))));
    }

    function apply(ctx) {
      const store = createStore({
        active: false,
        selected: new Set(),
        busy: false,
        confirmOpen: false,
        result: null,
        error: null,
        hostPhase: 'idle',
        hostById: {},
        hostError: null,
      });
      let refreshController = null;

      const patch = (part) => {
        store.set({ ...store.getSnapshot(), ...part });
      };

      const connection = () => ctx.get('connection');

      async function call(endpoint, payload, signal) {
        const client = connection();
        if (client === undefined || client.rpc === undefined || typeof client.rpc.call !== 'function') {
          throw new Error('the Host connection service is unavailable');
        }
        const result = await client.rpc.call(RPC_CHANNEL, endpoint, payload, signal);
        if (result === null || typeof result !== 'object' || result.ok !== true) {
          const failure = result !== null && typeof result === 'object' ? result.error : undefined;
          const error = new Error(failure !== undefined && typeof failure.message === 'string' && failure.message !== ''
            ? failure.message
            : 'the session-cleaner Host service rejected the request');
          error.code = failure !== undefined ? failure.code : undefined;
          throw error;
        }
        return result.value;
      }

      const isRowDeletable = (row) => {
        const state = store.getSnapshot();
        const entry = state.hostById[row.id];
        if (entry !== undefined) return entry.deletable;
        return !row.running && !isRetained(row);
      };

      async function refreshHost() {
        if (refreshController !== null) refreshController.abort();
        const controller = new AbortController();
        refreshController = controller;
        patch({ hostPhase: 'loading', hostError: null });
        try {
          const value = await call('list', {}, controller.signal);
          if (controller.signal.aborted) return;
          const byId = {};
          const sessions = value !== null && typeof value === 'object' && Array.isArray(value.sessions) ? value.sessions : [];
          for (const entry of sessions) {
            if (entry !== null && typeof entry === 'object' && typeof entry.id === 'string') byId[entry.id] = entry;
          }
          const state = store.getSnapshot();
          const selected = new Set([...state.selected].filter((id) => byId[id] !== undefined && byId[id].deletable));
          store.set({ ...state, hostPhase: 'ready', hostById: byId, hostError: null, selected });
        } catch (error) {
          if (controller.signal.aborted) return;
          patch({ hostPhase: 'error', hostError: messageOf(error) });
        } finally {
          if (refreshController === controller) refreshController = null;
        }
      }

      function toggleSession(id) {
        const state = store.getSnapshot();
        if (!state.active) return;
        const entry = state.hostById[id];
        if (entry !== undefined && !entry.deletable) return;
        const selected = new Set(state.selected);
        if (selected.has(id)) selected.delete(id);
        else selected.add(id);
        store.set({ ...state, selected });
      }

      function selectAll() {
        const state = store.getSnapshot();
        const list = ctx.sessions.list.getSnapshot();
        const selected = new Set();
        for (const id of list.ids) {
          const row = list.byId[id];
          if (row === undefined || row.blank) continue;
          const entry = state.hostById[id];
          if (entry !== undefined ? entry.deletable : (!row.running && !isRetained(row))) selected.add(id);
        }
        store.set({ ...state, selected });
      }

      function clearSelection() {
        const state = store.getSnapshot();
        store.set({ ...state, selected: new Set() });
      }

      function exitSelection() {
        if (refreshController !== null) refreshController.abort();
        refreshController = null;
        store.set({
          ...store.getSnapshot(),
          active: false,
          selected: new Set(),
          busy: false,
          confirmOpen: false,
          result: null,
          error: null,
          hostPhase: 'idle',
          hostById: {},
          hostError: null,
        });
      }

      function enterSelection() {
        store.set({
          ...store.getSnapshot(),
          active: true,
          selected: new Set(),
          busy: false,
          confirmOpen: false,
          result: null,
          error: null,
          hostPhase: 'loading',
          hostById: {},
          hostError: null,
        });
        void refreshHost();
      }

      function toggleMode() {
        if (store.getSnapshot().active) exitSelection();
        else enterSelection();
      }

      function requestDelete() {
        const state = store.getSnapshot();
        if (!state.active || state.busy || state.selected.size === 0) return;
        patch({ confirmOpen: true, result: null, error: null });
      }

      function closeDialog() {
        if (store.getSnapshot().busy) return;
        patch({ confirmOpen: false, error: null });
      }

      async function confirmDelete() {
        const state = store.getSnapshot();
        if (!state.active || state.busy || state.selected.size === 0) return;
        const ids = [...state.selected];
        patch({ busy: true, error: null, result: null });
        try {
          const value = await call('delete', { ids });
          const deleted = value !== null && typeof value === 'object' && Array.isArray(value.deleted) ? value.deleted : [];
          const failed = value !== null && typeof value === 'object' && Array.isArray(value.failed) ? value.failed : [];
          const removed = new Set(deleted);
          const current = store.getSnapshot();
          store.set({
            ...current,
            busy: false,
            selected: new Set(ids.filter((id) => !removed.has(id))),
            result: { deleted, failed },
            error: null,
          });
          void refreshHost();
        } catch (error) {
          patch({ busy: false, error: messageOf(error) });
        }
      }

      function closeResult() {
        const state = store.getSnapshot();
        const failed = state.result !== null && Array.isArray(state.result.failed) ? state.result.failed.length : 0;
        if (failed === 0) {
          exitSelection();
          return;
        }
        patch({ result: null, confirmOpen: false, error: null });
      }

      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'session-cleaner locale');
      ctx.effect(() => installStyles(), 'session-cleaner styles');

      const useSelection = (selector) => useSnapshot(store, selector);
      const useSessions = (selector) => useSnapshot(ctx.sessions.list, selector);
      const shared = () => ({
        useSelection,
        useSessions,
        toggleMode,
        toggleSession,
        selectAll,
        clearSelection,
        exitSelection,
        requestDelete,
        closeDialog,
        confirmDelete,
        closeResult,
        isRowDeletable,
      });

      ctx.slots.inject('sidebar.workspaces.session.menu.item', () => ctx.slots.register({
        name: 'sidebar.workspaces.session.menu.item',
        id: 'session-cleaner-toggle',
        order: 50,
        locale: NS,
        inject: shared,
      }, ToggleMenuItem));

      ctx.slots.inject('sidebar.session.row.leading', () => ctx.slots.register({
        name: 'sidebar.session.row.leading',
        id: 'session-cleaner-check',
        order: 10,
        locale: NS,
        inject: shared,
      }, RowCheckbox));

      ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'session-cleaner-bar',
        order: 900,
        locale: NS,
        inject: shared,
      }, SelectionBar));

      ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'session-cleaner-dialog',
        order: 1000,
        locale: NS,
        inject: shared,
      }, SessionCleanerDialog));
    }

    return {
      inject: ['slots', 'locale', 'sessions', 'connection'],
      apply,
    };
  },
});
