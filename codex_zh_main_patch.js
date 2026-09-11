// Codex 客户端「原生菜单」汉化补丁（主进程）
// 托盘右键菜单、原生上下文菜单由 Electron 主进程构建，DOM 注入覆盖不到，
// 因此通过主进程调试端口（--inspect=9333）在运行时打补丁：
//   1) 包装 Menu.buildFromTemplate  —— 覆盖之后所有新构建的菜单
//   2) 包装 Tray.prototype.popUpContextMenu / setContextMenu —— 覆盖已缓存的托盘菜单
//   3) 包装 Menu.prototype.popup、Menu.setApplicationMenu —— 覆盖其它原生菜单
// 只做「整串精确匹配」，绝不触碰线程标题等项目内容（带 sublabel 的项直接跳过）。
// 由 codex_zh_injector.py 自动调用，重开客户端后自动重新应用。
(function () {
  var TAG = (typeof global.__ZH_MAIN_TAG__ === "string" && global.__ZH_MAIN_TAG__) || "v1";
  if (global.__ZH_MAIN_PATCH__ === TAG) return "already";
  var MAP = {
    "Archive chat": "归档聊天",
    "Back": "返回",
    "Browser": "浏览器",
    "Browser back": "浏览器返回",
    "Browser forward": "浏览器前进",
    "Cancel": "取消",
    "Chats": "聊天",
    "Check any cables and restart any routers, modems, or other network devices you may be using": "检查所有线缆连接，并重启你当前使用的路由器、调制解调器或其他网络设备",
    "Check your DNS settings": "检查 DNS 设置",
    "Check your Internet connection": "检查网络连接",
    "Checking the connection": "检查网络连接",
    "Checking the proxy, firewall, and DNS configuration": "检查代理、防火墙和 DNS 配置",
    "Close": "关闭",
    "Close Tab": "关闭标签页",
    "Comment": "评论",
    "Contact your network administrator if you are not sure what this means": "如果你不清楚这表示什么，请联系网络管理员",
    "Copy conversation path": "复制对话路径",
    "Copy deeplink": "复制深层链接",
    "Copy link address": "复制链接地址",
    "Copy working directory": "复制工作目录",
    "Developer": "开发者",
    "Dictation": "听写",
    "Edit": "编辑",
    "Exit": "退出",
    "Feedback": "反馈",
    "File": "文件",
    "Find": "查找",
    "Focus Browser Address Bar": "聚焦浏览器地址栏",
    "Focus browser address bar": "聚焦浏览器地址栏",
    "Force Reload Browser Page": "强制重新加载浏览器页面",
    "Forward": "前进",
    "Go to Chat 1": "前往聊天 1",
    "Go to Chat 2": "前往聊天 2",
    "Go to Chat 3": "前往聊天 3",
    "Go to Chat 4": "前往聊天 4",
    "Go to Chat 5": "前往聊天 5",
    "Go to Chat 6": "前往聊天 6",
    "Go to Chat 7": "前往聊天 7",
    "Go to Chat 8": "前往聊天 8",
    "Go to Chat 9": "前往聊天 9",
    "Go to chat 1": "转到聊天 1",
    "Go to chat 2": "转到聊天 2",
    "Go to chat 3": "转到聊天 3",
    "Go to chat 4": "转到聊天 4",
    "Go to chat 5": "转到聊天 5",
    "Go to chat 6": "转到聊天 6",
    "Go to chat 7": "转到聊天 7",
    "Go to chat 8": "转到聊天 8",
    "Go to chat 9": "转到聊天 9",
    "Help": "帮助",
    "If you use a proxy server": "如果使用代理服务器",
    "Inspect": "检查",
    "Keyboard Shortcuts": "键盘快捷键",
    "Log Out": "退出登录",
    "Log out": "注销",
    "More": "更多",
    "New Chat": "新对话",
    "New Temporary Chat": "新建临时对话",
    "New Window": "新窗口",
    "New chat": "新对话",
    "New standalone chat": "新建独立对话",
    "Next Chat": "下一个对话",
    "Next chat": "下一个对话",
    "Next result": "下一个结果",
    "Open Browser Tab": "打开浏览器标签页",
    "Open ChatGPT": "打开 ChatGPT",
    "Open Folder…": "打开文件夹…",
    "Open Terminal": "打开终端",
    "Open browser tab": "打开浏览器标签页",
    "Open command menu": "打开命令菜单",
    "Open folder": "打开文件夹",
    "Open in New Window": "在新窗口中打开",
    "Open in external browser": "在外部浏览器中打开",
    "Open in new window": "在新窗口中打开",
    "Open link in new tab": "在新标签页中打开链接",
    "Open terminal": "打开终端",
    "Open your system network settings and check whether a proxy has been configured for the active network": "打开系统网络设置，检查当前网络是否配置了代理",
    "Pause Chronicle": "暂停 Chronicle",
    "Pin/unpin chat": "置顶/取消置顶聊天",
    "Pinned": "已安排",
    "Previous Chat": "上一个聊天",
    "Previous chat": "上一个聊天",
    "Previous result": "上一个结果",
    "Quit": "退出",
    "Recent": "最近",
    "Reload": "重新加载",
    "Reload Browser Page": "重新加载浏览器页面",
    "Reload page": "重新加载页面",
    "Rename chat": "重命名聊天",
    "Resume Chronicle": "恢复 Chronicle",
    "Running": "运行中",
    "Search Chats…": "搜索聊天…",
    "Search Files…": "搜索文件…",
    "Search files": "搜索文件",
    "Send Feedback": "发送反馈",
    "Settings": "设置",
    "Settings…": "设置…",
    "Show keyboard shortcuts": "显示键盘快捷键",
    "Show or hide pet": "显示或隐藏虚拟宠物",
    "Show pet": "显示虚拟宠物",
    "Start Trace Recording": "开始跟踪记录",
    "Start dictation": "开始听写",
    "Starting Chronicle...": "正在启动 Chronicle…",
    "Stopping Chronicle...": "正在停止 Chronicle…",
    "Switch chat…": "切换聊天…",
    "This site can't be reached": "无法访问此站点",
    "Toggle Bottom Panel": "显示/隐藏底部面板",
    "Toggle File Tree": "显示/隐藏文件树",
    "Toggle Pinned Summary": "显示/隐藏固定摘要",
    "Toggle Review Panel": "显示/隐藏审阅面板",
    "Toggle Review panel": "切换审阅面板",
    "Toggle Sidebar": "显示/隐藏侧边栏",
    "Toggle bottom panel": "切换底部面板",
    "Toggle file tree": "切换文件树",
    "Toggle pin": "切换置顶状态",
    "Toggle pinned summary": "切换置顶摘要",
    "Toggle sidebar": "切换侧边栏",
    "Try:": "尝试：",
    "Unread": "未读",
    "Update": "更新",
    "Usage": "用量",
    "View": "视图",
    "What's new": "新功能",
    "Zoom in": "放大",
    "Zoom out": "缩小",
  };
  var electron;
  // 主进程是 ESM 环境，调试器里没有全局 require，得从 mainModule 拿
  try {
    var req = (typeof require === "function") ? require
            : (process.mainModule && process.mainModule.require
               ? process.mainModule.require.bind(process.mainModule) : null);
    if (!req) return "ERR:no-require";
    electron = req("electron");
  } catch (e) { return "ERR:no-electron:" + e.message; }
  var Menu = electron.Menu, Tray = electron.Tray;
  if (!Menu) return "ERR:no-menu";

  var count = 0;
  var FS = null, LOG = "";
  try {
    FS = req("fs");
    LOG = (process.env.APPDATA || "") + "\\Codex++\\zh_main_menu.log";
  } catch (e) { FS = null; }
  function logMenu(tag, menu) {
    if (!FS) return;
    try {
      var out = [];
      (function walk(m) {
        if (!m || !m.items) return;
        for (var i = 0; i < m.items.length; i++) {
          var it = m.items[i];
          out.push(it.type === "separator" ? "---" : (it.label || ""));
          if (it.submenu) walk(it.submenu);
        }
      })(menu);
      FS.appendFileSync(LOG, "[" + new Date().toISOString() + "] " + tag + " " + JSON.stringify(out, null, 0) + "\n");
    } catch (e) {}
  }
  function tr(label) {
    if (typeof label !== "string" || !label) return null;
    var hit = MAP[label];
    if (hit === undefined) hit = MAP[label.replace(/&/g, "")];
    if (hit === undefined) return null;
    return hit;
  }
  function trItem(it) {
    if (!it || typeof it !== "object") return;
    // 线程条目带 sublabel（项目名），属于用户内容，一律不碰
    if (typeof it.sublabel === "string" && it.sublabel) return;
    var z = tr(it.label);
    if (z !== null) {
      try { it.label = z; count++; } catch (e) {}
    }
  }
  function trTemplate(tpl) {
    if (!Array.isArray(tpl)) return;
    for (var i = 0; i < tpl.length; i++) {
      var it = tpl[i];
      if (!it || typeof it !== "object") continue;
      trItem(it);
      if (Array.isArray(it.submenu)) trTemplate(it.submenu);
    }
  }
  function trMenu(menu) {
    if (!menu || !menu.items || !menu.items.length) return;
    for (var i = 0; i < menu.items.length; i++) {
      var it = menu.items[i];
      trItem(it);
      if (it.submenu && it.submenu.items) trMenu(it.submenu);
    }
  }

  if (!global.__ZH_MAIN_ORIG__) {
    global.__ZH_MAIN_ORIG__ = {
      buildFromTemplate: Menu.buildFromTemplate,
      popup: Menu.prototype.popup,
      setApplicationMenu: Menu.setApplicationMenu,
      popUpContextMenu: Tray.prototype.popUpContextMenu,
      setContextMenu: Tray.prototype.setContextMenu
    };
  }
  var O = global.__ZH_MAIN_ORIG__;

  Menu.buildFromTemplate = function (tpl) {
    var m;
    try { trTemplate(tpl); } catch (e) {}
    m = O.buildFromTemplate.call(this, tpl);
    try { logMenu("build", m); } catch (e) {}
    return m;
  };
  Menu.prototype.popup = function (opt) {
    try { trMenu(this); } catch (e) {}
    return O.popup.call(this, opt);
  };
  Menu.setApplicationMenu = function (menu) {
    try { trMenu(menu); } catch (e) {}
    return O.setApplicationMenu.call(this, menu);
  };
  Tray.prototype.popUpContextMenu = function (menu, pos) {
    try { trMenu(menu); logMenu("show", menu); } catch (e) {}
    return O.popUpContextMenu.call(this, menu, pos);
  };
  Tray.prototype.setContextMenu = function (menu) {
    try { trMenu(menu); } catch (e) {}
    return O.setContextMenu.call(this, menu);
  };

  // 已存在的应用菜单就地翻译并重新应用，使菜单栏也变中文
  try {
    var cur = Menu.getApplicationMenu();
    if (cur) { trMenu(cur); Menu.setApplicationMenu(cur); }
  } catch (e) {}

  global.__ZH_MAIN_MAP__ = MAP;
  global.__ZH_MAIN_PATCH__ = TAG;
  global.__ZH_MAIN_COUNT__ = count;
  return "OK:" + TAG + ":entries=" + Object.keys(MAP).length + ":applied=" + count;
})()
