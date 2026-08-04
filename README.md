# Codex简体中文汉化脚本

Codex 客户端（app://openai-codex）全界面简体中文化用户脚本。

## 背景

Codex++ 脚本市场中的原版「Codex简体中文汉化」脚本（`zh_CN汉化.user.js` v1.0）存在致命 bug：使用了不存在的 API `document.createObserver`，导致脚本一启动即抛 `TypeError`，完全无法生效；且词表仅 10 条，覆盖不足。

本项目为**修复 + 增强版**（v1.7）：

- 修复 `document.createObserver` 崩溃 bug，改用标准 `new MutationObserver`
- 词表 163 条，覆盖侧边栏 / 主面板 / 新建项目 / 插件 / 文档 / 帮助 / 运行环境 / 内置浏览器 / 推理强度选择器等
- 同时翻译 `aria-label` / `title` / `placeholder` / `alt` 属性文本（纯图标按钮也能翻）
- 上下文识别：`Light` 在主题选择器中译「浅色」，在推理强度（Effort）选择器中译「低」
- 省略号归一化（兼容 `...` 与 `…`、多余空白、换行）
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
