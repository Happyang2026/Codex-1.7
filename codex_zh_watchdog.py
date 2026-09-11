# -*- coding: utf-8 -*-
"""
Codex 汉化注入器看门狗 (v3.1)
由 Windows 任务计划程序定时调用（建议每 5 分钟一次 + 登录时一次）。
职责：探测注入器的单实例端口 47653，若注入器已退出则重新拉起。
配合 codex_zh_injector.py 使用，避免注入器被意外终止后汉化失效。
"""
import os, socket, subprocess, sys, time

PYW = r"C:\Users\41691\.workbuddy\binaries\python\envs\default\Scripts\pythonw.exe"
INJECTOR = r"C:\Users\41691\AppData\Roaming\Codex++\codex_zh_injector.py"
LOG_PATH = r"C:\Users\41691\AppData\Roaming\Codex++\zh_injector.log"
LOCK_PORT = 47653


def log(msg):
    try:
        if not (os.path.exists(LOG_PATH) and os.path.getsize(LOG_PATH) > 512 * 1024):
            with open(LOG_PATH, "a", encoding="utf-8") as f:
                f.write("[%s] [watchdog] %s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), msg))
    except Exception:
        pass


def injector_alive():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1.5)
    try:
        s.connect(("127.0.0.1", LOCK_PORT))
        return True
    except OSError:
        return False
    finally:
        s.close()


def main():
    if injector_alive():
        return  # 注入器在跑，无需处理
    if not os.path.exists(PYW) or not os.path.exists(INJECTOR):
        log("路径缺失，无法启动注入器: pyw=%s injector=%s" % (os.path.exists(PYW), os.path.exists(INJECTOR)))
        return
    try:
        # DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP，脱离父进程独立存活
        DETACHED = 0x00000008 | 0x00000200
        subprocess.Popen([PYW, INJECTOR], creationflags=DETACHED,
                         close_fds=True, cwd=os.path.dirname(INJECTOR))
        log("注入器未运行，已拉起")
    except Exception as e:
        log("拉起注入器失败: %s" % e)


if __name__ == "__main__":
    main()
