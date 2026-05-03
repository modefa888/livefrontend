import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Form, Input, Select, Modal, message, Spin, Tabs, Tree } from 'antd'
import { FileOutlined, FolderOutlined, FolderOpenOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { Option } = Select
const { TabPane } = Tabs

const Tools = () => {
  // 定时任务相关状态
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingTask, setEditingTask] = useState(null)
  
  // 版本控制相关状态
  const [gitType, setGitType] = useState('backend') // 'backend' 或 'frontend'
  const [gitStatus, setGitStatus] = useState(null)
  const [gitCommits, setGitCommits] = useState([])
  const [gitLoading, setGitLoading] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [isCommitting, setIsCommitting] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [remoteUrl, setRemoteUrl] = useState('')
  const [isSettingRemote, setIsSettingRemote] = useState(false)
  const [isPushing, setIsPushing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [isRenamingBranch, setIsRenamingBranch] = useState(false)
  const [isResettingGit, setIsResettingGit] = useState(false)
  const [gitBlockedBySecret, setGitBlockedBySecret] = useState(false)
  const [branches, setBranches] = useState([])
  const [isFetchingBranches, setIsFetchingBranches] = useState(false)
  const [defaultBranch, setDefaultBranch] = useState('')
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false)
  const [branchToRename, setBranchToRename] = useState('')
  const [newBranchName, setNewBranchName] = useState('')
  const [isBranchModalVisible, setIsBranchModalVisible] = useState(false)
  
  // 系统状态相关状态
  const [systemStatus, setSystemStatus] = useState(null)
  const [systemLoading, setSystemLoading] = useState(false)
  
  // 备份记录相关状态
  const [backupRecords, setBackupRecords] = useState([])
  const [backupLoading, setBackupLoading] = useState(false)
  
  // 本地文件检查相关状态
  const [missingRecords, setMissingRecords] = useState([])
  const [checkingFiles, setCheckingFiles] = useState(false)
  const [isMissingModalVisible, setIsMissingModalVisible] = useState(false)
  
  // 备份按钮加载状态
  const [backupButtonLoading, setBackupButtonLoading] = useState(false)
  const [restartButtonLoading, setRestartButtonLoading] = useState(false)
  const [cleanupButtonLoading, setCleanupButtonLoading] = useState(false)
  
  // 代理检测相关状态
  const [proxyUrl, setProxyUrl] = useState('')
  const [checkingProxy, setCheckingProxy] = useState(false)
  const [proxyStatus, setProxyStatus] = useState(null)
  const [proxyForm] = Form.useForm()
  
  // 密码验证相关状态
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false)
  const [passwordForm] = Form.useForm()
  const [currentOperation, setCurrentOperation] = useState(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  // 旋转状态相关状态 - 使用useState确保状态持久化
  const [rotationAngle, setRotationAngle] = useState(() => {
    // 从localStorage读取旋转角度，实现页面刷新后也能保留状态
    const savedAngle = localStorage.getItem('toolsRotationAngle');
    return savedAngle ? parseInt(savedAngle) : 0;
  });
  
  // 当旋转角度变化时，保存到localStorage
  useEffect(() => {
    localStorage.setItem('toolsRotationAngle', rotationAngle.toString());
  }, [rotationAngle]);
  
  // 后端代码备份相关状态
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupResult, setBackupResult] = useState(null)
  // 前端代码备份相关状态
  const [isFrontendBackingUp, setIsFrontendBackingUp] = useState(false)
  const [frontendBackupResult, setFrontendBackupResult] = useState(null);
  // 一键备份前后端相关状态
  const [isBackupBoth, setIsBackupBoth] = useState(false)
  const [backupBothResult, setBackupBothResult] = useState(null);
  // 监测后端代码相关状态
  const [backendFiles, setBackendFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  // 监测前端代码相关状态
  const [frontendFiles, setFrontendFiles] = useState([]);
  const [isFrontendScanning, setIsFrontendScanning] = useState(false);
  const [frontendScanResult, setFrontendScanResult] = useState(null);
  // 代码备份记录相关状态
  const [codeBackupRecords, setCodeBackupRecords] = useState([]);
  


  // 获取定时任务列表
  const fetchTasks = async () => {
    setLoading(true)
    try {
      
      const response = await api.get('/api/tools/tasks/configs')
      setTasks(response.data)
    } catch (error) {
      message.error('获取定时任务失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 添加定时任务
  const handleAddTask = async (values) => {
    try {
      
      await api.post('/api/tools/tasks/add', values)
      message.success('定时任务添加成功')
      setIsModalVisible(false)
      form.resetFields()
      fetchTasks()
    } catch (error) {
      message.error('添加定时任务失败')
      console.error(error)
    }
  }

  // 更新定时任务
  const handleUpdateTask = async (values) => {
    try {
      
      await api.put(`/api/tools/tasks/${editingTask.id}`, values)
      message.success('定时任务更新成功')
      setIsModalVisible(false)
      form.resetFields()
      setEditingTask(null)
      fetchTasks()
    } catch (error) {
      message.error('更新定时任务失败')
      console.error(error)
    }
  }

  // 删除定时任务
  const handleDeleteTask = async (taskId) => {
    try {
      
      await api.delete(`/api/tools/tasks/${taskId}`)
      message.success('定时任务删除成功')
      fetchTasks()
    } catch (error) {
      message.error('删除定时任务失败')
      console.error(error)
    }
  }

  // 启动所有定时任务
  const startAllTasks = async () => {
    try {
      
      await api.post('/api/tools/tasks/start-all', {})
      message.success('所有定时任务已启动')
    } catch (error) {
      message.error('启动定时任务失败')
      console.error(error)
    }
  }

  // 停止所有定时任务
  const stopAllTasks = async () => {
    try {
      
      await api.post('/api/tools/tasks/stop-all', {})
      message.success('所有定时任务已停止')
    } catch (error) {
      message.error('停止定时任务失败')
      console.error(error)
    }
  }

  // 获取系统状态
  const fetchSystemStatus = async () => {
    setSystemLoading(true)
    try {
      
      const response = await api.get('/api/tools/system/status')
      setSystemStatus(response.data)
    } catch (error) {
      message.error('获取系统状态失败')
      console.error(error)
    } finally {
      setSystemLoading(false)
    }
  }

  // 获取备份记录
  const fetchBackupRecords = async () => {
    setBackupLoading(true)
    try {
      
      const response = await api.get('/api/tools/system/backup-records')
      setBackupRecords(response.data)
    } catch (error) {
      message.error('获取备份记录失败')
      console.error(error)
    } finally {
      setBackupLoading(false)
    }
  }
  
  // 获取代码备份记录
  const fetchCodeBackupRecords = async () => {
    try {
      
      const response = await api.get('/api/tools/system/code-backup-records')
      setCodeBackupRecords(response.data)
    } catch (error) {
      message.error('获取代码备份记录失败')
      console.error(error)
    }
  }
  
  // 检查本地文件是否存在
  const checkBackupFiles = async () => {
    setCheckingFiles(true)
    try {
      const response = await api.get('/api/tools/system/backup-records/check-files')
      setMissingRecords(response.data.missingRecords)
      if (response.data.missingCount > 0) {
        setIsMissingModalVisible(true)
      } else {
        message.success('所有备份记录对应的本地文件都存在')
      }
    } catch (error) {
      message.error('检查备份文件失败')
      console.error(error)
    } finally {
      setCheckingFiles(false)
    }
  }
  
  // 批量删除缺失文件的记录
  const deleteMissingRecords = async () => {
    try {
      const ids = missingRecords.map(record => record.id)
      await api.delete('/api/tools/system/backup-records/batch-delete', {
        data: { ids }
      })
      message.success(`成功删除 ${ids.length} 条无效记录`)
      setIsMissingModalVisible(false)
      setMissingRecords([])
      fetchBackupRecords()
    } catch (error) {
      message.error('删除记录失败')
      console.error(error)
    }
  }

  // 备份数据库
  const backupDatabase = async () => {
    setBackupButtonLoading(true)
    try {
      
      const response = await api.post('/api/tools/system/backup', {})
      message.success('数据库备份成功')
      // 刷新备份记录
      fetchBackupRecords()
    } catch (error) {
      message.error('备份数据库失败')
      console.error(error)
    } finally {
      setBackupButtonLoading(false)
    }
  }

  // 清理日志
  const cleanupLogs = async () => {
    try {
      setCleanupButtonLoading(true)
      
      await api.post('/api/tools/system/cleanup-logs', {})
      message.success('日志清理成功')
    } catch (error) {
      message.error('清理日志失败')
      console.error(error)
    } finally {
      setCleanupButtonLoading(false)
    }
  }

  // 重启服务
  const restartService = async () => {
    try {
      setRestartButtonLoading(true)
      
      await api.post('/api/tools/system/restart', {})
      message.success('服务正在重启')
    } catch (error) {
      message.error('重启服务失败')
      console.error(error)
    } finally {
      setRestartButtonLoading(false)
    }
  }

  // 显示密码验证模态框
  const showPasswordModal = (operation) => {
    setCurrentOperation(operation)
    passwordForm.resetFields()
    setIsPasswordModalVisible(true)
  }

  // 处理密码验证
  const handlePasswordVerify = async (values) => {
    try {
      setPasswordLoading(true)
      
      const response = await api.post('/api/auth/verify-password', {
        password: values.password
      })
      
      if (response.data.success) {
        setIsPasswordModalVisible(false)
        executeOperation()
      } else {
        message.error('密码验证失败')
      }
    } catch (error) {
      message.error('密码验证失败')
      console.error(error)
    } finally {
      setPasswordLoading(false)
    }
  }

  // 执行验证后的操作
  const executeOperation = async () => {
    switch (currentOperation) {
      case 'backup':
        await backupDatabase()
        break
      case 'cleanup':
        await cleanupLogs()
        break
      case 'restart':
        await restartService()
        break
      default:
        break
    }
  }

  // 检测代理是否可用
  const checkProxy = async (values) => {
    setCheckingProxy(true)
    setProxyStatus(null)
    try {
      const currentProxyUrl = values?.proxyUrl || proxyForm.getFieldValue('proxyUrl')
      
      if (!currentProxyUrl) {
        message.error('请输入代理地址')
        setCheckingProxy(false)
        return
      }
      
      const response = await api.post('/api/tools/system/check-proxy', {
        proxyUrl: currentProxyUrl
      })
      setProxyStatus(response.data)
      message.success(response.data.message)
    } catch (error) {
      message.error('代理检测失败')
      console.error(error)
    } finally {
      setCheckingProxy(false)
    }
  }

  // 打开编辑模态框
  const showEditModal = (task) => {
    setEditingTask(task)
    form.setFieldsValue(task)
    setIsModalVisible(true)
  }

  // 打开添加模态框
  const showAddModal = () => {
    setEditingTask(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  // 下载备份文件
  const downloadBackup = async (backupId, type = 'auto') => {
    try {

      const response = await api.get(`/api/tools/system/backup/${backupId}?type=${type}`, {
        responseType: 'blob'
      })
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      // 从响应头中获取文件名（支持 RFC 5987 编码）
      const contentDisposition = response.headers['content-disposition']
      let fileName = 'backup'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*=UTF-8''(.*)/)
        if (match) {
          fileName = decodeURIComponent(match[1])
        }
      }
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success(`备份文件${type === 'compressed' ? '（压缩版）' : ''}下载成功`)
    } catch (error) {
      message.error(`下载备份文件${type === 'compressed' ? '（压缩版）' : ''}失败`)
      console.error(error)
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  // 备份后端代码
  const backupBackendCode = async () => {
    setIsBackingUp(true)
    setBackupResult(null)
    
    try {
      
      const response = await api.post('/api/tools/system/backup-backend', {})
      
      setBackupResult(response.data)
      message.success('后端代码备份成功')
      fetchBackupRecords()
    } catch (error) {
      message.error('备份后端代码失败')
      console.error(error)
    } finally {
      setIsBackingUp(false)
    }
  }
  
  // 备份前端代码
  const backupFrontendCode = async () => {
    setIsFrontendBackingUp(true)
    setFrontendBackupResult(null)
    
    try {
      
      const response = await api.post('/api/tools/system/backup-frontend', {})
      
      setFrontendBackupResult(response.data)
      message.success('前端代码备份成功')
      fetchBackupRecords()
    } catch (error) {
      message.error('备份前端代码失败')
      console.error(error)
    } finally {
      setIsFrontendBackingUp(false)
    }
  }
  
  // 一键备份前后端代码
  const backupBothCode = async () => {
    setIsBackupBoth(true)
    setBackupBothResult(null)
    
    try {
      
      
      // 先备份后端
      const backendResponse = await api.post('/api/tools/system/backup-backend', {})
      
      // 再备份前端
      const frontendResponse = await api.post('/api/tools/system/backup-frontend', {})
      
      setBackupBothResult({
        success: true,
        message: '前后端代码备份成功',
        backendBackup: backendResponse.data,
        frontendBackup: frontendResponse.data
      })
      message.success('前后端代码备份成功')
      fetchBackupRecords()
    } catch (error) {
      message.error('备份前后端代码失败')
      console.error(error)
    } finally {
      setIsBackupBoth(false)
    }
  }
  
  // 将文件列表转换为树结构
  const buildFileTree = (files) => {
    const tree = []
    const map = {}
    
    // 遍历所有文件，构建目录结构
    files.forEach(file => {
      const pathParts = file.path.split('\\')
      let currentMap = map
      
      pathParts.forEach((part, index) => {
        if (!currentMap[part]) {
          const node = {
            title: part,
            key: pathParts.slice(0, index + 1).join('\\'),
            children: [],
            icon: index === pathParts.length - 1 ? <FileOutlined /> : <FolderOutlined />
          }
          currentMap[part] = node
          
          if (index === pathParts.length - 1) {
            // 叶子节点（文件）
            node.isFile = true
            node.size = file.size
            node.modified = file.modified
          }
          
          if (index === 0) {
            tree.push(node)
          } else {
            // 找到父节点并添加子节点
            const parentPath = pathParts.slice(0, index).join('\\')
            let parentMap = map
            let parentNode
            
            pathParts.slice(0, index).forEach(p => {
              parentNode = parentMap[p]
              parentMap = parentMap[p].childrenMap || {} 
            })
            
            if (parentNode) {
              parentNode.children.push(node)
              // 为父节点添加childrenMap以便快速查找
              if (!parentNode.childrenMap) {
                parentNode.childrenMap = {}
              }
              parentNode.childrenMap[part] = node
            }
          }
        }
        
        currentMap = currentMap[part].childrenMap || {}
      })
    })
    
    // 递归排序：文件夹排在前面，文件排在后面
    const sortNodes = (nodes) => {
      nodes.sort((a, b) => {
        // 文件夹排在前面
        if (a.isFile && !b.isFile) {
          return 1
        }
        if (!a.isFile && b.isFile) {
          return -1
        }
        // 相同类型按名称排序
        return a.title.localeCompare(b.title)
      })
      
      // 递归排序子节点
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          sortNodes(node.children)
        }
      })
    }
    
    // 对根节点进行排序
    sortNodes(tree)
    
    return tree
  }
  
  // 监测后端代码
  const scanBackendCode = async () => {
    setIsScanning(true)
    setScanResult(null)
    setBackendFiles([])
    
    try {
      
      const response = await api.get('/api/tools/system/scan-backend')
      
      setBackendFiles(response.data.files)
      setScanResult({
        success: true,
        message: `成功扫描到 ${response.data.files.length} 个文件`,
        totalFiles: response.data.files.length,
        excludedFiles: response.data.excludedFiles || []
      })
      message.success('后端代码监测成功')
    } catch (error) {
      message.error('监测后端代码失败')
      console.error(error)
    } finally {
      setIsScanning(false)
    }
  }
  
  // 监测前端代码
  const scanFrontendCode = async () => {
    setIsFrontendScanning(true)
    setFrontendScanResult(null)
    setFrontendFiles([])
    
    try {
      
      const response = await api.get('/api/tools/system/scan-frontend')
      
      setFrontendFiles(response.data.files)
      setFrontendScanResult({
        success: true,
        message: `成功扫描到 ${response.data.files.length} 个文件`,
        totalFiles: response.data.files.length,
        excludedFiles: response.data.excludedFiles || []
      })
      message.success('前端代码监测成功')
    } catch (error) {
      message.error('监测前端代码失败')
      console.error(error)
    } finally {
      setIsFrontendScanning(false)
    }
  }

  // 根据文件扩展名获取图标
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase()
    
    const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico']
    const jsExts = ['js', 'jsx']
    const tsExts = ['ts', 'tsx']
    const htmlExts = ['html', 'htm']
    const cssExts = ['css', 'scss', 'less', 'sass']
    const jsonExts = ['json']
    const configExts = ['env', 'config', 'yml', 'yaml', 'toml']
    const mdExts = ['md', 'markdown']
    const sqlExts = ['sql']
    const pyExts = ['py']
    const shExts = ['sh', 'bash']
    const dockerExts = ['dockerfile']
    const lockExts = ['lock']
    
    if (imageExts.includes(ext)) return '🖼️'
    if (jsExts.includes(ext)) return '📜'
    if (tsExts.includes(ext)) return '🔷'
    if (htmlExts.includes(ext)) return '🌐'
    if (cssExts.includes(ext)) return '🎨'
    if (jsonExts.includes(ext)) return '📋'
    if (configExts.includes(ext)) return '⚙️'
    if (mdExts.includes(ext)) return '📝'
    if (sqlExts.includes(ext)) return '🗄️'
    if (pyExts.includes(ext)) return '🐍'
    if (shExts.includes(ext)) return '🐚'
    if (dockerExts.includes(ext)) return '🐳'
    if (lockExts.includes(ext)) return '🔒'
    
    return '📄'
  }

  // 解析git status为树状结构
  const parseGitStatusToTree = (status) => {
    const lines = status.trim().split('\n')
    const tree = {}
    
    lines.forEach(line => {
      if (!line.trim()) return
      const match = line.match(/^\s*([MAD])\s+(.+)$/)
      if (match) {
        const fileStatus = match[1]
        let path = match[2]
        
        path = path.replace(/^"|"$/g, '')
        
        const parts = path.split('/')
        let current = tree
        
        parts.forEach((part, index) => {
          part = part.replace(/^"|"$/g, '')
          
          if (!current[part]) {
            current[part] = {
              type: index === parts.length - 1 ? 'file' : 'folder',
              status: index === parts.length - 1 ? fileStatus : null,
              children: {}
            }
          }
          current = current[part].children
        })
      }
    })
    
    const buildTreeData = (obj, parentPath = '') => {
      return Object.keys(obj).map(key => {
        const item = obj[key]
        const isFile = item.type === 'file'
        const path = parentPath ? `${parentPath}/${key}` : key
        const fileIcon = isFile ? getFileIcon(key) : '📁'
        
        return {
          title: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{fileIcon}</span>
              <span>{key}</span>
              {item.status && (
                <span style={{ 
                  fontSize: '11px', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  backgroundColor: item.status === 'M' ? '#fff7e6' : item.status === 'A' ? '#f6ffed' : '#fff2f0',
                  color: item.status === 'M' ? '#d46b08' : item.status === 'A' ? '#52c41a' : '#ff4d4f'
                }}>
                  {item.status === 'M' ? '修改' : item.status === 'A' ? '新增' : '删除'}
                </span>
              )}
            </div>
          ),
          key: path,
          children: Object.keys(item.children).length > 0 ? buildTreeData(item.children, path) : undefined
        }
      })
    }
    
    return buildTreeData(tree)
  }

  // 版本控制相关函数
  const initGitRepo = async () => {
    setIsInitializing(true)
    try {
      const response = await api.post('/api/tools/system/git/init', { type: gitType })
      message.success(response.data.message)
      fetchGitStatus()
      fetchGitLog()
    } catch (error) {
      if (error.response?.data?.message === 'Git 仓库已初始化') {
        message.warning('Git 仓库已初始化')
      } else {
        message.error('初始化 Git 仓库失败')
      }
      console.error(error)
    } finally {
      setIsInitializing(false)
    }
  }

  const fetchGitStatus = async () => {
    setGitLoading(true)
    try {
      const response = await api.get(`/api/tools/system/git/status?type=${gitType}`)
      setGitStatus(response.data)
    } catch (error) {
      setGitStatus(null)
    } finally {
      setGitLoading(false)
    }
  }

  const fetchGitLog = async () => {
    try {
      const response = await api.get(`/api/tools/system/git/log?type=${gitType}`)
      setGitCommits(response.data.commits || [])
    } catch (error) {
      console.error(error)
    }
  }

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      message.warning('请输入提交信息')
      return
    }
    setIsCommitting(true)
    try {
      const response = await api.post('/api/tools/system/git/commit', {
        type: gitType,
        message: commitMessage
      })
      message.success(response.data.message)
      setCommitMessage('')
      fetchGitStatus()
      fetchGitLog()
      
      if (remoteUrl) {
        Modal.confirm({
          title: '提交成功',
          content: '是否立即推送到远程仓库？',
          okText: '推送',
          okType: 'primary',
          cancelText: '稍后推送',
          onOk: () => {
            handlePush()
          }
        })
      }
    } catch (error) {
      message.error('提交失败')
      console.error(error)
    } finally {
      setIsCommitting(false)
    }
  }

  const handleCheckout = async (commitHash) => {
    Modal.confirm({
      title: '确认检出',
      content: `确定要检出提交 ${commitHash} 吗？这会覆盖当前的更改。`,
      onOk: async () => {
        try {
          const response = await api.post('/api/tools/system/git/checkout', {
            type: gitType,
            commitHash: commitHash
          })
          message.success(response.data.message)
          fetchGitStatus()
          fetchGitLog()
        } catch (error) {
          message.error('检出失败')
          console.error(error)
        }
      }
    })
  }

  // 获取远程仓库配置
  const fetchRemoteUrl = async () => {
    try {
      const response = await api.get(`/api/tools/system/git/remote?type=${gitType}`)
      setRemoteUrl(response.data.remoteUrl || '')
    } catch (error) {
      setRemoteUrl('')
    }
  }

  // 设置远程仓库
  const handleSetRemote = async () => {
    if (!remoteUrl.trim()) {
      message.warning('请输入远程仓库地址')
      return
    }
    setIsSettingRemote(true)
    try {
      const response = await api.post('/api/tools/system/git/remote', {
        type: gitType,
        remoteUrl: remoteUrl
      })
      message.success(response.data.message)
    } catch (error) {
      message.error('设置远程仓库失败')
      console.error(error)
    } finally {
      setIsSettingRemote(false)
    }
  }

  // 获取分支列表
  const fetchBranches = async () => {
    setIsFetchingBranches(true)
    try {
      const response = await api.get(`/api/tools/system/git/branches?type=${gitType}`)
      setBranches(response.data.branches)
      setDefaultBranch(response.data.defaultBranch)
    } catch (error) {
      console.error(error)
    } finally {
      setIsFetchingBranches(false)
    }
  }

  // 删除远程分支
  const handleDeleteBranch = async (branchName) => {
    if (branchName === defaultBranch) {
      message.warning('不能删除默认分支')
      return
    }
    
    Modal.confirm({
      title: '确认删除分支',
      content: `确定要删除远程分支 "${branchName}" 吗？此操作不可撤销！`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await api.post('/api/tools/system/git/delete-branch', {
            type: gitType,
            branchName: branchName
          })
          message.success(response.data.message)
          fetchBranches()
        } catch (error) {
          message.error('删除分支失败')
          console.error(error)
        }
      }
    })
  }

  // 打开重命名模态框
  const openRenameModal = (branchName) => {
    setBranchToRename(branchName)
    setNewBranchName(branchName)
    setIsRenameModalVisible(true)
  }

  // 重命名分支
  const handleRenameBranch = async () => {
    if (!newBranchName.trim()) {
      message.warning('请输入新分支名称')
      return
    }
    
    try {
      const response = await api.post('/api/tools/system/git/rename-branch', {
        type: gitType,
        oldName: branchToRename,
        newName: newBranchName.trim()
      })
      message.success(response.data.message)
      setIsRenameModalVisible(false)
      setBranchToRename('')
      setNewBranchName('')
      fetchBranches()
      fetchGitStatus()
    } catch (error) {
      message.error('重命名分支失败')
      console.error(error)
    }
  }

  // 切换当前分支
  const handleCheckoutBranch = async (branchName) => {
    Modal.confirm({
      title: '确认切换分支',
      content: `确定要切换到分支 "${branchName}" 吗？`,
      okText: '确认切换',
      okType: 'primary',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await api.post('/api/tools/system/git/checkout-branch', {
            type: gitType,
            branchName: branchName
          })
          message.success(response.data.message)
          fetchGitStatus()
          fetchBranches()
        } catch (error) {
          message.error('切换分支失败')
          console.error(error)
        }
      }
    })
  }

  // 推送到远程仓库
  const handlePush = async () => {
    setIsPushing(true)
    try {
      const response = await api.post('/api/tools/system/git/push', {
        type: gitType
      })
      message.success(response.data.message)
      fetchGitStatus()
      setGitBlockedBySecret(false)
    } catch (error) {
      const errorMessage = error.response?.data?.message || '推送失败'
      if (errorMessage.includes('secret') || errorMessage.includes('Secret scanning') || errorMessage.includes('秘密检测')) {
        setGitBlockedBySecret(true)
        message.error('推送被 GitHub 秘密检测阻止')
      } else {
        message.error(errorMessage)
      }
      console.error(error)
    } finally {
      setIsPushing(false)
    }
  }

  // 从远程仓库拉取
  const handlePull = async () => {
    setIsPulling(true)
    try {
      const response = await api.post('/api/tools/system/git/pull', {
        type: gitType
      })
      message.success(response.data.message)
      fetchGitStatus()
    } catch (error) {
      message.error('拉取失败')
      console.error(error)
    } finally {
      setIsPulling(false)
    }
  }

  // 重置Git仓库（清除历史）
  const handleResetGit = async () => {
    Modal.confirm({
      title: '确认重置Git仓库',
      content: '这将清除所有Git历史记录并重新初始化仓库。此操作不可撤销！\n\n建议在继续前备份重要数据。',
      okText: '确认重置',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setIsResettingGit(true)
        try {
          const response = await api.post('/api/tools/system/git/reset', {
            type: gitType,
            initialCommitMessage: 'Initial commit'
          })
          message.success(response.data.message)
          fetchGitStatus()
          fetchGitLog()
          setGitBlockedBySecret(false)
        } catch (error) {
          message.error('重置Git仓库失败')
          console.error(error)
        } finally {
          setIsResettingGit(false)
        }
      }
    })
  }

  // 当 gitType 变化时，重新获取状态和日志
  useEffect(() => {
    fetchGitStatus()
    fetchGitLog()
    fetchRemoteUrl()
  }, [gitType])

  // 初始化时获取数据
  useEffect(() => {
    fetchTasks()
    fetchSystemStatus()
    fetchBackupRecords()
    fetchCodeBackupRecords()
  }, [])

  // 定时任务表格列
  const taskColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '任务类型',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: 'Cron表达式',
      dataIndex: 'cronExpression',
      key: 'cronExpression'
    },
    {
      title: '状态',
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      render: (isEnabled) => (isEnabled ? '启用' : '禁用')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div>
          <Button type="primary" size="small" style={{ marginRight: '8px' }} onClick={() => showEditModal(record)}>
            编辑
          </Button>
          <Button danger size="small" onClick={() => handleDeleteTask(record.id)}>
            删除
          </Button>
        </div>
      )
    }
  ]

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>工具管理</h1>
      
      <Tabs defaultActiveKey="tasks">
        <TabPane tab="⏰ 定时任务" key="tasks">
          <div style={{ marginBottom: '20px' }}>
            <Button type="primary" onClick={showAddModal} style={{ marginRight: '10px' }}>
              添加定时任务
            </Button>
            <Button onClick={startAllTasks} style={{ marginRight: '10px' }}>
              启动所有任务
            </Button>
            <Button onClick={stopAllTasks}>
              停止所有任务
            </Button>
          </div>

          <Spin spinning={loading}>
            <Card title="定时任务列表">
              <Table columns={taskColumns} dataSource={tasks} rowKey="id" />
            </Card>
          </Spin>
        </TabPane>

        <TabPane tab="⚙️ 系统管理" key="system">
          <Spin spinning={systemLoading}>
            <Card title="系统状态">
              {systemStatus && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                  <div>
                    <h3>系统信息</h3>
                    <p>平台: {systemStatus.systemInfo.platform}</p>
                    <p>架构: {systemStatus.systemInfo.arch}</p>
                    <p>版本: {systemStatus.systemInfo.release}</p>
                    <p>主机名: {systemStatus.systemInfo.hostname}</p>
                    <p>运行时间: {Math.floor(systemStatus.systemInfo.uptime / 3600)} 小时</p>
                  </div>
                  <div>
                    <h3>资源使用</h3>
                    <p>CPU: {systemStatus.systemInfo.cpu.count} 核心</p>
                    <p>内存: {systemStatus.systemInfo.memory.used} / {systemStatus.systemInfo.memory.total}</p>
                    <p>磁盘: {systemStatus.diskInfo.used} / {systemStatus.diskInfo.total}</p>
                    <p>数据库状态: {systemStatus.dbStatus}</p>
                  </div>
                </div>
              )}
            </Card>

            <div style={{ marginTop: '20px' }}>
              <Card title="系统操作">
                <div 
                  style={{ 
                    display: 'flex', 
                    gap: '10px',
                    transform: `rotate(${rotationAngle}deg)`,
                    transition: 'transform 0.5s ease'
                  }}
                  onClick={() => setRotationAngle(prev => (prev + 45) % 360)}
                >
                  <Button type="primary" onClick={(e) => {
                    e.stopPropagation();
                    showPasswordModal('backup');
                  }} loading={backupButtonLoading}>
                    备份数据库
                  </Button>
                  <Button onClick={(e) => {
                    e.stopPropagation();
                    showPasswordModal('cleanup');
                  }} loading={cleanupButtonLoading}>
                    清理日志
                  </Button>
                  <Button danger onClick={(e) => {
                    e.stopPropagation();
                    showPasswordModal('restart');
                  }} loading={restartButtonLoading}>
                    重启服务
                  </Button>
                </div>
              </Card>
            </div>

            <div style={{ marginTop: '20px' }}>
              <Card title="代理检测">
                <Form layout="vertical" form={proxyForm}>
                  <Form.Item
                    name="proxyUrl"
                    label="代理地址"
                    rules={[{ required: true, message: '请输入代理地址' }]}
                  >
                    <Input 
                      placeholder="请输入代理地址，例如: http://127.0.0.1:10808" 
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" loading={checkingProxy} onClick={() => {
                      const currentProxyUrl = proxyForm.getFieldValue('proxyUrl')
                      if (!currentProxyUrl) {
                        message.error('请输入代理地址')
                        return
                      }
                      checkProxy({ proxyUrl: currentProxyUrl })
                    }}>
                      检测代理
                    </Button>
                  </Form.Item>
                  {proxyStatus && (
                    <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                      <p><strong>📍 代理地址:</strong> {proxyStatus.proxyUrl}</p>
                      <p><strong>🎯 检测结果:</strong> {proxyStatus.success ? '✅ 可用' : '❌ 不可用'}</p>
                      {proxyStatus.message && <p><strong>📋 状态信息:</strong> {proxyStatus.message}</p>}
                      {proxyStatus.error && <p style={{ color: 'red' }}><strong>⚠️ 错误信息:</strong> {proxyStatus.error}</p>}
                      {proxyStatus.testUrl && <p><strong>🌐 测试地址:</strong> {proxyStatus.testUrl}</p>}
                    </div>
                  )}
                </Form>
              </Card>
            </div>
          </Spin>
        </TabPane>
        
        <TabPane tab="💾 备份代码" key="backup-code">
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>备份代码</span>
                <Button 
                  type="primary" 
                  onClick={backupBothCode}
                  loading={isBackupBoth}
                  disabled={isBackingUp || isFrontendBackingUp || isBackupBoth || isScanning || isFrontendScanning}
                >
                  一键备份前后端
                </Button>
              </div>
            }
          >
            <div style={{ marginBottom: '20px' }}>
              {isBackupBoth && (
                <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  <p>正在备份前后端代码，请稍候...</p>
                </div>
              )}
              
              {backupBothResult && (
                <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                  <h4>一键备份结果</h4>
                  <p>状态: {backupBothResult.success ? '成功' : '失败'}</p>
                  <p>消息: {backupBothResult.message}</p>
                  
                  {backupBothResult.backendBackup && (
                    <div style={{ marginTop: '10px' }}>
                      <h5>后端备份</h5>
                      <p>备份路径: {backupBothResult.backendBackup.backupPath}</p>
                      <p>备份大小: {formatFileSize(backupBothResult.backendBackup.backupSize)}</p>
                    </div>
                  )}
                  
                  {backupBothResult.frontendBackup && (
                    <div style={{ marginTop: '10px' }}>
                      <h5>前端备份</h5>
                      <p>备份路径: {backupBothResult.frontendBackup.backupPath}</p>
                      <p>备份大小: {formatFileSize(backupBothResult.frontendBackup.backupSize)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <Tabs defaultActiveKey="backend">
              <TabPane tab="后端备份" key="backend">
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ marginBottom: '10px' }}>备份后端代码，系统会自动排除不需要的文件。</p>
                  <p style={{ marginBottom: '10px', color: '#666' }}>以下目录/文件不会被备份：</p>
                  <ul style={{ 
                    marginBottom: '20px', 
                    color: '#666',
                    paddingLeft: '20px',
                    listStyleType: 'none',
                    lineHeight: '1.8'
                  }}>
                    <li style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>📦</span>
                      node_modules
                    </li>
                    <li style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>📄</span>
                      log
                    </li>
                    <li style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>💾</span>
                      backups
                    </li>
                    <li style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>🔒</span>
                      package-lock.json
                    </li>
                    <li style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>📁</span>
                      .git
                    </li>
                  </ul>
                  
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <Button 
                      type="primary" 
                      onClick={backupBackendCode}
                      loading={isBackingUp}
                      disabled={isBackingUp || isFrontendBackingUp}
                    >
                      备份后端代码
                    </Button>
                    <Button 
                      onClick={scanBackendCode}
                      loading={isScanning}
                      disabled={isBackingUp || isScanning || isFrontendBackingUp}
                    >
                      监测后端代码
                    </Button>
                  </div>
                  
                  {isBackingUp && (
                    <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                      <p>正在备份后端代码，请稍候...</p>
                    </div>
                  )}
                  
                  {backupResult && (
                    <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                      <h4>后端备份结果</h4>
                      <p>状态: {backupResult.success ? '成功' : '失败'}</p>
                      <p>消息: {backupResult.message}</p>
                      {backupResult.backupPath && (
                        <p>备份路径: {backupResult.backupPath}</p>
                      )}
                      {backupResult.backupSize && (
                        <p>备份大小: {formatFileSize(backupResult.backupSize)}</p>
                      )}
                    </div>
                  )}
                  
                  {isScanning && (
                    <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                      <p>正在监测后端代码，请稍候...</p>
                    </div>
                  )}
                  
                  {scanResult && (
                    <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                      <h4>监测结果</h4>
                      <p>状态: {scanResult.success ? '成功' : '失败'}</p>
                      <p>消息: {scanResult.message}</p>
                      {scanResult.totalFiles !== undefined && (
                        <p>扫描到的文件数量: {scanResult.totalFiles}</p>
                      )}
                      {scanResult.excludedFiles && scanResult.excludedFiles.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          <h5>排除的文件:</h5>
                          <ul style={{ 
                            color: '#666',
                            paddingLeft: '20px',
                            listStyleType: 'none',
                            lineHeight: '1.8'
                          }}>
                            {scanResult.excludedFiles.map((file, index) => {
                              let emoji = '📄';
                              if (file.includes('node_modules')) emoji = '📦';
                              if (file.includes('log')) emoji = '📄';
                              if (file.includes('backups')) emoji = '💾';
                              if (file.includes('package-lock.json')) emoji = '🔒';
                              if (file.includes('dist')) emoji = '📁';
                              return (
                                <li key={index} style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                                  <span style={{ marginRight: '8px' }}>{emoji}</span>
                                  {file}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {backendFiles.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h4>后端文件列表</h4>
                      <div style={{ 
                        border: '1px solid #d9d9d9', 
                        borderRadius: '4px', 
                        padding: '10px',
                        height: '500px',
                        overflow: 'auto'
                      }}>
                        <Tree
                          treeData={buildFileTree(backendFiles)}
                          defaultExpandedKeys={[]}
                          defaultExpandAll={false}
                          onSelect={(keys, info) => {
                            console.log('Selected keys:', keys);
                            console.log('Selected info:', info);
                          }}
                          onExpand={(expandedKeys, info) => {
                            console.log('Expanded keys:', expandedKeys);
                            console.log('Expanded info:', info);
                          }}
                          render={(node) => {
                            if (node.isFile) {
                              return (
                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                  <FileOutlined style={{ marginRight: '8px' }} />
                                  <span style={{ flex: 1 }}>{node.title}</span>
                                  <span style={{ fontSize: '12px', color: '#999' }}>
                                    {formatFileSize(node.size || 0)} • {node.modified ? new Date(node.modified).toLocaleString() : '未知'}
                                  </span>
                                </span>
                              )
                            }
                            return (
                              <span style={{ display: 'flex', alignItems: 'center' }}>
                                <FolderOutlined style={{ marginRight: '8px' }} />
                                <span>{node.title}</span>
                              </span>
                            )
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabPane>
              <TabPane tab="前端备份" key="frontend">
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ marginBottom: '10px' }}>备份前端代码，系统会自动排除不需要的文件。</p>
                  <p style={{ marginBottom: '10px', color: '#666' }}>以下目录/文件不会被备份：</p>
                  <ul style={{ 
                    marginBottom: '20px', 
                    color: '#666',
                    paddingLeft: '20px',
                    listStyleType: 'none',
                    lineHeight: '1.8'
                  }}>
                    <li style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>📦</span>
                      node_modules
                    </li>
                    <li style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>📁</span>
                      dist
                    </li>
                    <li style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>💾</span>
                      backups
                    </li>
                    <li style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>🔒</span>
                      package-lock.json
                    </li>
                    <li style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>📁</span>
                      .git
                    </li>
                  </ul>
                  
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <Button 
                      type="primary" 
                      onClick={backupFrontendCode}
                      loading={isFrontendBackingUp}
                      disabled={isBackingUp || isFrontendBackingUp || isFrontendScanning}
                    >
                      备份前端代码
                    </Button>
                    <Button 
                      onClick={scanFrontendCode}
                      loading={isFrontendScanning}
                      disabled={isBackingUp || isFrontendBackingUp || isFrontendScanning}
                    >
                      检查前端代码
                    </Button>
                  </div>
                  
                  {isFrontendBackingUp && (
                    <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                      <p>正在备份前端代码，请稍候...</p>
                    </div>
                  )}
                  
                  {isFrontendScanning && (
                    <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                      <p>正在检查前端代码，请稍候...</p>
                    </div>
                  )}
                  
                  {frontendBackupResult && (
                    <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                      <h4>前端备份结果</h4>
                      <p>状态: {frontendBackupResult.success ? '成功' : '失败'}</p>
                      <p>消息: {frontendBackupResult.message}</p>
                      {frontendBackupResult.backupPath && (
                        <p>备份路径: {frontendBackupResult.backupPath}</p>
                      )}
                      {frontendBackupResult.backupSize && (
                        <p>备份大小: {formatFileSize(frontendBackupResult.backupSize)}</p>
                      )}
                    </div>
                  )}
                  
                  {frontendScanResult && (
                    <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                      <h4>前端代码检查结果</h4>
                      <p>状态: {frontendScanResult.success ? '成功' : '失败'}</p>
                      <p>消息: {frontendScanResult.message}</p>
                      {frontendScanResult.totalFiles !== undefined && (
                        <p>扫描到的文件数量: {frontendScanResult.totalFiles}</p>
                      )}
                      {frontendScanResult.excludedFiles && frontendScanResult.excludedFiles.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          <h5>排除的文件:</h5>
                          <ul style={{ 
                            color: '#666',
                            paddingLeft: '20px',
                            listStyleType: 'none',
                            lineHeight: '1.8'
                          }}>
                            {frontendScanResult.excludedFiles.map((file, index) => {
                              let emoji = '📄';
                              if (file.includes('node_modules')) emoji = '📦';
                              if (file.includes('log')) emoji = '📄';
                              if (file.includes('backups')) emoji = '💾';
                              if (file.includes('package-lock.json')) emoji = '🔒';
                              if (file.includes('dist')) emoji = '📁';
                              return (
                                <li key={index} style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                                  <span style={{ marginRight: '8px' }}>{emoji}</span>
                                  {file}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {frontendFiles.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h4>前端文件列表</h4>
                      <div style={{ 
                        border: '1px solid #d9d9d9', 
                        borderRadius: '4px', 
                        padding: '10px',
                        height: '500px',
                        overflow: 'auto'
                      }}>
                        <Tree
                          treeData={buildFileTree(frontendFiles)}
                          defaultExpandedKeys={[]}
                          defaultExpandAll={false}
                          onSelect={(keys, info) => {
                            console.log('Selected keys:', keys);
                            console.log('Selected info:', info);
                          }}
                          onExpand={(expandedKeys, info) => {
                            console.log('Expanded keys:', expandedKeys);
                            console.log('Expanded info:', info);
                          }}
                          render={(node) => {
                            if (node.isFile) {
                              return (
                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                  <FileOutlined style={{ marginRight: '8px' }} />
                                  <span style={{ flex: 1 }}>{node.title}</span>
                                  <span style={{ fontSize: '12px', color: '#999' }}>
                                    {formatFileSize(node.size || 0)} • {node.modified ? new Date(node.modified).toLocaleString() : '未知'}
                                  </span>
                                </span>
                              )
                            }
                            return (
                              <span style={{ display: 'flex', alignItems: 'center' }}>
                                <FolderOutlined style={{ marginRight: '8px' }} />
                                <span>{node.title}</span>
                              </span>
                            )
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabPane>
            </Tabs>
            
            <div style={{ marginTop: '20px' }}>
              <Card 
                title="📋 备份记录" 
                extra={
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button 
                      type="link" 
                      onClick={checkBackupFiles} 
                      loading={checkingFiles}
                    >
                      🔍 检查本地文件
                    </Button>
                    <Button type="link" onClick={fetchBackupRecords} loading={backupLoading}>
                      🔄 刷新
                    </Button>
                  </div>
                }
              >
                <Spin spinning={backupLoading}>
                  <Table 
                    columns={[
                      {
                        title: '备份文件名',
                        dataIndex: 'backupFileName',
                        key: 'backupFileName'
                      },
                      {
                        title: '类型',
                        dataIndex: 'type',
                        key: 'type',
                        render: (type) => type === 'backend' ? '后端' : type === 'frontend' ? '前端' : '数据库'
                      },
                      {
                        title: '文件大小',
                        dataIndex: 'fileSize',
                        key: 'fileSize',
                        render: (fileSize) => formatFileSize(fileSize)
                      },
                      {
                        title: '备份时间',
                        dataIndex: 'backupTime',
                        key: 'backupTime',
                        render: (backupTime) => new Date(backupTime).toLocaleString()
                      },
                      {
                        title: '创建者',
                        dataIndex: 'createdBy',
                        key: 'createdBy'
                      },
                      {
                        title: '操作',
                        key: 'action',
                        render: (_, record) => (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <Button type="link" onClick={() => downloadBackup(record.id)}>
                              下载
                            </Button>
                            {record.backupFileName.endsWith('.sql') && record.compressedFileName && (
                              <Button type="link" onClick={() => downloadBackup(record.id, 'compressed')}>
                                下载压缩
                              </Button>
                            )}
                          </div>
                        )
                      }
                    ]} 
                    dataSource={backupRecords} 
                    rowKey="id" 
                  />
                </Spin>
              </Card>
            </div>
          </Card>
        </TabPane>
        
        <TabPane tab="📦 版本控制" key="version-control">
          <Card title="🛠️ 版本控制" style={{ borderRadius: '12px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📁</span>
                <Select 
                  value={gitType} 
                  onChange={setGitType}
                  style={{ width: 160 }}
                >
                  <Option value="backend">🖥️ 后端</Option>
                  <Option value="frontend">🌐 前端</Option>
                </Select>
              </div>
              
              {!gitStatus?.isInitialized && (
                <Button 
                  type="primary" 
                  onClick={initGitRepo}
                  loading={isInitializing}
                  style={{ borderRadius: '8px' }}
                >
                  🚀 初始化 Git 仓库
                </Button>
              )}
            </div>
            
            {gitStatus?.isInitialized && (
              <>
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📊</span>
                      <span>Git 状态</span>
                    </div>
                  }
                  style={{ marginBottom: '16px', borderRadius: '10px' }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>🌿</span>
                      <span style={{ fontWeight: '500' }}>当前分支:</span>
                      <span 
                        style={{ 
                          color: '#1890ff', 
                          fontWeight: '600', 
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                        onClick={() => {
                          fetchBranches()
                          setIsBranchModalVisible(true)
                        }}
                      >
                        {gitStatus.branch}
                      </span>
                    </div>
                    
                    {gitStatus.branch === 'master' && (
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => {
                          setBranchToRename(gitStatus.branch)
                          setNewBranchName('main')
                          handleRenameBranch()
                        }}
                        loading={isRenamingBranch}
                        style={{ borderRadius: '6px' }}
                      >
                        🔄 重命名为 main
                      </Button>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>📝</span>
                    <span style={{ fontWeight: '500' }}>最近提交:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#666' }}>{gitStatus.lastCommit}</span>
                  </div>
                  
                  {gitStatus.status && (
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px' }}>📁</span>
                        <span style={{ fontWeight: '500' }}>更改的文件</span>
                      </div>
                      <div style={{ 
                        backgroundColor: '#fff', 
                        padding: '8px', 
                        borderRadius: '6px',
                        maxHeight: '250px',
                        overflow: 'auto'
                      }}>
                        <Tree 
                          defaultExpandAll 
                          treeData={parseGitStatusToTree(gitStatus.status)}
                          style={{ fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  )}
                </Card>
                
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>☁️</span>
                      <span>远程仓库</span>
                    </div>
                  }
                  style={{ marginBottom: '16px', borderRadius: '10px' }}
                >
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                      <span style={{ fontSize: '14px', marginTop: '8px' }}>🔗</span>
                      <Input 
                        placeholder="输入远程仓库地址..."
                        value={remoteUrl}
                        onChange={(e) => setRemoteUrl(e.target.value)}
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <Button 
                      type="primary" 
                      onClick={handleSetRemote}
                      loading={isSettingRemote}
                      style={{ borderRadius: '8px' }}
                    >
                      ⚙️ 设置
                    </Button>
                  </div>
                  
                  {remoteUrl && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                      <Button 
                        type="primary" 
                        onClick={handlePush}
                        loading={isPushing}
                        style={{ borderRadius: '8px' }}
                      >
                        📤 推送到远程
                      </Button>
                      <Button 
                        onClick={handlePull}
                        loading={isPulling}
                        style={{ borderRadius: '8px' }}
                      >
                        📥 从远程拉取
                      </Button>
                    </div>
                  )}
                  
                  {gitBlockedBySecret && (
                    <>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                        <Button 
                          danger
                          onClick={handleResetGit}
                          loading={isResettingGit}
                          style={{ borderRadius: '8px' }}
                        >
                          🗑️ 重置 Git 仓库
                        </Button>
                      </div>
                      
                      <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#fff7e6', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px' }}>💡</span>
                          <span style={{ fontSize: '13px', color: '#d46b08' }}>
                            如果推送被 GitHub 的秘密检测阻止，请使用"重置 Git 仓库"功能清除历史记录后重新提交。
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  
                </Card>
                
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>💬</span>
                      <span>提交更改</span>
                    </div>
                  }
                  style={{ marginBottom: '16px', borderRadius: '10px' }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                      <span style={{ fontSize: '14px', marginTop: '8px' }}>✏️</span>
                      <Input 
                        placeholder="输入提交信息..."
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <Button 
                      type="primary" 
                      onClick={handleCommit}
                      loading={isCommitting}
                      style={{ borderRadius: '8px' }}
                    >
                      📌 提交
                    </Button>
                    <Button onClick={fetchGitStatus} style={{ borderRadius: '8px' }}>
                      🔄 刷新
                    </Button>
                  </div>
                </Card>
                
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📜</span>
                      <span>提交历史</span>
                    </div>
                  }
                  style={{ borderRadius: '10px' }}
                >
                  <Table 
                    dataSource={gitCommits}
                    rowKey="hash"
                    pagination={{ pageSize: 10 }}
                    style={{ borderRadius: '8px' }}
                    columns={[
                      {
                        title: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🔑</span>
                            <span>提交哈希</span>
                          </div>
                        ),
                        dataIndex: 'hash',
                        key: 'hash',
                        width: 100,
                        render: (text) => (
                          <code style={{ fontSize: '12px', color: '#1890ff' }}>{text}</code>
                        )
                      },
                      {
                        title: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📝</span>
                            <span>提交信息</span>
                          </div>
                        ),
                        dataIndex: 'message',
                        key: 'message'
                      },
                      {
                        title: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>👤</span>
                            <span>作者</span>
                          </div>
                        ),
                        dataIndex: 'author',
                        key: 'author',
                        width: 120
                      },
                      {
                        title: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🕐</span>
                            <span>时间</span>
                          </div>
                        ),
                        dataIndex: 'time',
                        key: 'time',
                        width: 140
                      },
                      {
                        title: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>⚡</span>
                            <span>操作</span>
                          </div>
                        ),
                        key: 'action',
                        width: 80,
                        render: (_, record) => (
                          <Button 
                            type="link" 
                            size="small"
                            onClick={() => handleCheckout(record.hash)}
                          >
                            🔄 检出
                          </Button>
                        )
                      }
                    ]}
                  />
                </Card>
              </>
            )}
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{editingTask ? '✏️' : '➕'}</span>
            <span>{editingTask ? '编辑定时任务' : '添加定时任务'}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={450}
        style={{ borderRadius: '12px' }}
      >
        <div style={{ padding: '10px 0' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={editingTask ? handleUpdateTask : handleAddTask}
          >
            <Form.Item
              name="name"
              label={
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📝</span>
                  <span>任务名称</span>
                </span>
              }
              rules={[{ required: true, message: '请输入任务名称' }]}
            >
              <Input 
                placeholder="请输入任务名称，如：每日数据库备份" 
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>
            <Form.Item
              name="type"
              label={
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎯</span>
                  <span>任务类型</span>
                </span>
              }
              rules={[{ required: true, message: '请选择任务类型' }]}
            >
              <Select 
                placeholder="请选择任务类型" 
                style={{ borderRadius: '8px' }}
              >
                <Option value="backup">🗄️ 数据库备份</Option>
                <Option value="cleanup">🧹 日志清理</Option>
                <Option value="notification">🔔 通知任务</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="cronExpression"
              label={
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⏱️</span>
                  <span>Cron表达式</span>
                </span>
              }
              rules={[{ required: true, message: '请输入Cron表达式' }]}
            >
              <Input 
                placeholder="例如: 0 0 * * *（每天凌晨执行）" 
                style={{ borderRadius: '8px' }}
              />
              <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                💡 提示：Cron表达式格式为 秒 分 时 日 月 周
              </p>
            </Form.Item>
            <Form.Item
              name="isEnabled"
              label={
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔌</span>
                  <span>状态</span>
                </span>
              }
              initialValue={true}
            >
              <Select style={{ borderRadius: '8px' }}>
                <Option value={true}>✅ 启用</Option>
                <Option value={false}>❌ 禁用</Option>
              </Select>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 缺失文件提示模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>发现缺失的备份文件</span>
          </div>
        }
        open={isMissingModalVisible}
        onCancel={() => setIsMissingModalVisible(false)}
        footer={null}
        width={600}
        style={{ borderRadius: '12px' }}
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ fontSize: '14px', color: '#d93026', marginBottom: '16px' }}>
            检测到 {missingRecords.length} 条备份记录在本地不存在对应的文件，是否删除这些无效记录？
          </p>
          
          <div style={{ 
            border: '1px solid #ffe4e6', 
            borderRadius: '8px', 
            padding: '12px',
            maxHeight: '300px',
            overflow: 'auto',
            backgroundColor: '#fff7f7'
          }}>
            <h4 style={{ marginBottom: '10px', color: '#d93026' }}>📝 缺失文件列表</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {missingRecords.map((record, index) => (
                <li 
                  key={record.id} 
                  style={{ 
                    padding: '8px', 
                    borderBottom: '1px dashed #ffccc7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ color: '#ff4d4f' }}>❌</span>
                  <span style={{ flex: 1 }}>{record.backupFileName}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button onClick={() => setIsMissingModalVisible(false)}>
              取消
            </Button>
            <Button 
              type="primary" 
              danger
              onClick={deleteMissingRecords}
            >
              🗑️ 删除这些记录
            </Button>
          </div>
        </div>
      </Modal>

      {/* 重命名分支模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✏️</span>
            <span>修改分支名称</span>
          </div>
        }
        open={isRenameModalVisible}
        onCancel={() => {
          setIsRenameModalVisible(false)
          setBranchToRename('')
          setNewBranchName('')
        }}
        onOk={handleRenameBranch}
        width={400}
        style={{ borderRadius: '12px' }}
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            将分支 <strong style={{ color: '#1890ff' }}>{branchToRename}</strong> 重命名为：
          </p>
          <Input 
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="输入新分支名称"
            style={{ borderRadius: '8px' }}
            autoFocus
          />
          <p style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>
            💡 分支名称只能包含字母、数字和连字符，不能以连字符开头
          </p>
        </div>
      </Modal>

      {/* 密码验证模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔐</span>
            <span>安全验证</span>
          </div>
        }
        open={isPasswordModalVisible}
        onCancel={() => setIsPasswordModalVisible(false)}
        onOk={() => passwordForm.submit()}
        confirmLoading={passwordLoading}
        width={400}
        style={{ borderRadius: '12px' }}
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px', textAlign: 'center' }}>
            此操作需要验证身份，请输入密码
          </p>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordVerify}
          >
            <Form.Item
              name="password"
              label={
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔑</span>
                  <span>密码</span>
                </span>
              }
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password 
                placeholder="请输入管理员密码" 
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>
          </Form>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '12px', textAlign: 'center' }}>
            ⚠️ 请确保在安全环境下输入密码
          </p>
        </div>
      </Modal>

      {/* 远程分支管理模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🌿</span>
            <span>远程分支管理</span>
            <Button 
              type="link" 
              size="small" 
              onClick={fetchBranches}
              loading={isFetchingBranches}
            >
              🔄 刷新
            </Button>
          </div>
        }
        open={isBranchModalVisible}
        onCancel={() => setIsBranchModalVisible(false)}
        width={600}
        style={{ borderRadius: '12px' }}
      >
        <div style={{ padding: '10px 0' }}>
          {branches.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {branches.map(branch => {
                const isDefault = branch === defaultBranch
                return (
                  <div 
                    key={branch} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      padding: '6px 10px',
                      backgroundColor: '#fff',
                      borderRadius: '6px',
                      border: isDefault ? '1px solid #1890ff' : '1px solid #e8e8e8',
                      boxShadow: isDefault ? '0 0 0 2px rgba(24, 144, 255, 0.1)' : 'none'
                    }}
                  >
                    <span 
                      style={{ 
                        cursor: 'pointer', 
                        color: '#1890ff', 
                        textDecoration: 'underline' 
                      }}
                      onClick={() => openRenameModal(branch)}
                    >
                      {branch}
                    </span>
                    {isDefault && (
                      <span style={{ 
                        fontSize: '10px', 
                        padding: '1px 4px', 
                        borderRadius: '4px',
                        backgroundColor: '#e6f7ff',
                        color: '#1890ff'
                      }}>
                        默认
                      </span>
                    )}
                    <Button 
                      type="text" 
                      size="small" 
                      onClick={() => handleCheckoutBranch(branch)}
                    >
                      切换
                    </Button>
                    {!isDefault && (
                      <Button 
                        type="text" 
                        size="small" 
                        danger
                        onClick={() => handleDeleteBranch(branch)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: '14px', color: '#999' }}>暂无远程分支</p>
              <Button 
                type="default" 
                size="small"
                onClick={fetchBranches}
                loading={isFetchingBranches}
                style={{ marginTop: '12px', borderRadius: '6px' }}
              >
                🔄 刷新分支列表
              </Button>
            </div>
          )}
        </div>
      </Modal>


    </div>
  )
}

export default Tools