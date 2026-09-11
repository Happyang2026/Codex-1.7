# -*- coding: utf-8 -*-
"""
Codex 汉化独立注入器 (v3.3)
通过 ChatGPT 客户端调试端口注入汉化脚本，不依赖 Codex++ 的脚本注入机制。

v3.3 新增：
  - 原生菜单汉化：页面脚本改不了 Electron 主进程构建的菜单（托盘右键菜单等），
    改为连接主进程调试端口（--inspect=9333）应用 codex_zh_main_patch.js
  - 主进程补丁带版本标记（内容 MD5），补丁文件更新后自动重新应用
v3.2 变更：
  - 改用「页面版本标记」判断是否需要注入（window.__ZH_INJ_HASH__）：
    不再依赖页面文本是否已渲染，彻底消除页面加载早期的「注入未确认」误报
    与随之而来的重复注入；页面刷新/导航后标记自动丢失，会重新注入
v3.1 新增：
  - 脚本热更新：词表文件变更后自动重新注入，无需重启客户端
  - 日志文件 zh_injector.log，便于排查
  - 单实例保护（占用本地端口 47653），避免重复进程
  - 注入失败退避，避免空转
原理：
  - 轮询 127.0.0.1:9229 拿到 ChatGPT 页面
  - 页面无版本标记 或 标记版本与脚本 hash 不符 -> 注入
  - 轮询 127.0.0.1:9333 拿到主进程 -> 应用原生菜单汉化补丁
运行：pythonw codex_zh_injector.py
"""
import json, base64, time, hashlib, socket, os, sys, urllib.request
import websocket

SCRIPT_PATH = r"C:\Users\41691\AppData\Roaming\Codex++\user_scripts\market-codex-zhcn-translate.js"
MAIN_PATCH_PATH = r"C:\Users\41691\AppData\Roaming\Codex++\codex_zh_main_patch.js"
LOG_PATH = r"C:\Users\41691\AppData\Roaming\Codex++\zh_injector.log"
LOCK_PORT = 47653
DEBUG_PORTS = [9229, 9222, 9223, 9230, 9333]   # 首发 9229（Codex++ 默认），其余备用
MAIN_DEBUG_PORTS = [9333, 9334, 9335]          # Electron 主进程（--inspect）；9333 为首发
POLL_INTERVAL = 3
BACKOFF_INTERVAL = 15
MAX_LOG_BYTES = 512 * 1024

# 汉化成功标志（任一命中即认为已汉化）——侧边栏常驻词，切换页面也能命中
MARKERS = ["定时任务", "新建对话", "最近", "插件"]


def log(msg):
    line = "[%s] %s" % (time.strftime("%Y-%m-%d %H:%M:%S"), msg)
    try:
        if os.path.exists(LOG_PATH) and os.path.getsize(LOG_PATH) > MAX_LOG_BYTES:
            os.replace(LOG_PATH, LOG_PATH + ".old")
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass
    try:
        print(line, flush=True)
    except Exception:
        pass


def acquire_lock():
    """单实例保护：绑定固定本地端口，已被占用说明已有实例在跑"""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(("127.0.0.1", LOCK_PORT))
        s.listen(1)
        return s
    except OSError:
        return None


def read_script():
    with open(SCRIPT_PATH, "rb") as f:
        raw = f.read()
    return raw, hashlib.md5(raw).hexdigest()


def get_page_ws():
    """依次探测候选调试端口，返回 ChatGPT 页面 WebSocket URL。
    主端口 9229（Codex++ 默认），其余为备用，防止将来端口号变化导致失效。"""
    for i, port in enumerate(DEBUG_PORTS):
        timeout = 3 if i == 0 else 1
        try:
            req = urllib.request.Request("http://127.0.0.1:%d/json" % port,
                                         headers={"User-Agent": "zh-injector"})
            pages = json.loads(urllib.request.urlopen(req, timeout=timeout).read().decode())
            for p in pages:
                url = p.get("url") or ""
                if p.get("type") == "page" and url.startswith("app://"):
                    if i > 0:
                        log("检测到页面在备用端口 %d" % port)
                    return p.get("webSocketDebuggerUrl")
        except Exception:
            continue
    return None


def cdp_eval(ws_url, expr, timeout=25):
    # suppress_origin=True：新版 Chromium 对 CDP WebSocket 做 Origin 校验，
    # 不带 Origin 头可避免 403（双保险，启动参数 --remote-allow-origins=* 已允许）
    ws = websocket.create_connection(ws_url, timeout=timeout, suppress_origin=True)
    try:
        ws.send(json.dumps({"id": 1, "method": "Runtime.evaluate",
                            "params": {"expression": expr, "returnByValue": True}}))
        for _ in range(50):
            resp = json.loads(ws.recv())
            if resp.get("id") == 1:
                r = resp.get("result", {})
                if "exceptionDetails" in r:
                    return "EXC:" + json.dumps(r["exceptionDetails"],
                                               ensure_ascii=False)[:300]
                return r.get("result", {}).get("value")
        return None
    finally:
        try:
            ws.close()
        except Exception:
            pass


def is_zh(ws_url):
    """页面是否已汉化：检查多个常驻中文标志词，避免单标志失效"""
    expr = ("(function(){var t=(document.body&&document.body.innerText)||'';"
            "var M=%s;for(var i=0;i<M.length;i++)"
            "{if(t.indexOf(M[i])>=0)return true;}return false;})()"
            % json.dumps(MARKERS, ensure_ascii=False))
    try:
        v = cdp_eval(ws_url, expr)
        return v is True
    except Exception:
        return False


