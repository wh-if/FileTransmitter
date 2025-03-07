@echo off
chcp 65001 >nul
title 启动文件传输服务...

:: 检查是否安装了Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please visit https://nodejs.org to download and install Node.js
    pause
    exit /b 1
)

:: 检查并创建uploads目录
if not exist "uploads" (
    echo [INFO] Creating uploads directory...
    mkdir uploads
)

:: 安装后端依赖
echo [INFO] Checking backend dependencies...
cd backend
if not exist "node_modules" (
    echo [INFO] Installing backend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Backend dependencies installation failed!
        pause
        exit /b 1
    )
)

:: 安装前端依赖并构建
echo [INFO] Checking frontend dependencies...
cd ../frontend
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Frontend dependencies installation failed!
        pause
        exit /b 1
    )
)

:: 构建前端项目
if not exist "../backend/dist" (
    echo [INFO] Building frontend project...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Frontend build failed!
        pause
        exit /b 1
    )
)

:: 返回后端目录启动服务
echo [INFO] Starting server...
cd ../backend
node index.js

:: 如果服务异常退出，暂停显示错误信息
if %errorlevel% neq 0 (
    echo [ERROR] Server startup failed!
    pause
    exit /b 1
)

pause 