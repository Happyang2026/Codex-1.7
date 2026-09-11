@echo off
title Codex 汉化注入器 (v3.1)
echo ==========================================
echo   Codex 汉化注入器 v3.1
echo   通过调试端口 9229 注入汉化脚本
echo ==========================================
echo.
echo 启动中...
"C:\Users\41691\.workbuddy\binaries\python\envs\default\Scripts\pythonw.exe" "C:\Users\41691\AppData\Roaming\Codex++\codex_zh_watchdog.py"
echo 已启动（若已在运行会自动跳过，不会重复）。
echo 若 ChatGPT 界面仍是英文，请稍等 5-10 秒。
echo 页面刷新 / 客户端重启 / 词表更新后都会自动重新注入。
echo.
echo 运行日志: %APPDATA%\Codex++\zh_injector.log
echo.
pause
