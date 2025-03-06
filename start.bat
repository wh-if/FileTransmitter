@echo off
chcp 65001
echo 启动文件传输服务...

cd backend

:: 检查是否安装了Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未安装Node.js！
    echo 请访问 https://nodejs.org 下载并安装Node.js
    pause
    exit /b 1
)

:: 启动服务
node index.js

:: 如果服务异常退出，暂停显示错误信息
if %errorlevel% neq 0 (
    echo 服务启动失败！
    pause
    exit /b 1
)

pause 