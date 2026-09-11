# -*- coding: utf-8 -*-
"""真实调用验证：用临时 Tray 实际调用一次 popUpContextMenu(menu)（单实参，走补丁）。
不通过则记录异常；通过则立刻关闭菜单并销毁托盘。结果写入 zh_main_menu.log。
"""
import json, urllib.request, websocket

PORT = 9333


def get_ws():
    d = json.loads(urllib.request.urlopen(
        "http://127.0.0.1:%d/json/list" % PORT, timeout=3).read().decode())
    for t in d:
        if t.get("type") == "node":
            return t["webSocketDebuggerUrl"]
    return None


def ev(expr, timeout=25):
    ws = websocket.create_connection(get_ws(), timeout=timeout, suppress_origin=True)
    try:
        ws.send(json.dumps({"id": 1, "method": "Runtime.evaluate",
                            "params": {"expression": expr, "returnByValue": True}}))
        for _ in range(60):
            r = json.loads(ws.recv())
            if r.get("id") == 1:
                res = r.get("result", {})
                if "exceptionDetails" in res:
                    return "EXC:" + json.dumps(res["exceptionDetails"], ensure_ascii=False)[:400]
                return res.get("result", {}).get("value")
    finally:
        try:
            ws.close()
        except Exception:
            pass


TEST = r"""
(function(){
  var req = process.mainModule && process.mainModule.require
          ? process.mainModule.require.bind(process.mainModule) : require;
  var e = req('electron'), fs = req('fs');
  var LOG = (process.env.APPDATA || '') + '\\Codex++\\zh_main_menu.log';
  var out = { patchTag: global.__ZH_MAIN_PATCH__ };
  var img = e.nativeImage.createEmpty();
  var t, m;
  try { t = new e.Tray(img); } catch (err) { out.fatal = 'tray: ' + err.message; }
  if (t) {
    m = e.Menu.buildFromTemplate([{ label: 'Recent' }, { type: 'separator' }, { label: 'Exit' }]);
    out.labelsAfterPatch = m.items.map(function(i){ return i.type === 'separator' ? '---' : i.label; });
    // 1) 单实参（旧版补丁会把它补成 2 参 -> 崩；新版应通过）
    try { t.popUpContextMenu(m); out.call1 = 'PASS 单实参调用成功'; }
    catch (err) { out.call1 = 'FAIL 单实参: ' + err.message; }
    // 2) 零实参（用托盘自带菜单，本次没设置 -> 应不报错）
    try { t.popUpContextMenu(); out.call0 = 'PASS 零实参调用成功'; }
    catch (err) { out.call0 = 'FAIL 零实参: ' + err.message; }
    setTimeout(function () {
      try { m.closePopup(); } catch (err) {}
      try { t.destroy(); } catch (err) {}
    }, 400);
  }
  try { fs.appendFileSync(LOG, '[' + new Date().toISOString() + '] SELFTEST ' +
        JSON.stringify(out) + '\n'); } catch (err) {}
  return JSON.stringify(out, null, 1);
})()
"""

if __name__ == "__main__":
    print(ev(TEST))
