// ==UserScript==
// @name         Codex简体中文汉化
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Codex简体中文汉化补丁（v1.8：补聊天输入框"Figure out next steps ..."系列建议）
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
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var t;
    while ((t = walker.nextNode())) translateTextNode(t);
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