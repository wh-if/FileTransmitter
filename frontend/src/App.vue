<script setup>
import { ref, onMounted } from 'vue'

const API_URL = `http://${window.location.hostname}:3000`
const files = ref([])
const uploading = ref(false)
const uploadProgress = ref(0)
const fileInput = ref(null)

// 确认对话框状态
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmCallback = ref(null)

// 视频播放器状态
const showVideoPlayer = ref(false)
const currentVideo = ref(null)

// Toast 状态
const toast = ref({
  show: false,
  message: '',
  type: 'info' // 'info', 'error', 'success'
})

// 显示 toast
const showToast = (message, type = 'info') => {
  toast.value.message = message
  toast.value.type = type
  toast.value.show = true
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// 获取文件列表
const fetchFiles = async () => {
  try {
    const response = await fetch(`${API_URL}/files`)
    const data = await response.json()
    files.value = data
  } catch (error) {
    console.error('获取文件列表失败:', error)
    showToast('获取文件列表失败', 'error')
  }
}

// 格式化文件大小
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click()
}

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    uploadFile(file)
  }
}

// 处理拖放
const handleDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file) {
    uploadFile(file)
  }
}

// 上传文件
const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  uploading.value = true
  uploadProgress.value = 0
  
  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    })
    
    if (response.ok) {
      uploadProgress.value = 100
      showToast('文件上传成功', 'success')
      setTimeout(() => {
        uploading.value = false
        uploadProgress.value = 0
        fetchFiles()
      }, 500)
    } else {
      throw new Error('上传失败')
    }
  } catch (error) {
    console.error('上传文件失败:', error)
    showToast('上传文件失败', 'error')
    uploading.value = false
  }
}

// 显示确认对话框
const showConfirm = (title, message, callback) => {
  confirmDialogTitle.value = title
  confirmDialogMessage.value = message
  confirmCallback.value = callback
  showConfirmDialog.value = true
}

// 处理确认
const handleConfirm = () => {
  if (confirmCallback.value) {
    confirmCallback.value()
  }
  showConfirmDialog.value = false
}

// 处理取消
const handleCancel = () => {
  showConfirmDialog.value = false
}

// 下载文件
const downloadFile = (filename) => {
  showConfirm(
    '确认下载',
    `是否下载文件 "${filename}"？`,
    () => {
      window.open(`${API_URL}/download/${filename}`)
    }
  )
}

