# Codex简体中文汉化脚本

Codex 客户端（app://- 或 app://openai-codex）全界面简体中文化用户脚本。

## ⚠️ v3.2 运行机制（2026-09）

Codex 客户端升级后页面 URL 从 `app://openai-codex/*` 变为 `app://-/*`，且 **Codex++ 8 月起不再自动注入本地 user_scripts**（脚本逻辑本身仍兼容新版页面，已通过 CDP 验证 681 词条全部生效）。

因此 v3.0 起提供**独立注入器**方案，脱离 Codex++ 注入机制，客户端升级不再受影响；v3.1 补齐常驻可靠性；v3.2 修复启动链路与编码问题：

1. `codex_zh_injector.py`：常驻进程，每 3 秒通过 ChatGPT 客户端调试端口（127.0.0.1:9229）检测页面，未注入则注入本脚本（UTF-8 经 TextDecoder 正确解码，避免乱码）
   - **注入判据（v3.2）**：以页面上的版本标记 `window.__ZH_INJ_HASH__` 为准，页面刷新/导航后标记丢失即自动重注入；不再依赖页面文本是否已渲染，避免加载早期误判为「未汉化」而反复注入
   - **词表热更新**：脚本文件内容变化（MD5）时自动重新注入，改词表后无需重启客户端
   - **单实例保护**：占用本地端口 47653，重复启动自动退出
   - **日志**：`%APPDATA%\Codex++\zh_injector.log`
2. `codex_zh_watchdog.py`：看门狗，探测注入器单实例端口，已退出则拉起。由两种方式调用：
   - 开机自启：`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\codex-zh-injector.vbs`（pythonw 静默运行）
   - 计划任务 `CodexZhInjectorWatchdog`：每 5 分钟检查一次并自愈（`schtasks /Run /TN CodexZhInjectorWatchdog` 可手动触发）
3. `activate_chatgpt.py`：**一键启动**。ChatGPT 桌面端为微软商店 MSIX 包（OpenAI.Codex），
   普通方式激活无法传命令行参数、直接运行 exe 会因包身份丢失导致 GPU 崩溃。本脚本用
   `IApplicationActivationManager::ActivateApplication` 激活，既保留包身份又传入
   `--remote-debugging-port=9229 --remote-allow-origins=*`。桌面双击 `ChatGPT汉化启动.bat` 即用。
   v3.2 加固：AUMID 自动解析、等旧进程彻底退出后再激活、最多重试 3 轮、写 `zh_launcher.log`。
4. 手动恢复注入：双击桌面 `Codex汉化注入器.bat`
5. 运行前提：ChatGPT 客户端需带 `--remote-debugging-port=9229` 启动（用上面的启动器即可）

> **📌 编码红线（v3.2 教训）**：`ChatGPT汉化启动.bat`、`Codex汉化注入器.bat`、`codex-zh-injector.vbs`
> **必须保持 GBK/ANSI 编码**。cmd.exe 与 WScript 在文件无 BOM 时按系统 ANSI 代码页解析，
> 用 UTF-8 保存且含中文会导致命令行解析错乱——表现为「双击 bat 毫无反应、返回码却是 0」。
> 编辑这些文件时请勿另存为 UTF-8。（`chcp 65001` 只能改控制台输出，救不了文件解析。）

**使用本注入器后，`@match` 与 Codex++ 用户脚本是否注入已无关紧要**——注入器直接写页面。

### 排障速查

