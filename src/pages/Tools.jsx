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
  
  // 系统状态相关状态
  const [systemStatus, setSystemStatus] = useState(null)
  const [systemLoading, setSystemLoading] = useState(false)
  
  // 备份记录相关状态
  const [backupRecords, setBackupRecords] = useState([])
  const [backupLoading, setBackupLoading] = useState(false)
  
  // 备份按钮加载状态
  const [backupButtonLoading, setBackupButtonLoading] = useState(false)
  const [restartButtonLoading, setRestartButtonLoading] = useState(false)
  const [cleanupButtonLoading, setCleanupButtonLoading] = useState(false)
  
  // 代理检测相关状态
  const [proxyUrl, setProxyUrl] = useState('http://127.0.0.1:10808')
  const [checkingProxy, setCheckingProxy] = useState(false)
  const [proxyStatus, setProxyStatus] = useState(null)
  
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
  const checkProxy = async () => {
    setCheckingProxy(true)
    setProxyStatus(null)
    try {
      
      const response = await api.post('/api/tools/system/check-proxy', {
        proxyUrl
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
  const downloadBackup = async (backupId) => {
    try {
      
      const response = await api.get(`/api/tools/system/backup/${backupId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      })
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      // 从响应头中获取文件名
      const contentDisposition = response.headers['content-disposition']
      let fileName = 'backup.sql'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.*)/)
        if (match) {
          fileName = match[1]
        }
      }
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success('备份文件下载成功')
    } catch (error) {
      message.error('下载备份文件失败')
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

  // 版本控制相关函数
  const initGitRepo = async () => {
    setIsInitializing(true)
    try {
      const response = await api.post('/api/tools/system/git/init', { type: gitType })
      message.success(response.data.message)
      fetchGitStatus()
      fetchGitLog()
    } catch (error) {
      message.error('初始化 Git 仓库失败')
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

  // 推送到远程仓库
  const handlePush = async () => {
    setIsPushing(true)
    try {
      const response = await api.post('/api/tools/system/git/push', {
        type: gitType
      })
      message.success(response.data.message)
      fetchGitStatus()
    } catch (error) {
      message.error('推送失败')
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
        <TabPane tab="定时任务" key="tasks">
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

        <TabPane tab="系统管理" key="system">
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
                <Form layout="vertical" onFinish={checkProxy}>
                  <Form.Item
                    name="proxyUrl"
                    label="代理地址"
                    rules={[{ required: true, message: '请输入代理地址' }]}
                    initialValue={proxyUrl}
                  >
                    <Input 
                      placeholder="请输入代理地址，例如: http://127.0.0.1:10808" 
                      onChange={(e) => setProxyUrl(e.target.value)}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" onClick={checkProxy} loading={checkingProxy}>
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

            <div style={{ marginTop: '20px' }}>
              <Card title="备份记录">
                <Spin spinning={backupLoading}>
                  <Table 
                    columns={[
                      {
                        title: '备份文件名',
                        dataIndex: 'backupFileName',
                        key: 'backupFileName'
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
                          <Button type="link" onClick={() => downloadBackup(record.id)}>
                            下载
                          </Button>
                        )
                      }
                    ]} 
                    dataSource={backupRecords} 
                    rowKey="id" 
                  />
                </Spin>
              </Card>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <Card title="代码备份记录">
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
                      render: (type) => type === 'backend' ? '后端' : '前端'
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
                    }
                  ]} 
                  dataSource={codeBackupRecords} 
                  rowKey="id" 
                />
              </Card>
            </div>
          </Spin>
        </TabPane>
        
        <TabPane tab="备份代码" key="backup-code">
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
          </Card>
        </TabPane>
        
        <TabPane tab="版本控制" key="version-control">
          <Card title="版本控制">
            <div style={{ marginBottom: '20px' }}>
              <Select 
                value={gitType} 
                onChange={setGitType}
                style={{ width: 200, marginRight: '10px' }}
              >
                <Option value="backend">后端</Option>
                <Option value="frontend">前端</Option>
              </Select>
              
              {!gitStatus?.isInitialized && (
                <Button 
                  type="primary" 
                  onClick={initGitRepo}
                  loading={isInitializing}
                >
                  初始化 Git 仓库
                </Button>
              )}
            </div>
            
            {gitStatus?.isInitialized && (
              <>
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  <h4>Git 状态</h4>
                  <p><strong>当前分支:</strong> {gitStatus.branch}</p>
                  <p><strong>最近提交:</strong> {gitStatus.lastCommit}</p>
                  
                  {gitStatus.status && (
                    <div style={{ marginTop: '10px' }}>
                      <strong>更改的文件:</strong>
                      <pre style={{ 
                        backgroundColor: '#fff', 
                        padding: '10px', 
                        borderRadius: '4px',
                        marginTop: '5px',
                        maxHeight: '200px',
                        overflow: 'auto'
                      }}>
                        {gitStatus.status || '(无更改)'}
                      </pre>
                    </div>
                  )}
                </div>
                
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f7ff', borderRadius: '4px' }}>
                  <h4>远程仓库</h4>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <Input 
                      placeholder="输入远程仓库地址 (例如: https://github.com/username/repo.git)"
                      value={remoteUrl}
                      onChange={(e) => setRemoteUrl(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <Button 
                      type="primary" 
                      onClick={handleSetRemote}
                      loading={isSettingRemote}
                    >
                      设置
                    </Button>
                  </div>
                  {remoteUrl && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Button 
                        type="primary" 
                        onClick={handlePush}
                        loading={isPushing}
                      >
                        推送到远程
                      </Button>
                      <Button 
                        onClick={handlePull}
                        loading={isPulling}
                      >
                        从远程拉取
                      </Button>
                    </div>
                  )}
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <h4>提交更改</h4>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <Input 
                      placeholder="输入提交信息..."
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <Button 
                      type="primary" 
                      onClick={handleCommit}
                      loading={isCommitting}
                    >
                      提交
                    </Button>
                    <Button onClick={fetchGitStatus}>刷新状态</Button>
                  </div>
                </div>
                
                <div>
                  <h4>提交历史</h4>
                  <Table 
                    dataSource={gitCommits}
                    rowKey="hash"
                    pagination={{ pageSize: 10 }}
                    columns={[
                      {
                        title: '提交哈希',
                        dataIndex: 'hash',
                        key: 'hash',
                        width: 100
                      },
                      {
                        title: '提交信息',
                        dataIndex: 'message',
                        key: 'message'
                      },
                      {
                        title: '作者',
                        dataIndex: 'author',
                        key: 'author',
                        width: 150
                      },
                      {
                        title: '时间',
                        dataIndex: 'time',
                        key: 'time',
                        width: 150
                      },
                      {
                        title: '操作',
                        key: 'action',
                        width: 100,
                        render: (_, record) => (
                          <Button 
                            type="link" 
                            size="small"
                            onClick={() => handleCheckout(record.hash)}
                          >
                            检出
                          </Button>
                        )
                      }
                    ]}
                  />
                </div>
              </>
            )}
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={editingTask ? '编辑定时任务' : '添加定时任务'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingTask ? handleUpdateTask : handleAddTask}
        >
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="任务类型"
            rules={[{ required: true, message: '请选择任务类型' }]}
          >
            <Select placeholder="请选择任务类型">
              <Option value="backup">数据库备份</Option>
              <Option value="cleanup">日志清理</Option>
              <Option value="notification">通知任务</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="cronExpression"
            label="Cron表达式"
            rules={[{ required: true, message: '请输入Cron表达式' }]}
          >
            <Input placeholder="请输入Cron表达式，例如: 0 0 * * *" />
          </Form.Item>
          <Form.Item
            name="isEnabled"
            label="状态"
            initialValue={true}
          >
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 密码验证模态框 */}
      <Modal
        title="请输入密码进行验证"
        open={isPasswordModalVisible}
        onCancel={() => setIsPasswordModalVisible(false)}
        onOk={() => passwordForm.submit()}
        confirmLoading={passwordLoading}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordVerify}
        >
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        </Form>
      </Modal>


    </div>
  )
}

export default Tools