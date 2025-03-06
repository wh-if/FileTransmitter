const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const port = 80;

// 通用工具函数
const utils = {
  // 确保目录存在
  ensureDir: (dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
    return dirPath;
  },

  // 获取本机局域网IP
  getLocalIP: () => {
    const interfaces = os.networkInterfaces();
    for (let devName in interfaces) {
      const iface = interfaces[devName];
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === 'IPv4' && !alias.internal) {
          return alias.address;
        }
      }
    }
    return '0.0.0.0';
  },

  // 获取文件的MIME类型
  getMimeType: (filename) => {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mov': 'video/quicktime',
      '.m4v': 'video/x-m4v',
      '.3gp': 'video/3gpp'
    };
    return mimeTypes[ext] || 'video/mp4';
  },

  // 处理视频流错误
  handleStreamError: (res, filename, error) => {
    console.error(`视频流错误 (${filename}):`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: '视频流出错' });
    }
  }
};

// 配置常量
const CONFIG = {
  UPLOAD_DIR: path.join(__dirname, '..', 'uploads'),
  DIST_DIR: path.join(__dirname, 'dist'),
  CHUNK_SIZE: 4 * 1024 * 1024, // 4MB
  CACHE_DURATION: 3600 // 1小时
};

// 中间件配置
app.use(cors());
app.use(express.static(CONFIG.DIST_DIR));

// 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, utils.ensureDir(CONFIG.UPLOAD_DIR));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// 路由处理
const routes = {
  // 主页
  home: (req, res) => {
    const htmlPath = path.join(CONFIG.DIST_DIR, 'index.html');
    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      res.status(404).send('前端文件未找到，请先构建前端项目');
    }
  },

  // 获取文件列表
  getFiles: (req, res) => {
    utils.ensureDir(CONFIG.UPLOAD_DIR);

    fs.readdir(CONFIG.UPLOAD_DIR, (err, files) => {
      if (err) {
        return res.status(500).json({ error: '无法读取文件列表' });
      }
      const fileList = files
        .filter(file => file !== '.gitkeep')
        .map(file => {
          const filePath = path.join(CONFIG.UPLOAD_DIR, file);
          // 检查文件是否存在
          if (!fs.existsSync(filePath)) {
            return null;
          }
          try {
            const stats = fs.statSync(filePath);
            return {
              name: file,
              size: stats.size,
              date: stats.mtime,
              type: path.extname(file).toLowerCase()
            };
          } catch (err) {
            console.error(`获取文件信息失败 (${file}):`, err);
            return null;
          }
        })
        .filter(Boolean); // 过滤掉不存在的文件

      res.json(fileList);
    });
  },

  // 处理视频流
  handleVideoStream: (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(CONFIG.UPLOAD_DIR, filename);

    try {
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: '文件不存在' });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;

      // 设置通用响应头
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Range',
        'Accept-Ranges': 'bytes',
        'Cache-Control': `public, max-age=${CONFIG.CACHE_DURATION}`,
        'Content-Type': utils.getMimeType(filename)
      };

      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      const range = req.headers.range;
      if (!range) {
        res.setHeader('Content-Length', fileSize);
        return fs.createReadStream(filePath)
          .on('error', err => utils.handleStreamError(res, filename, err))
          .pipe(res);
      }

      const start = Number(range.replace(/bytes=/, '').split('-')[0]);
      if (isNaN(start) || start >= fileSize) {
        res.setHeader('Content-Range', `bytes */${fileSize}`);
        return res.status(416).send('请求范围不符合要求');
      }

      const end = Math.min(start + CONFIG.CHUNK_SIZE - 1, fileSize - 1);
      const chunkSize = (end - start) + 1;

      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunkSize);
      res.status(206);

      const stream = fs.createReadStream(filePath, { start, end })
        .on('error', err => utils.handleStreamError(res, filename, err));

      req.on('close', () => stream.destroy());
      stream.pipe(res);

    } catch (error) {
      utils.handleStreamError(res, filename, error);
    }
  }
};

// 路由注册
app.get('/', routes.home);
app.get('/files', routes.getFiles);
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有文件被上传' });
  }
  res.json({ message: '文件上传成功', filename: req.file.originalname });
});
app.get('/stream/:filename', routes.handleVideoStream);
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(CONFIG.UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }
  res.download(filePath);
});
app.delete('/files/:filename', (req, res) => {
  const filePath = path.join(CONFIG.UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: '删除文件失败' });
    }
    res.json({ message: '文件删除成功' });
  });
});

// 启动服务器
app.listen(port, '0.0.0.0', () => {
  console.log(`服务器运行在 http://${utils.getLocalIP()}:${port}`);
});