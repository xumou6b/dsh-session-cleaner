# DSH 会话清理（session-cleaner）

一个本地 DSH 插件：在侧栏的会话列表里开启“多选删除”模式，一次删除多个已保存会话。删除前有确认，删除后按会话分别报告成功或失败。

> 这是本地 bundle，不发布到 npm；包名使用 `@local/session-cleaner`。

## 功能

- **多选开关**：在任意会话行的 `…` 菜单中选择 **“多选删除…”**，进入多选模式；再次选择 **“退出多选”** 关闭。
- **行前勾选框**：进入多选模式后，空闲会话行前会出现勾选框。
- **浮出操作条**：侧栏左下方显示已选数量、**全选可删除**、**清空**、**删除选中**、**退出多选**。
- **删除确认**：确认框列出即将删除的会话，明确提示删除不可恢复。
- **逐项结果**：一次请求删除多个会话，成功与失败分别返回；失败项保留在选中状态，方便重试。
- **保护正在使用的会话**：正在打开或运行的会话不会被删除，勾选框禁用，Host 端也会拒绝。
- **Agent 工具**：同一个操作注册为 `delete_sessions`，模型可用 `action: "list"` 查看可删除状态，或用 `action: "delete"` 批量删除。

## 安装

1. 克隆仓库：

   ```bash
   git clone https://github.com/xumou6b/dsh-session-cleaner.git
   ```

2. 在 DSH 的插件管理/设置中，从本地目录安装这个 bundle（选择克隆下来的 `dsh-session-cleaner` 目录）。等价地，使用 DSH 的 `plugin_manager` 工具：

   ```text
   action: install_bundle
   target: <克隆目录的绝对路径>
   ```

3. 安装后 bundle 默认启用。如果 Web 界面里暂时看不到新的菜单项，刷新一次页面。

> 插件使用 `@local/session-cleaner` 作为包名，不需要 npm 发布，也不需要构建步骤。

## 使用

1. 鼠标移到任意会话行，点右侧 **`…`**，选择 **“多选删除…”**。
2. 勾选要删除的会话，或点浮条上的 **“全选可删除”**。
3. 点 **“删除选中”**，在确认框中点 **“永久删除”**。
4. 查看删除结果；如有失败项，它们会保留在选中状态。

## 工作原理

- **Host 端**：通过 `sessionPersistence` 定位会话目录（优先使用后端的 `locate()`，否则用配置的 `root` 和与后端一致的路径编码），拒绝仍在 `ctx.sessions` / `ctx.agents` 中的会话，删除整个会话目录，再次 `stat` 确认已消失，发出 `api-session/removed`，并让 `sessionQuery` 重新同步 SQLite 索引。
- **Client 端**：通过认证的通用 Connection RPC 通道 `/session-cleaner` 调用 Host；使用三个 slot：
  - `sidebar.workspaces.session.menu.item`：多选开关菜单项；
  - `sidebar.session.row.leading`：行前勾选框；
  - `shell.overlay`：浮出操作条与确认框。
- **Agent 工具**：`delete_sessions` 与 UI 调用同一个 Host 操作，参数和结果语义一致。

## 注意事项

- **删除是永久的**，会移除 `~/.dsh/sessions` 下对应会话的存储目录，无法恢复。重要会话请先备份。
- **正在打开或运行的会话不能删除**，这是为了避免删除仍在写入的会话日志。
- 删除父会话不会级联删除它的子智能体会话；子智能体会话会继续保留。
- 插件依赖当前 DSH 的 `sessionPersistence` 与 `sessionQuery` 服务。若未来版本更换存储后端，删除会以明确错误失败，而不是猜测路径。
- 插件不收集遥测，也不访问外部网络；RPC 只走本机 DSH 连接。

## 目录结构

```text
.
├── package.json          # bundle 清单、dsh.client 声明、exports/files
├── cordis.patch.yml      # 插入 Host 插件行
├── index.js              # Host：删除服务、RPC 通道、delete_sessions 工具
├── client.js             # Client：菜单开关、勾选框、浮条、确认框、样式
├── locale/
│   ├── en.json           # 插件管理页显示元数据
│   └── zh.json
└── icon.svg              # 插件图标
```

## English summary

A local DSH bundle that adds batch session deletion to the sidebar. Open any session's `…` menu and choose **Delete multiple…** to enter multi-select mode; check idle sessions, use the floating bar to select all, clear, delete, or exit, and confirm the irreversible removal. Open or running sessions are protected. The same operation is exposed as the `delete_sessions` agent tool. Install the cloned directory as a local bundle; no build step or npm publish is required.

## License

MIT. See [LICENSE](LICENSE).
