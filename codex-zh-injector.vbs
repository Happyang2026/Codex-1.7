
' Codex 汉化注入器 - 开机自启（隐藏窗口）
' v3.1：改由看门狗统一入口，具备单实例保护与自动重拉能力
' 看门狗检查注入器单实例端口 47653，未运行则拉起注入器；
' 注入器再通过 ChatGPT 调试端口 9229 注入汉化脚本。
Set ws = CreateObject("Wscript.Shell")
ws.Run """C:\Users\41691\.workbuddy\binaries\python\envs\default\Scripts\pythonw.exe"" ""C:\Users\41691\AppData\Roaming\Codex++\codex_zh_watchdog.py""", 0, False
