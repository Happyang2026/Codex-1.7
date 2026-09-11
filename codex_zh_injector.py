# -*- coding: utf-8 -*-
"""
Codex 汉化独立注入器 (v3.1)
通过 ChatGPT 客户端调试端口注入汉化脚本，不依赖 Codex++ 的脚本注入机制。

v3.1 新增：
  - 脚本热更新：词表文件变更后自动重新注入，无需重启客户端
  - 日志文件 zh_injector.log，便于排查
  - 单实例保护（占用本地端口 47653），避免重复进程
  - 注入失败退避，避免空转
原理：
  - 轮询 127.0.0.1:9229 拿到 ChatGPT 页面
  - 脚本 hash 变化 或 页面未汉化 -> 注入
运行：pythonw codex_zh_injector.py
"""
import json, base64, time, hashlib, socket, os, sys, urllib.request
import websocket

SCRIPT_PATH = r"C:\Users\41691\AppData\Roaming\Codex++\user_scripts\market-codex-zhcn-translate.js"
LOG_PATH = r"C:\Users\41691\AppData\Roaming\Codex++\zh_injector.log"
LOCK_PORT = 47653
DEBUG_PORTS = [9229, 9222, 9223, 9230, 9333]   # 首发 9229（Codex++ 默认），其余备用
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
    ws = websocket.create_connection(ws_url, timeout=timeout)
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


def inject(ws_url, b64):
    """注入汉化脚本。脚本是 UTF-8，必须走 TextDecoder，直接 eval(atob()) 会乱码"""
    try:
        expr = ("eval(new TextDecoder('utf-8').decode("
                "Uint8Array.from(atob('%s'), function(c){return c.charCodeAt(0);})))" % b64)
        cdp_eval(ws_url, expr, timeout=45)
        time.sleep(2)
        return is_zh(ws_url)
    except Exception as e:
        log("注入异常: %s" % e)
        return False


def main():
    lock = acquire_lock()
    if lock is None:
        log("已有注入器实例在运行，本次退出")
        return
    log("=" * 50)
    log("汉化注入器 v3.1 启动 | 轮询 %ss | 脚本 %s" % (POLL_INTERVAL, SCRIPT_PATH))
    try:
        _, cur_hash = read_script()
    except Exception as e:
        log("读取脚本失败: %s" % e)
        cur_hash = ""
    injected_hash = None       # 已注入页面的脚本版本
    fails = 0
    no_port_ticks = 0
    while True:
        interval = POLL_INTERVAL
        try:
            raw, new_hash = read_script()
            b64 = base64.b64encode(raw).decode()
            script_changed = (new_hash != injected_hash)

            ws_url = get_page_ws()
            if ws_url is None:
                no_port_ticks += 1
                if no_port_ticks % 20 == 1:
                    log("等待调试端口（ChatGPT 未启动或未开调试端口），已探测: %s"
                        % ",".join(str(p) for p in DEBUG_PORTS))
                interval = POLL_INTERVAL
            else:
                no_port_ticks = 0
                if script_changed:
                    log("脚本已更新(%s)，重新注入..." % new_hash[:8])
                zh = is_zh(ws_url)
                if script_changed or not zh:
                    if script_changed:
                        log("注入中（词表更新触发）...")
                    else:
                        log("检测到页面未汉化，注入中...")
                    if inject(ws_url, b64):
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