| 现象 | 处理 |
| --- | --- |
| 双击启动 bat 毫无反应（窗口一闪/秒退） | **先查 bat 是否被存成了 UTF-8**，须为 GBK；v3.2 已修正 |
| 一键启动后客户端没起来 / 起来但无调试端口 | 双击桌面 `ChatGPT汉化启动.bat`（带参激活，保留包身份）；失败看 `%APPDATA%\Codex++\zh_launcher.log` |
| 注入器日志报 `Handshake status 403 Forbidden` | 新版 Chromium 的 CDP Origin 校验；启动器已加 `--remote-allow-origins=*`，注入器已加 `suppress_origin`，v3.2 起免疫 |
| 界面全英文 | 双击桌面 `Codex汉化注入器.bat`，5-10 秒后恢复 |
| 启动器报「第 N 次尝试」后失败 | 看 `zh_launcher.log`：多为商店更新后包名变化，AUMID 会自动重解析；仍失败说明客户端安装异常 |
| 部分词条未翻译 | 确认词表文件已更新（注入器会自动热更新）；仍未生效则看日志 |
| 改了词表不生效 | 检查 `zh_injector.log` 是否出现「脚本已更新，重新注入」 |
| 完全无反应 | 查 `zh_injector.log`；确认 9229 端口在监听（`netstat -ano \| findstr 9229`） |
| 客户端调试端口变了 | 改 `codex_zh_injector.py` 顶部 `DEBUG_PORTS` 与 `activate_chatgpt.py` 的 `ARGS` |

## 背景

Codex++ 脚本市场中的原版「Codex简体中文汉化」脚本（`zh_CN汉化.user.js` v1.0）存在致命 bug：使用了不存在的 API `document.createObserver`，导致脚本一启动即抛 `TypeError`，完全无法生效；且词表仅 10 条，覆盖不足。

本项目为**修复 + 增强版**（现 v3.2）：

- 修复 `document.createObserver` 崩溃 bug，改用标准 `new MutationObserver`
- 词表 676 条，覆盖侧边栏 / 主面板 / 新建项目 / 插件 / 文档 / 帮助 / 运行环境 / 内置浏览器 / 推理强度选择器 / 设置页 / 键盘快捷键页 / 定时任务 / 工具栏等
- 同时翻译 `aria-label` / `title` / `placeholder` / `alt` 属性文本（纯图标按钮也能翻，含含变量名的标签如「X 的项目操作」）
- 上下文识别：`Light` 在主题选择器中译「浅色」，在推理强度（Effort）选择器中译「低」；`On` 在频率设置中译「于」，开关按钮译「开」
- 省略号归一化（兼容 `...` 与 `…`、多余空白、换行）、弯引号归一化
- 只做整段文本匹配，**不误翻代码块与用户消息**（跳过 pre/code/textarea/可编辑区域）
- MutationObserver + 2s 定时补扫，应对 React 重渲染

## 安装

1. 打开 Codex++ 管理控制台 → 用户脚本 → 导入 `codex-zhcn-translate.user.js`
2. 或手动复制到用户脚本目录（Windows）：

   ```
   %APPDATA%\Codex++\user_scripts\market-codex-zhcn-translate.js
   ```

3. 重启 Codex++，进入 Codex 客户端即生效

## 重要提醒

⚠️ **不要在管理控制台对该脚本点「更新/升级」**——Codex++ 脚本市场的原版仍是坏版本（v1.0），点击会把本修复覆盖回损坏状态。市场端更新需联系原仓库作者。

## 版权与许可

- 原脚本作者：BigPizzaV3（仓库：hL091015/CodexPlusPlusScriptMarket）
- 本项目基于原脚本修复增强，发布者对其修改部分负责

## 版本历史

