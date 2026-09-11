# -*- coding: utf-8 -*-
"""
ChatGPT(Codex) 商店应用带参启动器 —— 健壮版 v2

要点：
1. 用 IApplicationActivationManager::ActivateApplication 激活 OpenAI.Codex 包，
   保留 MSIX 包身份（避免脱离包身份运行时 GPU 进程崩溃），同时把
   --remote-debugging-port=9229 传给应用，使调试端口正常开启。
2. AUMID 自动探测：商店升级后包版本变化可从 WindowsApps 目录重新解析，
   万一将来改了包名也不至于失效。
3. 杀掉旧实例后会**等待进程完全退出**再激活（MSIX 应用被强杀后立即激活常失败），
   整体流程最多重试 3 轮。
4. 全过程写日志：%APPDATA%\\Codex++\\zh_launcher.log

用法: python activate_chatgpt.py [--no-kill]
退出码: 0 成功（9229 已开启）；1 失败
"""
import ctypes
import datetime
import glob
import os
import socket
import subprocess
import sys
import time
from ctypes import POINTER, byref, c_void_p, c_wchar_p
from ctypes import wintypes

DEFAULT_AUMID = "OpenAI.Codex_2p2nqsd0c76g0!App"
ARGS = "--remote-debugging-port=9229 --remote-allow-origins=*"
DEBUG_PORT = 9229
LOG_PATH = r"C:\Users\41691\AppData\Roaming\Codex++\zh_launcher.log"

CLSID_AAM = "{45BA127D-10A8-46EA-8AB7-56EA9078943C}"
IID_IAAM = "{2e941141-7f97-4756-ba1d-9decde894a3d}"
CLSCTX_LOCAL_SERVER = 4

MAX_ATTEMPTS = 3
PORT_WAIT = 25


def log(msg):
    line = "[%s] %s" % (datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), msg)
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


class GUID(ctypes.Structure):
    _fields_ = [("Data1", ctypes.c_ulong),
                ("Data2", ctypes.c_ushort),
                ("Data3", ctypes.c_ushort),
                ("Data4", ctypes.c_ubyte * 8)]


def make_guid(s):
    g = GUID()
    hr = ctypes.oledll.ole32.CLSIDFromString(c_wchar_p(s), byref(g))
    if hr != 0:
        raise OSError("CLSIDFromString failed: 0x%08x" % hr)
    return g


def find_aumid():
    """从 WindowsApps 目录解析出当前 AUMID，失败则用默认值"""
    try:
        for d in glob.glob(r"C:\Program Files\WindowsApps\OpenAI.Codex_*"):
            name = os.path.basename(d)          # OpenAI.Codex_26.903.9818.0_x64__2p2nqsd0c76g0
            parts = name.split("_")
            if len(parts) >= 4 and parts[0] and parts[-1]:
                return parts[0] + "_" + parts[-1] + "!App", name
    except Exception as e:
        log("AUMID 探测异常（忽略）: %s" % e)
    return DEFAULT_AUMID, None


def chatgpt_pids():
    out = subprocess.run(["tasklist", "/FI", "IMAGENAME eq ChatGPT.exe"],
                         capture_output=True, encoding="gbk", errors="ignore").stdout or ""
    pids = []
    for line in out.splitlines():
        parts = line.split()
        if len(parts) >= 2 and parts[0].lower() == "chatgpt.exe" and parts[1].isdigit():
            pids.append(parts[1])
    return pids


def kill_and_wait(timeout=15):
    """杀掉 ChatGPT 及其全部子进程，并等待彻底退出"""
    pids = chatgpt_pids()
    if not pids:
        return False
    log("发现 %d 个 ChatGPT 进程，正在关闭: %s" % (len(pids), ",".join(pids)))
    for pid in pids:
        subprocess.run(["taskkill", "/PID", pid, "/F", "/T"],
                       capture_output=True)
    t0 = time.time()
    while time.time() - t0 < timeout:
        if not chatgpt_pids():
            time.sleep(2)   # 给系统一点清理 MSIX 包状态的时间
            return True
        time.sleep(0.5)
    log("警告: 等待进程退出超时")
    return False


def activate(aumid):
    ole32 = ctypes.oledll.ole32
    ole32.CoInitializeEx(None, 0)  # COINIT_APARTMENTTHREADED

    clsid = make_guid(CLSID_AAM)
    iid = make_guid(IID_IAAM)
    punk = c_void_p()
    hr = ole32.CoCreateInstance(byref(clsid), None, CLSCTX_LOCAL_SERVER,
                               byref(iid), byref(punk))
    if hr != 0:
        raise OSError("CoCreateInstance failed: 0x%08x" % hr)

    # vtable: [QI, AddRef, Release, ActivateApplication, ActivateForFile, ActivateForProtocol]
    vtbl = ctypes.cast(ctypes.cast(punk, POINTER(c_void_p)).contents,
                       POINTER(c_void_p * 6)).contents
    proto = ctypes.WINFUNCTYPE(ctypes.c_long, c_void_p, c_wchar_p, c_wchar_p,
                               ctypes.c_ulong, POINTER(wintypes.DWORD))
    activate_app = proto(vtbl[3])

    pid = wintypes.DWORD(0)
    hr = activate_app(punk, aumid, ARGS, 0, byref(pid))
    ole32.CoUninitialize()
    if hr != 0:
        raise OSError("ActivateApplication failed: 0x%08x" % hr)
    return pid.value


def port_open(port=DEBUG_PORT):
    s = socket.socket()
    s.settimeout(1)
    try:
        s.connect(("127.0.0.1", port))
        s.close()
        return True
    except OSError:
        s.close()
        return False


def wait_port(port=DEBUG_PORT, timeout=PORT_WAIT):
    t0 = time.time()
    while time.time() - t0 < timeout:
        if port_open(port):
            return True
        time.sleep(1)
    return False


def main():
    no_kill = "--no-kill" in sys.argv
    log("=" * 50)
    log("启动 ChatGPT（健壮版启动器）")

    aumid, pkg = find_aumid()
    log("AUMID: %s%s" % (aumid, ("（包目录 %s）" % pkg) if pkg else "（默认值）"))

    for attempt in range(1, MAX_ATTEMPTS + 1):
        log("--- 第 %d/%d 次尝试 ---" % (attempt, MAX_ATTEMPTS))

        if not no_kill:
            kill_and_wait()

        if port_open():
            log("端口 %d 已在监听，无需重复启动" % DEBUG_PORT)
            return 0

        try:
            pid = activate(aumid)
            log("ActivateApplication 成功，PID=%d" % pid)
        except Exception as e:
            log("激活失败: %s" % e)
            time.sleep(3)
            continue

        if wait_port():
            log("✓ 调试端口 %d 已开启，启动成功" % DEBUG_PORT)
            return 0

        log("✗ 端口 %d 未在 %d 秒内开启，准备重试" % (DEBUG_PORT, PORT_WAIT))
        time.sleep(3)

    log("✗ 启动失败：已重试 %d 次，请查看日志" % MAX_ATTEMPTS)
    return 1


if __name__ == "__main__":
    sys.exit(main())
