// ==UserScript==
// @name         Codex简体中文汉化
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Codex简体中文汉化补丁（v2.4：补 Sort chats by 下拉 / Quit ChatGPT 等 5 条；提醒：v2.3 加的"What should we build?"需重启才生效）
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
    ["On", "于"],
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
    ["Pinned", "已固定"],
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
    for (var i = 0; i < DICT.length; i++) {
      if (NORM_KEYS[i] === t) return DICT[i][1];
    }
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