- **v3.2** — 修复「一键启动 bat 双击无反应」：根因是 **bat 文件编码**——cmd.exe 解析 bat 时按系统 ANSI(GBK) 而非控制台代码页，此前用 UTF-8 保存导致 `echo` 行错乱、**Python 调用整行被吞掉**（bat 返回 0 却什么都没做）。三个脚本（启动 bat / 注入 bat / 开机自启 vbs）全部改用 **GBK 编码**保存；同时加固：①`activate_chatgpt.py` 重写为健壮版——AUMID 从 WindowsApps 自动解析（商店升级后包名/版本变化自适应）、杀旧实例后**等待进程彻底退出**再激活（MSIX 强杀后立即激活必失败）、整流程最多重试 3 轮、全程写 `zh_launcher.log`；②注入器改用**页面版本标记**（`window.__ZH_INJ_HASH__`）判断是否需要注入，不再依赖页面文本是否已渲染，彻底消除加载早期的「注入未确认」误报与重复注入；③脚本新增 **attributes 监听**（React 单独改写 aria-label/title 时也即时重译）+ 可编辑区域属性补扫；词表 676 → 681 条（打开帮助菜单等）
- **v3.1.1** — 排查「Codex++ 一键启动失灵」：确认客户端为微软商店 MSIX 包（OpenAI.Codex），普通激活无法传命令行参数导致调试端口不开；新增 `activate_chatgpt.py`（COM `IApplicationActivationManager` 带参激活，保留包身份，避免直接运行 exe 的 GPU 崩溃）+ 桌面 `ChatGPT汉化启动.bat`；适配新版 Chromium 的 CDP WebSocket Origin 校验（403）：启动参数加 `--remote-allow-origins=*`、注入器 websocket 加 `suppress_origin`；注入器改多端口探测（9229/9222/9223/9230/9333）
- **v3.1** — 修复汉化失效（注入器进程未常驻）：新增 `codex_zh_watchdog.py` 看门狗 + Windows 计划任务 `CodexZhInjectorWatchdog`（每 5 分钟自愈），VBS 与桌面 bat 统一走 watchdog 入口；注入器新增**词表热更新**（脚本 MD5 变化即重新注入，改词条不再需要重启客户端）、单实例保护、UTF-8 日志；词表 650 → 676 条（顶栏 Update → 更新、工具栏与无障碍 aria-label 一批、含变量名标签正则，如「X 的项目操作」）
- **v3.0** — 修复页面 URL 升级变化导致的 @match 失效（`app://openai-codex` → `app://-`，双规则兼容）；新增独立 CDP 注入器方案（codex_zh_injector.py + 开机自启），脱离 Codex++ 注入机制，升级不受影响
- **v2.9.14** — 补漏：定时任务自动化输出卡片 4 条（Automation → 自动化 / Automation ID → 自动化 ID / Automation memory → 自动化记忆 / Last run → 上次运行）
- **v2.9.13** — 补漏：Composer 建议卡 React split-text 独立片段 4 条（for a topic I'm exploring / after comparing options / for an upcoming meeting / for a strategy or project），处理整段词条被 React 拆成独立文本节点的情况
- **v2.9.12** — 补漏：Composer 加号 → 请求审批下拉 4 条（How should ChatGPT actions be approved? / Always ask to edit external files and use the internet / Custom (config.toml) / Uses permissions defined in config.toml）
- **v2.9.11** — 补漏：插件市场添加（Add plugin marketplace / Add a marketplace / Add MCP server）+ Allow network access（Allow network access + 完整描述）+ 临时对话（Temporary chat + 描述），7 条
- **v2.9.10** — 补漏：侧边栏聊天卡片标签（Runs on your computer → 在你的电脑上运行 / Scheduled task run → 定时任务运行），2 条
- **v2.9.9** — 补漏：新建项目对话框 Output 分类标题 Outputs → 输出，1 条
- **v2.9.8** — 补漏：Preferences 页标题 → 偏好设置 + 差异标记下拉选项 Color +/- markers → 颜色 +/- 标记，2 条
- **v2.9.7** — 补漏：Composer Follow-up behavior 长描述（Queue follow-ups while ChatGPT runs or steer the current run. Press Ctrl+↩ to do the opposite for one message），1 条
- **v2.9.6** — 补漏：偏好设置底部面板区（Default terminal location / Choose where the terminal shortcut and environment actions open terminal tabs）+ 插件开关（Allow ChatGPT to use installed plugins），3 条；Composer 功能名保留英文不译
- **v2.9.5** — 补漏：GitHub Pull Requests 视图（Pull requests → 拉取请求 / GitHub CLI setup required / GitHub CLI (gh) is not installed / Check again），4 条
- **v2.9.4** — 新增动态模式正则兜底：「See X, Y, and N more」→ 查看更多插件、「N plugins/skills」→ N 个插件/技能
- **v2.9.3** — 补漏：Codex++ 顶部「创建」下拉（Create with Codex → 使用 Codex 创建 / Set up manually → 手动设置），2 条
- **v2.9.2** — 补漏：Ask for approval → 请求审批 / custom → 自定义 / Send shortcut 下拉子项（^ + Enter for multiline prompts / ^ + Enter always），共 4 条
- **v2.9.1** — On 译为「开」（原为「于」）；新增上下文识别：频率设置（On Friday/Weekdays 上下文）仍译「于」，开关按钮译「开」；Pinned 译为「已安排」（侧边栏分组实际放的是定时任务列表，"已固定"易误解）
- **v2.9** — 补漏：创建插件下拉（Create plugin/Add marketplace）+ 聊天右键菜单（Pin chat/Mark as unread/Continue in new worktree/Add scheduled task...），6 条
- **v2.8** — 补漏：外观页（Light theme/Dark theme/Import/Copy theme/Accent/Background/Foreground）+ Preferences（Use pointer cursors/Reduce motion/Off/UI font size/Code font size/Diff markers 等），约 19 条
- **v2.7** — 补漏：项目区空状态 No projects → 暂无项目
- **v2.6** — 补漏：项目右键菜单（Unpin project / Open in Explorer）+ 工作模式描述（Create, learn, and explore / Build, debug, and ship）+ 更新提示（ChatGPT is up to date.）+ OK 按钮，6 条
- **v2.5** — 键盘快捷键页全部动作名+描述（约 160 条：对话/导航/标签页/面板/Git与PR/Composer/复制编辑/浏览器/技能/杂项）；Unassigned → 未分配（总 580+）
- **v2.4** — 补 Sort chats by 下拉（Priority/Last updated/Manual order）+ Quit ChatGPT 等 5 条；提醒 v2.3 的 "What should we build?" 需重启生效（总 424）
- **v2.3** — 批量补 Configuration 全部面板 + 子项、Personalization、Pets、Browser、Computer use、Hooks、Git、Environments、Worktrees、Composer 提示卡、Plugins marketplace 子页等约 130 条新增（总 419）；键盘快捷键页（100+ 项）本轮跳过
- **v2.2** — 补 Skills 页 + 设置页全部面板 + 通知 + Composer + 设置侧边栏等约 52 条；norm() 新增弯引号归一化（兼容 "it's"/"it’s" 等）
- **v2.1** — 批量补项目页 / 定时任务 / 插件面板 / 创建项目 / 侧边栏 / 详情面板 等 UI 标签与筛选器（约 69 条新增，总 237）
- **v2.0** — 新增元素级整段翻译（处理 React 用 `<strong>`/`<em>` 等把文本切碎的盲区，如建议项「Create a **new** document」）
- **v1.9** — 修 translateAttributes 漏遍后代元素的 bug（walk 新增 SHOW_ELEMENT 遍历）；输入框 placeholder、tooltip title、aria-label 等现在任意层级都生效
- **v1.8** — 补聊天输入框「Figure out next steps ...」系列建议（想好下一步）
- **v1.7** — 发布版（与本地 v1.6 功能一致，版本号统一为 1.7）
- v1.6 — 修上下文识别（同时认 `effort` 与已翻译的「推理强度」标记）+ 省略号/空白归一化
- v1.5 — 补推理强度选择器（Effort/Low/Medium/High/Extra High）+ Light 上下文识别
- v1.4 — 补 Search projects / New project / Browser 等
- v1.3 — 按用户实际截图补全词表（侧边栏/主面板/新建项目/插件/文档/帮助/运行环境/浏览器标签）
- v1.2 — 词表扩至 105 条 + 属性翻译 + 代码块保护 + 定时补扫
- v1.1 — 修复 document.createObserver 崩溃
- v1.0 — 原版（存在崩溃 bug，勿用）
