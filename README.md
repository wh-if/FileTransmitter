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

### 启动方式

#### Windows 一键启动
双击运行 `start.bat`，脚本会自动完成：
1. 检查 Node.js 环境
2. 创建必要的目录
3. 安装前端依赖
4. 安装后端依赖
5. 构建前端项目
6. 启动服务器

> 注意：首次运行时会自动安装依赖，可能需要几分钟时间。

#### 手动启动
如果不想使用一键启动脚本，也可以手动执行以下步骤：

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
├── start.bat # Windows 一键启动脚本
├── backend/ # 后端代码  
├── frontend/ # 前端代码  
└── uploads/ # 文件存储目录
```