def page_version(ws_url):
    """读取页面上记录的汉化脚本版本标记。
    返回 None 表示页面未注入（首次打开，或页面刷新/导航后标记已丢失）。
    这是「是否需要注入」的可靠依据 —— 不依赖页面文本是否已渲染，
    避免页面加载早期误判为「未汉化」而反复重复注入。"""
    try:
        v = cdp_eval(ws_url, "window.__ZH_INJ_HASH__||null", timeout=15)
        return v if isinstance(v, str) and v else None
    except Exception:
        return None


def inject(ws_url, b64, version):
    """注入汉化脚本。脚本是 UTF-8，必须走 TextDecoder，直接 eval(atob()) 会乱码。
    注入同时写入版本标记 window.__ZH_INJ_HASH__，成功后即时确认，无需等待渲染。"""
    try:
        expr = ("eval(new TextDecoder('utf-8').decode("
                "Uint8Array.from(atob('%s'), function(c){return c.charCodeAt(0);})));"
                "window.__ZH_INJ_HASH__='%s';'ok'" % (b64, version))
        v = cdp_eval(ws_url, expr, timeout=45)
        if isinstance(v, str) and v.startswith("EXC:"):
            log("注入异常: %s" % v[:200])
            return False
        return page_version(ws_url) == version
    except Exception as e:
        log("注入异常: %s" % e)
        return False


def get_main_ws():
    """探测 Electron 主进程调试端口，返回 (端口, WebSocket URL)。
    页面脚本无法触达主进程构建的原生菜单（托盘右键菜单、原生上下文菜单），
    只能通过 --inspect 暴露的 Node 调试通道在运行时打补丁。"""
    for i, port in enumerate(MAIN_DEBUG_PORTS):
        try:
            req = urllib.request.Request("http://127.0.0.1:%d/json/list" % port,
                                         headers={"User-Agent": "zh-injector"})
            data = json.loads(urllib.request.urlopen(req, timeout=2).read().decode())
            for t in data:
                if t.get("type") == "node":
                    return port, t.get("webSocketDebuggerUrl")
        except Exception:
            continue
    return None, None


def ensure_main_patch(ws_state):
    """应用/刷新原生菜单汉化补丁（幂等，按补丁内容 MD5 判断）"""
    try:
        with open(MAIN_PATCH_PATH, "rb") as f:
            raw = f.read()
        tag = hashlib.md5(raw).hexdigest()[:12]
        src = raw.decode("utf-8")
    except Exception as e:
        return

    port, ws_url = get_main_ws()
    if ws_url is None:
        if ws_state.get("port") is not None:
            ws_state["port"] = None
            ws_state["tag"] = None
        return

    if ws_state.get("port") != port:
        ws_state["port"] = port
        ws_state["tag"] = None
        log("发现主进程调试端口 %d" % port)

    if ws_state.get("tag") == tag:
        return

    try:
        cur = cdp_eval(ws_url, "global.__ZH_MAIN_PATCH__||null", timeout=10)
        if cur == tag:
            ws_state["tag"] = tag
            return
        expr = "global.__ZH_MAIN_TAG__=%s;\n%s" % (json.dumps(tag), src)
        r = cdp_eval(ws_url, expr, timeout=30)
        if isinstance(r, str) and (r.startswith("OK") or r == "already"):
            ws_state["tag"] = tag
            log("✓ 原生菜单汉化已应用（主进程端口 %d）: %s" % (port, r))
        else:
            log("原生菜单补丁返回异常: %s" % str(r)[:200])
    except Exception as e:
        log("原生菜单补丁异常: %s" % e)


def main():
    lock = acquire_lock()
    if lock is None:
        log("已有注入器实例在运行，本次退出")
        return
    log("=" * 50)
    log("汉化注入器 v3.3 启动 | 轮询 %ss | 脚本 %s" % (POLL_INTERVAL, SCRIPT_PATH))
    try:
        _, cur_hash = read_script()
    except Exception as e:
        log("读取脚本失败: %s" % e)
        cur_hash = ""
    injected_hash = None       # 已注入页面的脚本版本
    fails = 0
    no_port_ticks = 0
    main_state = {"port": None, "tag": None}
    while True:
        interval = POLL_INTERVAL
        try:
            raw, new_hash = read_script()
            b64 = base64.b64encode(raw).decode()

            # 原生菜单（托盘等）走主进程补丁
            ensure_main_patch(main_state)

            ws_url = get_page_ws()
            if ws_url is None:
                no_port_ticks += 1
                if no_port_ticks % 20 == 1:
                    log("等待调试端口（ChatGPT 未启动或未开调试端口），已探测: %s"
                        % ",".join(str(p) for p in DEBUG_PORTS))
                interval = POLL_INTERVAL
            else:
                no_port_ticks = 0
                pv = page_version(ws_url)
                if pv is None:
                    reason = "检测到页面未注入（首次打开或页面已刷新）"
                elif pv != new_hash:
                    reason = "脚本已更新(%s)" % new_hash[:8]
                else:
                    reason = None
                if reason:
                    log("%s，注入中..." % reason)
                    if inject(ws_url, b64, new_hash):
                        injected_hash = new_hash
                        fails = 0
                        log("✓ 汉化注入成功")
                    else:
                        fails += 1
                        log("注入未确认（第 %d 次），%ds 后重试" % (fails, BACKOFF_INTERVAL))
                        interval = BACKOFF_INTERVAL
                else:
                    injected_hash = new_hash
                    fails = 0
        except Exception as e:
            log("循环异常: %s" % e)
            fails += 1
            interval = BACKOFF_INTERVAL
        time.sleep(interval)


if __name__ == "__main__":
    main()
