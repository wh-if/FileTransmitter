# 局域网文件传输工具

一个基于 Vue 3 和 Express 的简单局域网文件传输工具，支持文件上传、下载和视频在线播放。

## 功能特点

- ✨ 多文件上传（支持拖拽）
- 🎥 视频在线播放
- 📥 文件下载
- 📱 响应式设计

## 快速开始

### 系统要求
- Node.js >= 14.x
- npm >= 6.x

### 安装步骤

1. 安装依赖
```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

2. 构建并启动
```bash
# 构建前端
cd frontend
npm run build

# 启动服务器
cd ../backend
node index.js
```

## 项目结构
```sh
.  
├── backend/ # 后端代码  
├── frontend/ # 前端代码  
└── uploads/ # 文件存储目录
```