// 删除文件
const deleteFile = async (filename) => {
  showConfirm(
    '确认删除',
    `是否删除文件 "${filename}"？此操作不可撤销。`,
    async () => {
      try {
        const response = await fetch(`${API_URL}/files/${filename}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          showToast('文件删除成功', 'success')
          fetchFiles()
        }
      } catch (error) {
        console.error('删除文件失败:', error)
        showToast('删除文件失败', 'error')
      }
    }
  )
}

// 显示视频播放器
const showVideo = (file) => {
  currentVideo.value = file
  showVideoPlayer.value = true
}

// 关闭视频播放器
const closeVideo = () => {
  showVideoPlayer.value = false
  currentVideo.value = null
}

// 判断是否为MP4文件
const isMP4 = (filename) => {
  return filename.toLowerCase().endsWith('.mp4')
}

onMounted(() => {
  fetchFiles()
})
</script>

<template>
  <div class="container">
        
    <!-- 上传区域 -->
    <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
      <input type="file" ref="fileInput" @change="handleFileSelect" style="display: none">
      <div class="upload-box" @click="triggerFileInput">
        <div v-if="!uploading">
          <i class="upload-icon">📁</i>
          <p>点击或拖拽文件到此处上传</p>
        </div>
        <div v-else class="progress">
          <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
          <span>{{ uploadProgress }}%</span>
        </div>
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="file-list">
      <div class="file-list-header">
        <h2>已上传文件</h2>
        <button class="btn refresh" @click="fetchFiles">刷新</button>
      </div>
      <div v-if="files.length === 0" class="no-files">
        暂无文件
      </div>
      <div v-else class="files">
        <div v-for="file in files" :key="file.name" class="file-item">
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatSize(file.size) }}</span>
          </div>
          <div class="file-actions">
            <button v-if="isMP4(file.name)" @click="showVideo(file)" class="btn play">播放</button>
            <button @click="downloadFile(file.name)" class="btn download">下载</button>
            <button @click="deleteFile(file.name)" class="btn delete">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 确认对话框 -->
  <div v-if="showConfirmDialog" class="dialog-overlay">
    <div class="dialog">
      <h3>{{ confirmDialogTitle }}</h3>
      <p>{{ confirmDialogMessage }}</p>
      <div class="dialog-buttons">
        <button class="btn cancel" @click="handleCancel">取消</button>
        <button class="btn confirm" @click="handleConfirm">确认</button>
      </div>
    </div>
  </div>

  <!-- 视频播放器 -->
  <div v-if="showVideoPlayer" class="dialog-overlay" @click.self="closeVideo">
    <div class="video-player">
      <div class="video-header">
        <h3>{{ currentVideo?.name }}</h3>
        <button class="btn close" @click="closeVideo">×</button>
      </div>
      <video 
        controls 
        autoplay
        :src="`${API_URL}/stream/${currentVideo?.name}`"
      >
        您的浏览器不支持视频播放
      </video>
    </div>
  </div>

  <!-- Toast 提示 -->
  <div 
    v-if="toast.show" 
    class="toast" 
    :class="toast.type"
    @click="toast.show = false"
  >
    {{ toast.message }}
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
}

.upload-area {
  margin-bottom: 30px;
}

.upload-box {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-box:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.progress {
  position: relative;
  height: 20px;
  background-color: #f5f7fa;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #409eff;
  transition: width 0.3s ease;
}

.file-list {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
}

.file-item:last-child {
  border-bottom: none;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-weight: 500;
}

.file-size {
  color: #909399;
  font-size: 0.9em;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.download {
  background-color: #409eff;
  color: white;
}

.download:hover {
  background-color: #66b1ff;
}

.delete {
  background-color: #f56c6c;
  color: white;
}

.delete:hover {
  background-color: #f78989;
}

.no-files {
  text-align: center;
  color: #909399;
  padding: 20px;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-width: 90%;
  width: 400px;
}

.dialog h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.dialog p {
  margin: 0 0 20px 0;
  color: #5c6b7f;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn.cancel {
  background-color: #909399;
}

.btn.cancel:hover {
  background-color: #a6a9ad;
}

.btn.confirm {
  background-color: #409eff;
}

.btn.confirm:hover {
  background-color: #66b1ff;
}

.btn.play {
  background-color: #67c23a;
  color: white;
}

.btn.play:hover {
  background-color: #85ce61;
}

.btn.close {
  background: none;
  border: none;
  font-size: 24px;
  color: #909399;
  padding: 0;
  cursor: pointer;
}

.btn.close:hover {
  color: #606266;
}

.video-player {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  max-width: 90vw;
  width: 800px;
  max-height: 90vh;
}

.video-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f5f7fa;
}

.video-header h3 {
  margin: 0;
  color: #2c3e50;
}

.video-player video {
  width: 100%;
  max-height: calc(90vh - 50px);
  display: block;
}

/* 移动设备适配 */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  .upload-box {
    padding: 20px;
  }
  
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .file-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .dialog {
    width: 300px;
    margin: 0 20px;
  }

  .video-player {
    width: 100%;
    height: 100%;
    max-height: none;
    border-radius: 0;
  }

  .video-player video {
    height: calc(100vh - 50px);
    max-height: none;
  }

  .toast {
    width: 90%;
    white-space: normal;
    text-align: center;
  }
}

/* Toast 样式 */
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  z-index: 2000;
  cursor: pointer;
  animation: fadeIn 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.toast.info {
  background-color: #909399;
}

.toast.error {
  background-color: #f56c6c;
}

.toast.success {
  background-color: #67c23a;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn.refresh {
  background-color: #909399;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.3s;
}

.btn.refresh:hover {
  background-color: #a6a9ad;
}
</style>
