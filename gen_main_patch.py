# -*- coding: utf-8 -*-
"""由 native_menu_map.json 生成主进程补丁 codex_zh_main_patch.js"""
import json, io, os

MAP_PATH = r"D:\workbuddy\2026-08-05-02-51-25\native_menu_map.json"
OUT = r"C:\Users\41691\AppData\Roaming\Codex++\codex_zh_main_patch.js"

m = json.load(open(MAP_PATH, encoding='utf-8'))

# 项目内既有约定优先：chat 统一译「对话」（与界面其余部分保持一致）
m["New Chat"] = "新对话"
m["New chat"] = "新对话"
m["New Temporary Chat"] = "新建临时对话"
m["New standalone chat"] = "新建独立对话"
m["Next Chat"] = "下一个对话"
m["Next chat"] = "下一个对话"

lines = []
for en in sorted(m):
    lines.append('    %s: %s,' % (json.dumps(en, ensure_ascii=False), json.dumps(m[en], ensure_ascii=False)))
mapping = "\n".join(lines)

js = r'''// Codex 客户端「原生菜单」汉化补丁（主进程）
// 托盘右键菜单、原生上下文菜单由 Electron 主进程构建，DOM 注入覆盖不到，
// 因此通过主进程调试端口（--inspect=9333）在运行时打补丁：
//   1) 包装 Menu.buildFromTemplate  —— 覆盖之后所有新构建的菜单
//   2) 包装 Tray.prototype.popUpContextMenu / setContextMenu —— 覆盖已缓存的托盘菜单
//   3) 包装 Menu.prototype.popup、Menu.setApplicationMenu —— 覆盖其它原生菜单
// 只做「整串精确匹配」，绝不触碰线程标题等项目内容（带 sublabel 的项直接跳过）。
// v2：修正实参转发（不再显式补 undefined 位置参数），避免主进程弹 JS 错误框。
// 由 codex_zh_injector.py 自动调用，重开客户端后自动重新应用。
(function () {
  var TAG = (typeof global.__ZH_MAIN_TAG__ === "string" && global.__ZH_MAIN_TAG__) || "v1";
  if (global.__ZH_MAIN_PATCH__ === TAG) return "already";
  var MAP = {
__MAP__
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

  function logErr(where, e) {
    if (!FS) return;
    try {
      FS.appendFileSync(LOG, "[" + new Date().toISOString() + "] ERR " + where + ": " +
        (e && e.message ? e.message : String(e)) + "\n");
    } catch (_) {}
  }

  // ！！关键！！
  // 一律用 apply(self, 实参数组) 原样转发，且先剥掉尾部 undefined。
  // Electron 原生绑定收到「显式 undefined」的位置参数会抛
  //   TypeError: Error processing argument at index 1, conversion failure from undefined
  // 并弹出主进程 JS 错误框（v1 的 popUpContextMenu(menu, pos) 写法就踩了这个坑：
  // 调用方只传 menu 时我们补了个 undefined 的 position）。
  function fwd(fn, self, args) {
    var a = Array.prototype.slice.call(args);
    while (a.length && a[a.length - 1] === undefined) a.pop();
    return fn.apply(self, a);
  }

  Menu.buildFromTemplate = function (tpl) {
    var m;
    try { trTemplate(tpl); } catch (e) {}
    m = fwd(O.buildFromTemplate, this, arguments);
    try { logMenu("build", m); } catch (e) {}
    return m;
  };
  Menu.prototype.popup = function () {
    try { trMenu(this); } catch (e) {}
    return fwd(O.popup, this, arguments);
  };
  Menu.setApplicationMenu = function () {
    try { trMenu(arguments[0]); } catch (e) {}
    return fwd(O.setApplicationMenu, this, arguments);
  };
  Tray.prototype.popUpContextMenu = function () {
    var menu = arguments[0];
    try { trMenu(menu); logMenu("show", menu); } catch (e) {}
    try {
      return fwd(O.popUpContextMenu, this, arguments);
    } catch (e) {
      logErr("popUpContextMenu", e);
      // 兜底：带上位置参数失败就只带菜单重试一次，仍然失败则原样抛出
      if (menu) {
        try { return O.popUpContextMenu.call(this, menu); }
        catch (e2) { logErr("popUpContextMenu-retry", e2); }
      }
      throw e;
    }
  };
  Tray.prototype.setContextMenu = function () {
    try { trMenu(arguments[0]); } catch (e) {}
    return fwd(O.setContextMenu, this, arguments);
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
'''

js = js.replace("__MAP__", mapping)
with io.open(OUT, "w", encoding="utf-8", newline="\n") as f:
    f.write(js)
print("已生成:", OUT)
print("条目数:", len(m))
print("字节数:", os.path.getsize(OUT))
