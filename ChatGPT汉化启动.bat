@echo off
title ChatGPT (Codex) 汉化启动
echo ============================================
echo   ChatGPT (Codex) 汉化专用启动
echo   保留商店包身份 + 调试端口 9229
echo ============================================
echo.
echo 正在启动，请稍候（会自动关闭旧实例，约 10-30 秒）...
echo.
"C:\Users\41691\.workbuddy\binaries\python\envs\default\Scripts\python.exe" "C:\Users\41691\AppData\Roaming\Codex++\activate_chatgpt.py"
if errorlevel 1 goto fail
echo.
echo [完成] 汉化会在几秒内自动生效。
goto end
:fail
echo.
echo [失败] 启动未成功，请把日志发给小布：
echo %APPDATA%\Codex++\zh_launcher.log
:end
echo.
pause
