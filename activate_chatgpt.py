# -*- coding: utf-8 -*-
"""
ChatGPT(Codex) 商店应用带参启动器
用 IApplicationActivationManager::ActivateApplication 激活 OpenAI.Codex 包，
保留 MSIX 包身份（避免脱离包身份运行时 GPU 进程崩溃），同时把命令行参数
（--remote-debugging-port=9229）传给应用，使调试端口正常开启。
用法: python activate_chatgpt.py [--no-kill]
"""
import ctypes, sys, time
from ctypes import POINTER, byref, c_void_p, c_wchar_p
from ctypes import wintypes

AUMID = "OpenAI.Codex_2p2nqsd0c76g0!App"
# --remote-allow-origins=*：新版 Chromium 对 CDP WebSocket 做 Origin 校验，
# 不加会导致注入器/诊断工具连接被 403 拒绝
ARGS = "--remote-debugging-port=9229 --remote-allow-origins=*"

CLSID_AAM = "{45BA127D-10A8-46EA-8AB7-56EA9078943C}"
IID_IAAM = "{2e941141-7f97-4756-ba1d-9decde894a3d}"
CLSCTX_LOCAL_SERVER = 4


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


def kill_existing():
    import subprocess
    out = subprocess.run(["tasklist", "/FI", "IMAGENAME eq ChatGPT.exe"],
                         capture_output=True, encoding="gbk", errors="ignore").stdout or ""
    killed = False
    for line in out.splitlines():
        parts = line.split()
        if len(parts) >= 2 and parts[0].lower() == "chatgpt.exe":
            subprocess.run(["taskkill", "/PID", parts[1], "/F"],
                           capture_output=True)
            killed = True
    return killed


def activate():
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
    hr = activate_app(punk, AUMID, ARGS, 0, byref(pid))
    ole32.CoUninitialize()
    if hr != 0:
        raise OSError("ActivateApplication failed: 0x%08x" % hr)
    return pid.value


def wait_port(port, timeout=20):
    import socket
    t0 = time.time()
    while time.time() - t0 < timeout:
        s = socket.socket()
        s.settimeout(1)
        try:
            s.connect(("127.0.0.1", port))
            s.close()
            return True
        except OSError:
            s.close()
            time.sleep(1)
    return False


def main():
    if "--no-kill" not in sys.argv:
        if kill_existing():
            print("已关闭旧实例")
            time.sleep(2)
    pid = activate()
    print("激活成功，进程 PID=%d" % pid)
    ok = wait_port(9229, 25)
    print("调试端口 9229: %s" % ("✓ 已开启" if ok else "✗ 未开启"))
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
