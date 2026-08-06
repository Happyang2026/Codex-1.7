// ==UserScript==
// @name         Codex简体中文汉化
// @namespace    http://tampermonkey.net/
// @version      2.9.8
// @description  Codex简体中文汉化补丁（v2.9.8：补 Preferences 页标题 + 差异标记下拉选项 2 条——Preferences/Color +/- markers）
// @author       BigPizzaV3 (enhanced)
// @match        app://openai-codex/*
// @grant        none
// ==/UserScript==
(function () {
  "use strict";

  // 词表：整段文本匹配（大小写不敏感），避免把代码/用户消息里的单词误翻
  var DICT = [
    // === v1.3 用户实际截图补全 ===
    // 侧边栏顶部
    ["Recents", "最近"],
    ["Plugins", "插件"],
    ["Scheduled", "定时任务"],
    ["Projects", "项目"],
    ["Work", "工作"],
    // 窗口菜单
    ["File", "文件"],
    ["View", "视图"],
    // 主面板 / 欢迎页
    ["What should we work on?", "今天要做什么？"],
    ["Finish Windows setup to continue", "完成 Windows 设置以继续"],
    ["Finish setup before creating files, editing code, or taking actions", "完成设置后才能创建文件、编辑代码或执行操作"],
    ["Work with ChatGPT", "与 ChatGPT 对话"],
    ["Choose project", "选择项目"],
    ["Connect plugins", "连接插件"],
    ["Browse all plugins", "浏览全部插件"],
    ["Create a file or build a site", "创建文件或构建站点"],
    ["Research and plan next steps", "研究并规划下一步"],
    ["Automate routine and recurring work", "自动化日常重复工作"],
    ["Add files and more", "添加文件等"],
    ["Files and folders", "文件和文件夹"],
    ["Work in a project", "在项目中工作"],
    ["Start a chat in a project", "在项目内开启对话"],
    ["Set a goal to keep pursuing", "设定一个持续追求的目标"],
    ["Turn plan mode on", "开启计划模式"],
    ["Goal", "目标"],
    ["Plan mode", "计划模式"],
    // 新建项目对话框
    ["Create project", "创建项目"],
    ["Project name", "项目名称"],
    ["Source folders", "源文件夹"],
    ["Add folders ChatGPT can read and edit", "添加 ChatGPT 可读写的文件夹"],
    // 插件面板
    ["Search plugins…", "搜索插件…"],
    ["No connected plugins", "暂无已连接插件"],
    // 新建文档
    ["Create a new document", "新建文档"],
    ["Create a new spreadsheet", "新建电子表格"],
    ["Create a new presentation", "新建演示文稿"],
    ["Create a new website", "新建网站"],
    // 帮助菜单
    ["System Status", "系统状态"],
    ["Task Manager", "任务管理器"],
    ["Start Performance Trace", "启动性能追踪"],
    // 运行环境选择
    ["Where should this chat run?", "本次对话在哪里运行？"],
    ["On your computer", "在你的电脑上"],
    ["Read and edit local files with permission", "经授权后读写本地文件"],
    ["In the cloud", "在云端"],
    ["Can't access local files unless attached", "未附加文件时无法访问本地文件"],
    // 内置浏览器标签
    ["Toggle side panel", "切换侧边栏"],
    ["New tab", "新建标签页"],
    ["Enter a URL", "输入网址"],
    ["Start browsing", "开始浏览"],
    ["Enter a URL to open a page", "输入网址以打开网页"],

    // v1.4 新增
    ["Search projects", "搜索项目"],
    ["New project", "新建项目"],
    ["Browser", "浏览器"],
    ["Work with ChatGPT across your favorite tools", "在你常用的工具中使用 ChatGPT"],

    // v1.5 新增：推理强度选择器 + 重置按钮
    ["Reset to default", "重置为默认"],
    ["Effort", "推理强度"],
    ["Medium", "中等"],
    ["High", "高"],
    ["Extra High", "极高"],
    ["Low", "低"],

    // v1.8 新增：聊天输入框"Figure out next steps"系列建议
    ["Figure out next steps", "想好下一步"],
    ["Figure out next steps for a topic I'm exploring", "为正在探索的课题想好下一步"],
    ["Figure out next steps after comparing options", "比较方案后想好下一步"],
    ["Figure out next steps for an upcoming meeting", "为即将到来的会议想好下一步"],
    ["Figure out next steps for a strategy or project", "为战略或项目想好下一步"],

    // v2.1 批量补：项目页 / 定时任务 / 插件面板 / 创建项目 / 侧边栏 / 详情面板
    // 项目页
    ["Search projects", "搜索项目"],
    ["Search plugins", "搜索插件"],
    ["Type to search for files", "输入关键词搜索文件"],
    ["Name", "名称"],
    ["Updated", "最近更新"],
    ["Edit project", "编辑项目"],
    ["Add source", "添加源文件夹"],
    ["Archive chats", "归档对话"],
    ["Forward", "前进"],
    // 定时任务
    ["Scheduled tasks", "定时任务"],
    ["Ask ChatGPT to schedule tasks, set reminders, or monitor for updates", "让 ChatGPT 安排定时任务、设置提醒或监控更新"],
    ["Search scheduled tasks", "搜索定时任务"],
    ["Suggestions", "建议"],
    ["Daily brief", "每日简报"],
    ["Weekly review", "每周回顾"],
    ["Follow-up monitor", "后续跟进"],
    ["Weekdays at 8:00", "工作日 8:00"],
    ["Weekdays at 9:00", "工作日 9:00"],
    ["Fridays at 16:00", "周五 16:00"],
    ["Start each weekday with a summary of your calendar, unread email, and priorities", "每个工作日以日程、未读邮件和优先事项摘要开始"],
    ["Turn your recent work into a concise status update every Friday", "每周五将你近期工作整理为简明状态更新"],
    ["Review recent email and calendar activity and flag anything that needs your attention", "查看近期邮件和日历，标记需要关注的事项"],
    ["No scheduled tasks found", "暂无定时任务"],
    ["Give me a morning brief with what's on my calendar, important unread emails, and anything that needs my attention today.", "给我一份今日晨间简报，包括今日日程、重要的未读邮件和需要关注的事项。"],
    ["Review what I worked on this week and draft a short status update.", "回顾本周工作并起草一份简短的状态更新。"],
    // 筛选/详情
    ["All", "全部"],
    ["Active", "活跃"],
    ["Paused", "已暂停"],
    ["Create", "创建"],
    ["Details", "详情"],
    ["Project", "项目"],
    ["None", "无"],
    ["Reasoning", "推理"],
    ["Frequency", "频率"],
    ["Repeat", "重复"],
    ["Weekly", "每周"],
    ["Weekdays", "工作日"],
    ["On", "开"],
    ["Friday", "周五"],
    ["At", "时间"],
    ["All runs", "每次运行"],
    ["Next run", "下次运行"],
    // 创建项目对话框
    ["Project type", "项目类型"],
    ["Cloud", "云端"],
    ["Local", "本地"],
    ["Work through ideas and tasks without setup", "无需设置，直接处理想法和任务"],
    ["Edit, run, and test files on your computer", "在你的电脑上编辑、运行并测试文件"],
    ["Next", "下一步"],
    // 侧边栏
    ["Pinned", "已安排"],
    ["Automate", "自动化"],
    ["Explore", "探索"],
    ["Run image generation request", "运行图片生成请求"],
    ["Organize sidebar", "组织侧边栏"],
    ["By project", "按项目"],
    ["In one list", "列表展示"],
    // 插件面板
    ["Public", "公开"],
    ["Personal", "个人"],
    ["Install", "安装"],
    // 插件分类
    ["Business & Operations", "商业与运营"],
    ["Communication", "通讯"],
    ["Creativity", "创意"],
    ["Data & Analytics", "数据分析"],
    ["Developer Tools", "开发者工具"],
    ["Education & Research", "教育与研究"],
    ["Finance", "金融"],
    ["Other", "其他"],
    ["Productivity", "效率"],
    ["Travel", "旅行"],
    ["Security", "安全"],

    // v2.2 批量补：Skills / 设置 / 通知 / Composer / 设置侧边栏
    // Skills 页
    ["Skills", "技能"],
    ["Extend ChatGPT with task-specific skills", "用任务专属技能扩展 ChatGPT"],
    ["Search skills", "搜索技能"],
    ["Installed", "已安装"],
    // 设置侧边栏 - 分组标题与项
    ["Personal", "个人"],
    ["Configuration", "配置"],
    ["Personalization", "个性化"],
    ["Pets", "宠物"],
    ["Integrations", "集成"],
    ["Computer use", "电脑操控"],
    ["Coding", "编程"],
    ["Hooks", "钩子"],
    ["Environments", "环境"],
    ["Archived", "已归档"],
    ["Back to app", "返回应用"],
    ["Hide pet", "隐藏宠物"],
    // Permissions 区域
    ["Permissions", "权限"],
    ["Default permissions", "默认权限"],
    ["Full access", "完全访问权限"],
    ["Learn more", "了解更多"],
    ["about elevated risks", "关于更高风险"],
    // 文件打开 / 终端
    ["Default file open destination", "默认文件打开方式"],
    ["Where files and folders open by default", "默认情况下文件和文件夹在哪里打开"],
    ["Integrated terminal shell", "集成终端 Shell"],
    ["Choose which shell opens in the integrated terminal.", "选择在集成终端中使用的 Shell。"],
    ["Default app", "默认应用"],
    ["File Explorer", "文件资源管理器"],
    ["Terminal", "终端"],
    ["Command Prompt", "命令提示符"],
    // 底部面板与导入
    ["Language for the app UI", "应用界面语言"],
    ["Bottom panel", "底部面板"],
    ["Show the bottom panel control in the app header", "在应用标题栏显示底部面板控件"],
    ["Import work from other AI apps", "从其他 AI 应用导入工作"],
    ["Bring over your setup, projects, and recent chats", "导入设置、项目和最近的对话"],
    ["No data detected", "未检测到数据"],
    // 开源许可
    ["Open source licenses", "开源许可证"],
    ["Third-party notices for bundled dependencies", "捆绑依赖的第三方声明"],
    // Composer
    ["Show context window usage", "显示上下文窗口使用量"],
    ["Send shortcut", "发送快捷键"],
    ["Choose when Enter sends a prompt or inserts a new line", "选择按 Enter 时发送消息或换行"],
    ["Follow-up behavior", "后续跟进行为"],
    ["Queue", "排队"],
    ["Steer", "操控"],
    // 通知
    ["Turn completion notifications", "开启完成通知"],
    ["Set when ChatGPT alerts you that it's finished", "设置 ChatGPT 何时提醒你已完成"],
    ["Only when unfocused", "仅当未聚焦时"],
    ["Never", "从不"],
    ["Always", "始终"],
    ["Enable permission notifications", "启用权限通知"],
    ["Show alerts when notification permissions are required", "需要通知权限时显示提醒"],
    ["Enable question notifications", "启用提问通知"],
    ["Show alerts when input is needed to continue", "需要输入才能继续时显示提醒"],

    // v2.3 批量补：Configuration / Personalization / Pets / Browser / Computer use / Hooks / Git / Environments / Worktrees / Composer / Codex++ 菜单 / Plugins 子页
    // Configuration - 顶部
    ["Configure permissions, web access, and agent responses for new chats", "为新对话配置权限、网络访问与代理响应"],
    ["Agent defaults", "代理默认设置"],
    ["User config", "用户配置"],
    ["Open config.toml", "打开 config.toml"],
    // Approval policy
    ["Approval policy", "审批策略"],
    ["Choose when ChatGPT asks for approval", "选择 ChatGPT 何时请求审批"],
    ["On request", "按需"],
    ["Untrusted", "不信任"],
    ["Always ask before taking action", "执行操作前总是询问"],
    ["Ask when escalation is requested", "需要升级权限时再询问"],
    ["Never ask for approval", "从不请求审批"],
    ["Blocked actions fail instead of requesting approval", "阻断的操作直接失败，不会请求审批"],
    // Sandbox settings
    ["Sandbox settings", "沙箱设置"],
    ["Choose how much ChatGPT can do when running commands", "选择 ChatGPT 执行命令时的权限范围"],
    ["Read only", "只读"],
    ["Can read files, but cannot edit them", "可读取文件，但不可编辑"],
    ["Workspace write", "工作区可写"],
    ["Can edit files, but only in this workspace", "可编辑文件，但仅限于此工作区"],
    // Web search
    ["Web search", "联网搜索"],
    ["Choose how ChatGPT accesses the web", "选择 ChatGPT 访问网络的方式"],
    ["Disabled", "已禁用"],
    ["Don't allow web search", "不允许联网搜索"],
    ["Use OpenAI's maintained search index", "使用 OpenAI 维护的搜索索引"],
    ["Cached", "已缓存"],
    ["Indexed", "索引模式"],
    ["Allow indexed external web access", "允许索引式的外部网络访问"],
    ["Live", "实时模式"],
    ["Allow unrestricted, current web access", "允许无限制的实时网络访问"],
    // Output detail
    ["Output detail", "输出详细度"],
    ["Choose how much detail ChatGPT includes in responses", "选择 ChatGPT 在回复中包含的细节量"],
    ["Model default", "模型默认"],
    ["Keep responses concise", "回复保持简洁"],
    ["Balance detail and brevity", "在详细与简洁间平衡"],
    ["Include more detail in responses", "在回复中包含更多细节"],
    // Reasoning summary
    ["Reasoning summary", "推理摘要"],
    ["Choose how ChatGPT summarizes its reasoning", "选择 ChatGPT 如何摘要其推理"],
    ["Auto", "自动"],
    ["Let the model choose the summary detail", "由模型选择摘要详细度"],
    ["Concise", "简洁"],
    ["Show a brief reasoning summary", "显示简短推理摘要"],
    ["Detailed", "详细"],
    ["Show a more detailed reasoning summary", "显示更详细的推理摘要"],
    ["None", "无"],
    ["Don't show reasoning summaries", "不显示推理摘要"],
    // Personalization
    ["Custom instructions", "自定义指令"],
    ["Give ChatGPT extra instructions and context for all chats on this host.", "为这台主机上的所有对话提供额外指令与上下文。"],
    ["Add your custom instructions...", "添加你的自定义指令..."],
    ["Memory", "记忆"],
    ["Configure how local memories are collected, retained, and consolidated on this computer", "配置本地记忆的收集、保留与合并方式"],
    ["Enable local memories", "启用本地记忆"],
    ["Create memories from chats on this computer and use them to personalize future chats on this computer", "基于本机的对话创建记忆，并用于个性化未来的对话"],
    ["Allow local memory generation from tool-assisted chats", "允许从工具辅助对话生成记忆"],
    ["Generate memories from chats that used MCP tools or web search", "基于使用 MCP 工具或联网搜索的对话生成记忆"],
    ["Delete local memories", "删除本地记忆"],
    ["Delete all memories stored locally on this computer", "删除本机存储的所有记忆"],
    // Pets 页
    ["Pick a pet", "选择宠物"],
    ["Pets manage threads and surface what needs attention", "宠物管理线程并提示需要关注的事项"],
    ["Tuck Away Pet", "收起宠物"],
    ["Custom pets", "自定义宠物"],
    ["Open folder", "打开文件夹"],
    ["Selected", "已选择"],
    // Codex++ 托盘菜单
    ["Show pet", "显示宠物"],
    // Composer 提示卡
    ["What should we build?", "今天要构建什么？"],
    ["Explore and understand code", "探索并理解代码"],
    ["Build a new feature, app, or tool", "构建新功能、应用或工具"],
    ["Review code and suggest changes", "审查代码并提出修改建议"],
    ["Fix issues and failures", "修复问题与故障"],
    // Browser 页
    ["Disabled by your organization or unavailable in your region", "您的组织已禁用或该地区不可用"],
    ["Local URL open destination", "本地 URL 打开方式"],
    ["Where local development sites open by default", "默认情况下本地开发站点在哪里打开"],
    ["Default browser", "默认浏览器"],
    ["Browsing data", "浏览数据"],
    ["Clear browsing history, site data, cache, and download history from the in-app browser", "清除内置浏览器的浏览历史、网站数据、缓存和下载历史"],
    ["Clear all browsing data", "清除所有浏览数据"],
    ["Cookies", "Cookie"],
    ["Delete cookies", "删除 Cookie"],
    ["Site data", "网站数据"],
    ["Delete site data", "删除网站数据"],
    ["Cached images and files", "缓存的图片与文件"],
    ["Delete cached images and files", "删除缓存的图片与文件"],
    ["Download history", "下载历史"],
    ["Delete download history", "删除下载历史"],
    ["Annotation screenshots", "标注截图"],
    ["Screenshots help ChatGPT better understand and address comments, but increase plan usage", "截图有助于 ChatGPT 更好地理解与处理批注，但会增加用量"],
    ["Always include", "总是包含"],
    ["Only on drag selection", "仅在拖动选择时"],
    ["Autofill and passwords", "自动填充与密码"],
    ["Password manager", "密码管理器"],
    ["Add, delete, and edit saved passwords", "添加、删除与编辑已保存的密码"],
    ["Contact info", "联系信息"],
    ["Add, delete, and edit saved addresses, phone numbers, and email addresses", "添加、删除与编辑已保存的地址、电话和邮箱"],
    ["Site settings", "网站设置"],
    ["Control camera and microphone permissions in the built-in browser", "控制内置浏览器的摄像头与麦克风权限"],
    ["Manage", "管理"],
    // Computer use 页
    ["Manage how ChatGPT uses other applications on your computer", "管理 ChatGPT 如何使用你电脑上的其他应用"],
    ["Control", "控制"],
    // Hooks 页
    ["Manage lifecycle hooks from config and enabled plugins.", "管理来自配置和已启用插件的生命周期钩子。"],
    ["No hooks found", "未找到钩子"],
    ["Configured hooks will appear here", "配置后的钩子将出现在此"],
    // Git 页
    ["Branch prefix", "分支前缀"],
    ["Prefix used when ChatGPT creates new branches", "ChatGPT 创建新分支时使用的前缀"],
    ["Always force push", "总是强制推送"],
    ["Use --force-with-lease when pushing from ChatGPT", "从 ChatGPT 推送时使用 --force-with-lease"],
    ["Create draft pull requests", "创建草稿拉取请求"],
    ["Use draft pull requests by default when creating PRs from ChatGPT", "从 ChatGPT 创建 PR 时默认使用草稿"],
    ["Review delivery", "审查交付方式"],
    ["Start /review in the current chat when possible or launch a separate review chat", "尽可能在当前对话发起 /review，或启动独立的审查对话"],
    ["Inline", "行内"],
    ["Detached", "分离"],
    ["Commit instructions", "提交说明"],
    ["Added to commit message generation prompts", "已加入 commit 信息生成提示词"],
    ["Add commit message guidance...", "添加 commit 信息指引..."],
    ["Pull request instructions", "拉取请求说明"],
    ["Added to PR title/description generation prompts", "已加入 PR 标题/描述生成提示词"],
    ["Add pull request guidance...", "添加 PR 指引..."],
    // Environments 页
    ["Local environments tell ChatGPT how to set up worktrees for a project.", "本地环境告诉 ChatGPT 如何为项目设置 worktree。"],
    ["Select a project", "选择项目"],
    ["Add project", "添加项目"],
    // Worktrees 页
    ["Worktree root", "Worktree 根目录"],
    ["Directory where ChatGPT creates managed worktrees; leave blank to use the default location", "ChatGPT 创建托管 worktree 的目录；留空使用默认位置"],
    ["Default", "默认"],
    ["Automatically delete old worktrees", "自动删除旧的 worktree"],
    ["Recommended for most users. Turn this off only if you want to manage old worktrees and disk usage yourself.", "推荐多数用户开启。仅当你想自行管理旧 worktree 与磁盘占用时才关闭。"],
    ["Auto-delete limit", "自动删除上限"],
    ["Number of managed worktrees to keep before older ones are pruned automatically. ChatGPT snapshots worktrees before deleting, so pruned worktrees should always be restorable.", "自动修剪前保留的托管 worktree 数量。ChatGPT 删除前会快照 worktree，因此被修剪的 worktree 通常都可恢复。"],
    ["Fetching worktree details...", "正在获取 worktree 详情..."],
    // Archived chats
    ["Loading archived chats...", "正在加载已归档对话..."],
    // Plugins 子页（MCPs / Marketplace）
    ["Manage plugins, skills, and MCPs", "管理插件、技能与 MCP"],
    ["MCPs", "MCP"],
    ["Search marketplaces", "搜索市场"],

    // v2.4 补：Sort chats by 下拉 + Quit ChatGPT
    ["Sort chats by", "排序方式"],
    ["Priority", "优先级"],
    ["Last updated", "最近更新"],
    ["Manual order", "手动排序"],
    ["Quit ChatGPT", "退出 ChatGPT"],

    // v2.5 键盘快捷键页（动作名 + 描述）
    // 通用
    ["Unassigned", "未分配"],
    ["Search shortcuts", "搜索快捷键"],
    // 对话类
    ["Quick chat", "快捷对话"],
    ["Start a lightweight chat in the quick composer", "在快捷编写器中开始轻量对话"],
    ["Archive chat", "归档对话"],
    ["Archive the current chat", "归档当前对话"],
    ["New standalone chat", "新建独立对话"],
    ["Start a new chat outside of any project", "在项目之外新建对话"],
    ["Open side chat", "打开侧边对话"],
    ["Open the current chat in a side chat", "在侧边对话中打开当前对话"],
    ["Open in new window", "在新窗口打开"],
    ["Open the current chat in a new window", "在新窗口中打开当前对话"],
    ["Toggle pin", "切换置顶"],
    ["Pin or unpin the current chat", "置顶或取消置顶当前对话"],
    ["Next recently viewed chat", "下一个最近查看的对话"],
    ["Cycle to the next recently viewed chat", "切换到下一个最近查看的对话"],
    ["Previous recently viewed chat", "上一个最近查看的对话"],
    ["Cycle to the previous recently viewed chat", "切换到上一个最近查看的对话"],
    ["Switch chat...", "切换对话..."],
    ["Search and switch to a chat", "搜索并切换对话"],
    ["Next chat", "下一个对话"],
    ["Switch to the next chat", "切换到下一个对话"],
    ["Previous chat", "上一个对话"],
    ["Switch to the previous chat", "切换到上一个对话"],
    ["Continue in new chat", "在新对话中继续"],
    ["Create a new chat from the current chat", "基于当前对话创建新对话"],
    ["Rename chat", "重命名对话"],
    ["Rename the current chat", "重命名当前对话"],
    // 导航类
    ["Go to line", "转到行"],
    ["Go to a line in the current file", "转到当前文件中的某一行"],
    ["Go back", "返回"],
    ["Go back in navigation history", "返回导航历史"],
    ["Go forward", "前进"],
    ["Go forward in navigation history", "前进导航历史"],
    ["Switch to Work", "切换到工作区"],
    ["Switch to Codex", "切换到 Codex"],
    ["Focus browser address bar", "聚焦浏览器地址栏"],
    ["Focus the in-app browser address bar", "聚焦应用内浏览器地址栏"],
    ["Open command menu", "打开命令菜单"],
    ["Search Files...", "搜索文件..."],
    ["Search files", "搜索文件"],
    // 标签页与面板
    ["Next tab", "下一个标签页"],
    ["Switch to the next tab", "切换到下一个标签页"],
    ["Previous tab", "上一个标签页"],
    ["Switch to the previous tab", "切换到上一个标签页"],
    ["Close Tab", "关闭标签页"],
    ["Close the active tab", "关闭活动标签页"],
    ["Close the active window", "关闭活动窗口"],
    ["New Window", "新建窗口"],
    ["Open a new window", "打开新窗口"],
    ["Open browser tab", "打开浏览器标签页"],
    ["Open a new browser tab", "打开新的浏览器标签页"],
    ["Open review tab", "打开审查标签页"],
    ["Open the review tab", "打开审查标签页"],
    ["Toggle bottom panel", "切换底部面板"],
    ["Show or hide the bottom panel", "显示或隐藏底部面板"],
    ["Toggle browser panel", "切换浏览器面板"],
    ["Show or hide the browser panel", "显示或隐藏浏览器面板"],
    ["Toggle pinned summary", "切换固定摘要"],
    ["Show or hide the pinned summary", "显示或隐藏固定摘要"],
    ["Toggle sidebar", "切换侧边栏"],
    ["Show or hide the sidebar", "显示或隐藏侧边栏"],
    ["Toggle maximize side panel", "最大化侧边面板"],
    ["Expand or restore the side panel", "展开或恢复侧边面板"],
    ["Toggle File Tree", "切换文件树"],
    ["Toggle the file tree panel", "切换文件树面板"],
    ["Toggle Review panel", "切换审查面板"],
    ["Show or hide Review for the current chat", "显示或隐藏当前对话的审查"],
    ["Toggle review", "切换审查"],
    ["Show or hide Review for the current Git-backed chat", "显示或隐藏当前 Git 对话的审查"],
    ["Open terminal", "打开终端"],
    ["Open the terminal panel", "打开终端面板"],
    // Git 与 PR
    ["Commit or push", "提交或推送"],
    ["Open commit or push options", "打开提交或推送选项"],
    ["Create branch", "创建分支"],
    ["Open branch creation options", "打开分支创建选项"],
    ["Create draft PR", "创建草稿 PR"],
    ["Open draft pull request creation options", "打开草稿拉取请求创建选项"],
    ["Create PR", "创建 PR"],
    ["Open pull request creation options", "打开拉取请求创建选项"],
    ["Merge PR", "合并 PR"],
    ["Open pull request merge options", "打开拉取请求合并选项"],
    ["Open PR on GitHub", "在 GitHub 上打开 PR"],
    ["Open the pull request linked to the current chat", "打开与当前对话关联的拉取请求"],
    // Composer
    ["Attach files and folders", "添加文件和文件夹"],
    ["Attach files and folders to the active composer", "向活动编写器添加文件和文件夹"],
    ["Add photos", "添加照片"],
    ["Add photos to the active composer", "向活动编写器添加照片"],
    ["Cycle reasoning effort", "循环切换推理强度"],
    ["Cycle through composer reasoning effort options", "循环切换编写器推理强度选项"],
    ["Decrease reasoning effort", "降低推理强度"],
    ["Decrease the current composer reasoning effort", "降低当前编写器推理强度"],
    ["Increase reasoning effort", "提高推理强度"],
    ["Increase the current composer reasoning effort", "提高当前编写器推理强度"],
    ["Open model picker", "打开模型选择器"],
    ["Open the composer model picker", "打开编写器模型选择器"],
    ["Open project picker", "打开项目选择器"],
    ["Open the composer project picker", "打开编写器项目选择器"],
    ["Start dictation", "开始听写"],
    ["Start dictation in the current composer", "在当前编写器中开始听写"],
    ["Send the current composer message", "发送当前编写器消息"],
    ["Toggle Fast mode", "切换快速模式"],
    ["Turn Fast mode on or off in the current composer", "切换当前编写器的快速模式"],
    ["Toggle plan mode", "切换计划模式"],
    ["Turn plan mode on or off in the current composer", "切换当前编写器的计划模式"],
    ["Toggle Local/Worktree", "切换本地/工作树"],
    ["Switch the current composer between local and a new worktree", "在当前编写器的本地与新工作树之间切换"],
    // 复制/编辑
    ["Copy as Markdown", "复制为 Markdown"],
    ["Copy the current chat as Markdown", "将当前对话复制为 Markdown"],
    ["Copy conversation path", "复制对话路径"],
    ["Copy the current chat path", "复制当前对话路径"],
    ["Copy deeplink", "复制深链接"],
    ["Copy a deeplink to the current chat", "复制当前对话的深链接"],
    ["Copy session id", "复制会话 ID"],
    ["Copy the current chat session ID", "复制当前对话的会话 ID"],
    ["Copy working directory", "复制工作目录"],
    ["Copy the current chat working directory", "复制当前对话的工作目录"],
    ["Undo last action", "撤销上一步操作"],
    ["Undo the most recent app action", "撤销最近的应用操作"],
    ["Redo last action", "重做上一步操作"],
    ["Redo the most recently undone app action", "重做最近被撤销的应用操作"],
    // 浏览器
    ["Reload Browser Page", "重新加载浏览器页面"],
    ["Reload the active browser page", "重新加载活动浏览器页面"],
    ["Force Reload Browser Page", "强制重新加载浏览器页面"],
    ["Force reload the active browser page", "强制重新加载活动浏览器页面"],
    ["Browser back", "浏览器后退"],
    ["Go back in browser history", "在浏览器历史中后退"],
    ["Browser forward", "浏览器前进"],
    ["Go forward in browser history", "在浏览器历史中前进"],
    // 技能/应用
    ["Force reload skills", "强制重新加载技能"],
    ["Refresh the skill catalog for the current context", "刷新当前上下文的技能目录"],
    ["Go to skills", "转到技能"],
    ["Browse installed and recommended skills", "浏览已安装和推荐的技能"],
    ["Import from other AI apps", "从其他 AI 应用导入"],
    ["Install Codex Workspace", "安装 Codex 工作区"],
    ["Install dependencies for advanced local features", "安装高级本地功能的依赖"],
    ["Manage scheduled tasks", "管理定时任务"],
    ["Create or manage scheduled tasks from the current page", "从当前页面创建或管理定时任务"],
    ["Open the pet overlay", "打开宠物浮层"],
    ["Open control window", "打开控制窗口"],
    ["Open the voice chat control window", "打开语音对话控制窗口"],
    // 杂项
    ["Approve request", "批准请求"],
    ["Approve the active request", "批准活动请求"],
    ["Decline request", "拒绝请求"],
    ["Decline the active request", "拒绝活动请求"],
    ["Start Trace Recording", "开始性能追踪"],
    ["Start or stop trace recording", "开始或停止性能追踪"],
    ["Show keyboard shortcuts", "显示键盘快捷键"],
    ["Show the shortcuts available right now", "显示当前可用的快捷键"],
    ["Configure MCP servers", "配置 MCP 服务器"],
    ["Personality", "个性化"],
    ["Adjust tone and response style", "调整语气与回复风格"],
    ["Feedback", "反馈"],
    ["Send product feedback to the ChatGPT team", "向 ChatGPT 团队发送产品反馈"],
    ["Open ChatGPT settings", "打开 ChatGPT 设置"],
    ["Customize keyboard shortcuts", "自定义键盘快捷键"],
    ["Sign out of ChatGPT", "退出 ChatGPT 登录"],

    // v2.6 补漏：项目右键菜单 + 工作模式描述 + 更新提示 + OK
    ["Unpin project", "取消置顶项目"],
    ["Open in Explorer", "在资源管理器中打开"],
    ["Create, learn, and explore", "创建、学习与探索"],
    ["Build, debug, and ship", "构建、调试与发布"],
    ["ChatGPT is up to date.", "ChatGPT 是最新版本。"],
    ["OK", "确定"],

    // v2.7 补漏：项目区空状态
    ["No projects", "暂无项目"],

    // v2.8 外观页 + Preferences
    // 外观页
    ["Light theme", "浅色主题"],
    ["Dark theme", "深色主题"],
    ["Import", "导入"],
    ["Copy theme", "复制主题"],
    ["Accent", "强调色"],
    ["Background", "背景"],
    ["Foreground", "前景"],
    // Preferences
    ["Use pointer cursors", "使用指针光标"],
    ["Change the cursor to a pointer when hovering over interactive elements", "悬停在交互元素上时光标变为指针"],
    ["Reduce motion", "减少动效"],
    ["Reduce animations or match your system", "减少动画或跟随系统设置"],
    ["Off", "关"],
    ["UI font size", "界面字体大小"],
    ["Adjust the base size used for the ChatGPT UI", "调整 ChatGPT UI 使用的基础字号"],
    ["Code font size", "代码字体大小"],
    ["Adjust the base size used for code across chats and diffs", "调整对话与差异中代码使用的基础字号"],
    ["Diff markers", "差异标记"],
    ["Show changes using colors or +/- markers", "使用颜色或 +/- 标记显示变更"],

    // v2.9 补漏：创建插件下拉 + 聊天右键菜单
    ["Create plugin", "创建插件"],
    ["Add marketplace", "添加市场"],
    ["Pin chat", "置顶对话"],
    ["Mark as unread", "标记为未读"],
    ["Continue in new worktree", "在新工作树中继续"],
    ["Add scheduled task...", "添加定时任务..."],

    // v2.9.2 补漏：Ask for approval / custom / Send shortcut 下拉子项
    ["Ask for approval", "请求审批"],
    ["custom", "自定义"],
    ["^ + Enter for multiline prompts", "^ + Enter 用于多行提示"],
    ["^ + Enter always", "^ + Enter 总是"],

    // v2.9.3 补漏：Codex++ 顶部「创建」下拉
    ["Create with Codex", "使用 Codex 创建"],
    ["Set up manually", "手动设置"],

    // v2.9.5 补漏：GitHub Pull Requests 视图
    ["Pull requests", "拉取请求"],
    ["GitHub CLI setup required", "需要安装 GitHub CLI"],
    ["GitHub CLI (gh) is not installed", "未安装 GitHub CLI (gh)"],
    ["Check again", "重新检查"],

    // v2.9.6 补漏：偏好设置底部面板区 + 插件开关
    ["Default terminal location", "默认终端位置"],
    ["Choose where the terminal shortcut and environment actions open terminal tabs", "选择终端快捷键和环境操作打开终端标签的位置"],
    ["Allow ChatGPT to use installed plugins", "允许 ChatGPT 使用已安装插件"],

    // v2.9.7 补漏：Composer Follow-up behavior 长描述
    ["Queue follow-ups while ChatGPT runs or steer the current run. Press Ctrl+↩ to do the opposite for one message", "在 ChatGPT 运行期间排队后续跟进或操控当前任务。按 Ctrl+↩ 反转行为（仅本次消息）"],

    // v2.9.8 补漏：Preferences 页标题 + 差异标记下拉选项
    ["Preferences", "偏好设置"],
    ["Color +/- markers", "颜色 +/- 标记"],

    // === v1.2 原有词表 ===
    // 侧边栏 / 导航
    ["Settings & Privacy", "设置与隐私"],
    ["New session", "新建会话"],
    ["New chat", "新建对话"],
    ["Search chats", "搜索对话"],
    ["Search messages", "搜索消息"],
    ["Archived chats", "已归档对话"],
    ["Delete chat", "删除对话"],
    ["Keyboard shortcuts", "键盘快捷键"],
    ["Upgrade plan", "升级套餐"],
    ["Manage subscription", "管理订阅"],
    ["Log out", "退出登录"],
    ["Sign out", "退出登录"],
    ["Sign in", "登录"],
    ["Log in", "登录"],
    ["Forgot password?", "忘记密码？"],
    ["Continue with Google", "使用 Google 登录"],
    ["Continue with Microsoft", "使用 Microsoft 登录"],
    ["Continue with Apple", "使用 Apple 登录"],
    ["Add to favorites", "收藏"],
    ["Remove from favorites", "取消收藏"],
    // 输入框 / 操作区
    ["Send message", "发送消息"],
    ["Send a message", "发送消息"],
    ["Ask a follow-up", "继续提问"],
    ["Stop generating", "停止生成"],
    ["Stop responding", "停止响应"],
    ["Copy code", "复制代码"],
    ["View code", "查看代码"],
    ["Always allow", "总是允许"],
    ["Allow for this chat", "仅本次对话允许"],
    ["Edit files", "编辑文件"],
    ["Search the web", "联网搜索"],
    ["Working set", "工作集"],
    // 设置 / 通用
    ["Settings", "设置"],
    ["Search", "搜索"],
    ["Help", "帮助"],
    ["Upgrade", "升级"],
    ["Favorites", "收藏"],
    ["General", "常规"],
    ["Appearance", "外观"],
    ["Language", "语言"],
    ["Theme", "主题"],
    ["Light", "浅色"],
    ["Dark", "深色"],
    ["System", "跟随系统"],
    ["Notifications", "通知"],
    ["Sounds", "声音"],
    ["Privacy", "隐私"],
    ["Security", "安全"],
    ["Account", "账户"],
    ["Billing", "账单"],
    ["Usage", "用量"],
    ["Context", "上下文"],
    ["History", "历史记录"],
    ["Profile", "个人资料"],
    ["Models", "模型"],
    ["Model", "模型"],
    ["API Key", "密钥"],
    // 高频按钮
    ["Message", "消息"],
    ["Send", "发送"],
    ["Attach", "附件"],
    ["Stop", "停止"],
    ["Regenerate", "重新生成"],
    ["Edit", "编辑"],
    ["Rename", "重命名"],
    ["Duplicate", "复制副本"],
    ["Share", "分享"],
    ["Copy", "复制"],
    ["Export", "导出"],
    ["Download", "下载"],
    ["Delete", "删除"],
    ["Save", "保存"],
    ["Cancel", "取消"],
    ["Confirm", "确认"],
    ["Close", "关闭"],
    ["Back", "返回"],
    ["Continue", "继续"],
    ["Retry", "重试"],
    ["Try again", "重试"],
    ["Done", "完成"],
    ["Apply", "应用"],
    ["Add", "添加"],
    ["Remove", "移除"],
    ["Reset", "重置"],
    ["Undo", "撤销"],
    ["Redo", "重做"],
    ["More", "更多"],
    ["Less", "更少"],
    // 状态 / 工具
    ["Loading", "加载中"],
    ["Thinking", "思考中"],
    ["Generating", "生成中"],
    ["Error", "错误"],
    ["Failed", "失败"],
    ["Approve", "批准"],
    ["Deny", "拒绝"],
    ["Allow", "允许"],
    ["Tools", "工具"],
    ["Files", "文件"],
    ["Threads", "线程"],
    ["Read", "读取"],
    ["Write", "写入"],
    ["Run", "运行"],
    ["Ask", "提问"],
    ["Logged out", "已退出登录"],
    ["Offline", "离线"],
    ["Online", "在线"]
  ];

  var ATTR_NAMES = ["title", "aria-label", "placeholder", "alt"];

  function norm(s) {
    return String(s)
      .replace(/[\u2019\u2018\u02BC]/g, "'") // 弯引号 → 直引号（I'm / it's 等会用到）
      .replace(/\s*\.{3,}\s*|\s*…\s*/g, "…") // 省略号（含前后空白）统一折叠为单个 Unicode …
      .replace(/\s+/g, " ")
      .trim();
  }

  // 预计算词表 key 的归一化形式（含空白/省略号折叠 + 小写），避免每次匹配重复计算
  var NORM_KEYS = new Array(DICT.length);
  for (var k = 0; k < DICT.length; k++) {
    NORM_KEYS[k] = norm(DICT[k][0]).toLowerCase();
  }

  function lookup(text, host) {
    if (!text) return null;
    var t = norm(text).toLowerCase();
    // 上下文覆盖：推理强度（Effort）选择器内的 Light 应译为"低"，避免被主题色"浅色"误吃
    // 接受两种容器标记：原文 "effort" 或我已翻译的标题 "推理强度"（自检发现脚本先把 Effort 翻成了 推理强度，原标记失效）
    if (t === "light" && host) {
      var cur = host, depth = 0;
      while (cur && depth < 6) {
        var ctx = cur.textContent || "";
        if (ctx.toLowerCase().indexOf("effort") !== -1 || ctx.indexOf("推理强度") !== -1) return "低";
        cur = cur.parentElement;
        depth++;
      }
    }
    // 上下文覆盖：On 在频率设置（On Friday / On Weekdays）中译"于"，开关按钮译"开"
    if (t === "on" && host) {
      var cur2 = host, depth2 = 0;
      while (cur2 && depth2 < 6) {
        var ctx2 = cur2.textContent || "";
        var l2 = ctx2.toLowerCase();
        if (l2.indexOf("monday") !== -1 || l2.indexOf("tuesday") !== -1 || l2.indexOf("wednesday") !== -1 ||
            l2.indexOf("thursday") !== -1 || l2.indexOf("friday") !== -1 || l2.indexOf("saturday") !== -1 ||
            l2.indexOf("sunday") !== -1 || l2.indexOf("weekday") !== -1 ||
            ctx2.indexOf("周五") !== -1 || ctx2.indexOf("周一") !== -1) return "于";
        cur2 = cur2.parentElement;
        depth2++;
      }
    }
    for (var i = 0; i < DICT.length; i++) {
      if (NORM_KEYS[i] === t) return DICT[i][1];
    }
    // 动态模式兜底（v2.9.4）：带数字/品牌名的重复句式无法进词表，用正则翻译
    var pt = norm(text);
    var m1 = pt.match(/^see .+ and \d+ more$/i);
    if (m1) return "查看更多插件";
    var m2 = pt.match(/^(\d+) plugins?$/i);
    if (m2) return m2[1] + " 个插件";
    var m3 = pt.match(/^(\d+) skills?$/i);
    if (m3) return m3[1] + " 个技能";
    return null;
  }

  function isProtected(el) {
    if (!el || !el.closest) return false;
    return !!el.closest("pre,code,textarea,script,style,noscript,[contenteditable]");
  }

  function translateTextNode(node) {
    if (!node || node.nodeType !== 3) return;
    var p = node.parentElement;
    if (!p || isProtected(p)) return;
    var zh = lookup(node.nodeValue, p);
    if (zh !== null && node.nodeValue !== zh) node.nodeValue = zh;
  }

  function translateAttributes(el) {
    for (var i = 0; i < ATTR_NAMES.length; i++) {
      var a = ATTR_NAMES[i];
      if (!el.hasAttribute(a)) continue;
      var zh = lookup(el.getAttribute(a), el);
      if (zh !== null) el.setAttribute(a, zh);
    }
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType === 1) {
      if (isProtected(root)) return;
      translateAttributes(root);
    }
    // 文本节点
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var t;
    while ((t = tw.nextNode())) translateTextNode(t);
    // 元素节点：翻译 placeholder / title / aria-label / alt 等属性
    // 修复 v1.3 以来 translateAttributes 只在根上调用、对后代元素无效的 bug
    var ew = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (el) {
        return el && el.nodeType === 1 && !isProtected(el) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var e;
    while ((e = ew.nextNode())) {
      translateAttributes(e);
      // 元素级整段翻译（v2.0）：处理 React 用 <strong>/<em> 等内联元素把整段文本切碎的场景
      translateElementIfExact(e);
    }
  }

  // v2.0：元素级整段翻译 —— 当元素的 textContent 整体等于某个词条、但被内联子节点切碎时，
  // 整段替换为中文。会丢失粗体/斜体等内联格式（被替换为纯文本），但保证翻译生效。
  var INLINE_TAGS = {
    SPAN: 1, B: 1, STRONG: 1, I: 1, EM: 1, U: 1, MARK: 1,
    SUB: 1, SUP: 1, BR: 1, CODE: 1, SMALL: 1, BIG: 1, TT: 1,
    CITE: 1, Q: 1, DFN: 1, ABBR: 1, TIME: 1, FONT: 1, S: 1,
    STRIKE: 1, DEL: 1, INS: 1, KBD: 1, SAMP: 1, VAR: 1, WBR: 1
  };
  var SKIP_TAGS_FOR_ELEMENT = {
    INPUT: 1, TEXTAREA: 1, SELECT: 1, SCRIPT: 1, STYLE: 1,
    NOSCRIPT: 1, CODE: 1, PRE: 1
  };
  function translateElementIfExact(el) {
    if (!el || !el.tagName) return;
    var tag = el.tagName.toUpperCase();
    if (SKIP_TAGS_FOR_ELEMENT[tag]) return;
    var fullText = el.textContent || "";
    if (!fullText) return;
    var zh = lookup(fullText);
    if (zh === null) return;
    if (norm(fullText) === zh) return;
    // 元素必须只含文本/内联子节点，否则会破坏布局（图标/按钮/列表等）
    for (var c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1) {
        var ct = (c.tagName || "").toUpperCase();
        if (!INLINE_TAGS[ct]) return;
      }
    }
    el.textContent = zh;
  }

  function start() {
    if (!document.body) {
      setTimeout(start, 200);
      return;
    }
    var last = 0;
    function scan() {
      walk(document.body);
      last = Date.now();
    }
    // 立即扫一遍 + 观察 DOM 变化即时响应 + 定时兜底（应对 React 重渲染/动态注入）
    scan();
    new MutationObserver(scan).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    setInterval(scan, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();