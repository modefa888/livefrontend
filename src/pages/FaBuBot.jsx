import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Table, Form, Input, Select, Modal, message, Spin, Tabs, Alert, Switch, Popconfirm, Tag, Upload, Tooltip } from 'antd'
import { RobotOutlined, PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, ArrowLeftOutlined, EyeInvisibleOutlined, EyeTwoTone, CopyOutlined, UpOutlined, DownOutlined, UserOutlined, StopOutlined, CheckOutlined, SmileOutlined, PictureOutlined } from '@ant-design/icons'
import EmojiPicker from 'emoji-picker-react'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'
import { useBotLoading } from '../contexts/BotLoadingContext'

const { Option } = Select
const { TabPane } = Tabs

const FaBuBot = () => {
  const navigate = useNavigate()
  const { fabuBotLoading, setFabuBotLoading } = useBotLoading()
  
  const [botStatus, setBotStatus] = useState(null)
  const [refreshLoading, setRefreshLoading] = useState(false)
  
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null)
  const [countdown, setCountdown] = useState(30)
  
  const [mediaGroups, setMediaGroups] = useState([])
  const [mediaGroupsLoading, setMediaGroupsLoading] = useState(false)
  
  const [singleVideos, setSingleVideos] = useState([])
  const [singleVideosLoading, setSingleVideosLoading] = useState(false)
  
  const [configLoading, setConfigLoading] = useState(true)
  const [fabuConfig, setFabuConfig] = useState(null)
  const [configForm] = Form.useForm()
  const [savingConfig, setSavingConfig] = useState(false)
  const [configChanged, setConfigChanged] = useState(false)
  
  const [visibleFields, setVisibleFields] = useState({
    FABU_TELEGRAM_TOKEN: false,
    MYSQL_PASSWORD: false
  })
  
  // 代理检测相关状态
  const [proxyStatus, setProxyStatus] = useState(null)
  const [checkingProxy, setCheckingProxy] = useState(false)
  
  // 媒体组详情 Modal 相关状态
  const [mediaGroupModalVisible, setMediaGroupModalVisible] = useState(false)
  const [currentMediaGroup, setCurrentMediaGroup] = useState(null)
  const [mediaItems, setMediaItems] = useState([])
  const [mediaItemsLoading, setMediaItemsLoading] = useState(false)
  
  // 文件详情 Modal 相关状态
  const [fileDetailModalVisible, setFileDetailModalVisible] = useState(false)
  const [currentFileItem, setCurrentFileItem] = useState(null)
  const [fileDetailType, setFileDetailType] = useState('')
  
  // 命令管理
  const [commands, setCommands] = useState([])
  const [commandsLoading, setCommandsLoading] = useState(false)
  const [isCommandModalVisible, setIsCommandModalVisible] = useState(false)
  const [editingCommand, setEditingCommand] = useState(null)
  const [commandForm] = Form.useForm()
  
  // 删除命令确认 Modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [commandToDelete, setCommandToDelete] = useState(null)
  
  // 编辑描述 Modal
  const [editCaptionModalVisible, setEditCaptionModalVisible] = useState(false)
  const [editingCaptionItem, setEditingCaptionItem] = useState(null)
  const [editingCaptionType, setEditingCaptionType] = useState('') // 'single-video' 或 'media-item'
  const [editCaptionForm] = Form.useForm()
  const [savingCaption, setSavingCaption] = useState(false)
  
  // 用户管理
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersPagination, setUsersPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [userDetailModalVisible, setUserDetailModalVisible] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [deleteUserModalVisible, setDeleteUserModalVisible] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  
  // 聊天功能
  const [chatModalVisible, setChatModalVisible] = useState(false)
  const [chatUser, setChatUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [sendMessageLoading, setSendMessageLoading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [sendingPhoto, setSendingPhoto] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({})
  const emojiPickerRef = useRef(null)
  const messagesListRef = useRef(null)

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success(`${fieldName} 已复制到剪贴板`)
      })
      .catch(err => {
        message.error('复制失败')
        console.error('复制失败:', err)
      })
  }
  
  const toggleVisible = (field) => {
    setVisibleFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const fetchBotStatus = async () => {
    setRefreshLoading(true)
    try {
      const response = await api.get('/api/fabu-bot/status')
      setBotStatus(response.data)
    } catch (error) {
      message.error('获取机器人状态失败')
      console.error(error)
    } finally {
      setRefreshLoading(false)
    }
  }

  const startBot = async () => {
    setFabuBotLoading(true)
    try {
      await api.post('/api/fabu-bot/start', {})
      message.success('机器人启动成功')
      fetchBotStatus()
    } catch (error) {
      message.error('启动机器人失败')
      console.error(error)
    } finally {
      setFabuBotLoading(false)
    }
  }

  const stopBot = async () => {
    setFabuBotLoading(true)
    try {
      await api.post('/api/fabu-bot/stop', {})
      message.success('机器人停止成功')
      fetchBotStatus()
    } catch (error) {
      message.error('停止机器人失败')
      console.error(error)
    } finally {
      setFabuBotLoading(false)
    }
  }

  const fetchMediaGroups = async () => {
    setMediaGroupsLoading(true)
    try {
      const response = await api.get('/api/fabu-bot/media-groups')
      setMediaGroups(response.data.mediaGroups || [])
    } catch (error) {
      console.error('获取媒体组列表失败:', error)
    } finally {
      setMediaGroupsLoading(false)
    }
  }

  const fetchSingleVideos = async () => {
    setSingleVideosLoading(true)
    try {
      const response = await api.get('/api/fabu-bot/single-videos')
      setSingleVideos(response.data.singleVideos || [])
    } catch (error) {
      console.error('获取单个视频列表失败:', error)
    } finally {
      setSingleVideosLoading(false)
    }
  }
  
  const fetchMediaItems = async (mediaGroupId) => {
    setMediaItemsLoading(true)
    try {
      const response = await api.get(`/api/fabu-bot/media-groups/${mediaGroupId}`)
      setMediaItems(response.data.mediaItems || [])
    } catch (error) {
      console.error('获取媒体组详情失败:', error)
    } finally {
      setMediaItemsLoading(false)
    }
  }
  
  const openMediaGroupModal = (mediaGroup) => {
    setCurrentMediaGroup(mediaGroup)
    setMediaItems([])
    setMediaGroupModalVisible(true)
    fetchMediaItems(mediaGroup.media_group_id)
  }
  
  const openFileDetailModal = (fileItem, type) => {
    setCurrentFileItem(fileItem)
    setFileDetailType(type)
    setFileDetailModalVisible(true)
  }

  // 检测代理状态
  const checkProxyStatus = async (proxyUrl) => {
    setCheckingProxy(true)
    try {
      const response = await api.post('/api/tools/system/check-proxy', {
        proxyUrl
      })
      setProxyStatus(response.data)
    } catch (error) {
      console.error('代理检测失败:', error)
    } finally {
      setCheckingProxy(false)
    }
  }

  const fetchConfig = async () => {
    try {
      setConfigLoading(true)
      const response = await api.get('/api/fabu-bot/config')
      setFabuConfig(response.data.config)
      configForm.setFieldsValue(response.data.config)
      setConfigChanged(false)
      // 自动检测代理状态
      const proxyHost = response.data.config.PROXY_HOST
      const proxyPort = response.data.config.PROXY_PORT
      if (proxyHost && proxyPort) {
        // 添加 http:// 前缀
        const cleanHost = proxyHost.replace(/^https?:\/\//, '')
        const proxyUrl = `http://${cleanHost}:${proxyPort}`
        checkProxyStatus(proxyUrl)
      }
    } catch (error) {
      message.error('获取配置失败')
      console.error(error)
    } finally {
      setConfigLoading(false)
    }
  }

  const handleConfigUpdate = async (values) => {
    try {
      setSavingConfig(true)
      await api.put('/api/fabu-bot/config', { config: values })
      message.success('配置更新成功，请重启服务生效')
      setConfigChanged(false)
    } catch (error) {
      message.error('配置更新失败')
      console.error(error)
    } finally {
      setSavingConfig(false)
    }
  }

  // 命令管理函数
  const fetchCommands = async () => {
    setCommandsLoading(true)
    try {
      const response = await api.get('/api/fabu-bot/commands')
      const sortedCommands = response.data.commands.sort((a, b) => (a.order || 0) - (b.order || 0))
      setCommands(sortedCommands)
    } catch (error) {
      message.error('获取命令列表失败')
      console.error(error)
    } finally {
      setCommandsLoading(false)
    }
  }

  const showCommandModal = (command = null) => {
    setEditingCommand(command)
    if (command) {
      commandForm.setFieldsValue(command)
    } else {
      commandForm.resetFields()
    }
    setIsCommandModalVisible(true)
  }

  const handleSaveCommand = async (values) => {
    try {
      if (editingCommand) {
        await api.put(`/api/fabu-bot/commands/${editingCommand.command}`, values)
        message.success('命令更新成功')
      } else {
        await api.post('/api/fabu-bot/commands', values)
        message.success('命令添加成功')
      }
      setIsCommandModalVisible(false)
      fetchCommands()
    } catch (error) {
      message.error(editingCommand ? '更新命令失败' : '添加命令失败')
      console.error(error)
    }
  }

  const showDeleteModal = (command) => {
    setCommandToDelete(command)
    setDeleteModalVisible(true)
  }

  // 编辑描述函数
  const showEditCaptionModal = (item, type) => {
    setEditingCaptionItem(item)
    setEditingCaptionType(type)
    editCaptionForm.setFieldsValue({ caption: item.caption || '' })
    setEditCaptionModalVisible(true)
  }

  const handleSaveCaption = async (values) => {
    setSavingCaption(true)
    try {
      const apiUrl = editingCaptionType === 'single-video' 
        ? `/api/fabu-bot/single-videos/${editingCaptionItem.id}/caption`
        : `/api/fabu-bot/media-items/${editingCaptionItem.id}/caption`
      
      await api.put(apiUrl, { caption: values.caption })
      message.success('描述更新成功')
      setEditCaptionModalVisible(false)
      
      // 刷新相关数据
      if (editingCaptionType === 'single-video') {
        fetchSingleVideos()
      } else {
        if (currentMediaGroup) {
          fetchMediaItems(currentMediaGroup.media_group_id)
        }
      }
      
      // 更新当前文件项
      if (currentFileItem && currentFileItem.id === editingCaptionItem.id) {
        setCurrentFileItem({ ...currentFileItem, caption: values.caption })
      }
    } catch (error) {
      message.error('更新描述失败')
      console.error(error)
    } finally {
      setSavingCaption(false)
    }
  }

  const confirmDelete = async () => {
    try {
      const cmd = commandToDelete.startsWith('/') ? commandToDelete.slice(1) : commandToDelete
      await api.delete(`/api/fabu-bot/commands/${cmd}`)
      message.success('命令删除成功')
      fetchCommands()
      setDeleteModalVisible(false)
      setCommandToDelete(null)
    } catch (error) {
      message.error('删除命令失败')
      console.error(error)
    }
  }

  const cancelDelete = () => {
    setDeleteModalVisible(false)
    setCommandToDelete(null)
  }
  
  // 获取单个用户未读消息数
  const fetchUnreadCount = async (userId) => {
    try {
      const response = await api.get(`/api/fabu-bot/users/${userId}/unread-count`)
      return response.data.count || 0
    } catch (error) {
      console.error('获取未读消息数失败:', error)
      return 0
    }
  }

  // 用户管理函数
  const fetchUsers = async (page = 1, pageSize = 20) => {
    setUsersLoading(true)
    try {
      const response = await api.get('/api/fabu-bot/users', {
        params: { page, pageSize }
      })
      const users = response.data.users
      
      // 为每个用户获取未读消息数
      const counts = {}
      await Promise.all(
        users.map(async (user) => {
          const count = await fetchUnreadCount(user.user_id)
          counts[user.user_id] = count
        })
      )
      setUnreadCounts(counts)
      
      setUsers(users)
      setUsersPagination({
        current: response.data.page,
        pageSize: response.data.pageSize,
        total: response.data.total
      })
    } catch (error) {
      message.error('获取用户列表失败')
      console.error(error)
    } finally {
      setUsersLoading(false)
    }
  }
  
  const openUserDetailModal = async (user) => {
    try {
      const response = await api.get(`/api/fabu-bot/users/${user.user_id}`)
      setCurrentUser(response.data.user)
      setUserDetailModalVisible(true)
    } catch (error) {
      message.error('获取用户详情失败')
      console.error(error)
    }
  }
  
  const toggleUserBlock = async (user) => {
    try {
      await api.put(`/api/fabu-bot/users/${user.user_id}/block`, {
        isBlocked: !user.is_blocked
      })
      message.success(user.is_blocked ? '用户已取消屏蔽' : '用户已屏蔽')
      fetchUsers(usersPagination.current, usersPagination.pageSize)
    } catch (error) {
      message.error('更新用户状态失败')
      console.error(error)
    }
  }
  
  const showDeleteUserModal = (user) => {
    setUserToDelete(user)
    setDeleteUserModalVisible(true)
  }
  
  const confirmDeleteUser = async () => {
    try {
      await api.delete(`/api/fabu-bot/users/${userToDelete.user_id}`)
      message.success('用户删除成功')
      fetchUsers(usersPagination.current, usersPagination.pageSize)
      setDeleteUserModalVisible(false)
      setUserToDelete(null)
    } catch (error) {
      message.error('删除用户失败')
      console.error(error)
    }
  }
  
  const cancelDeleteUser = () => {
    setDeleteUserModalVisible(false)
    setUserToDelete(null)
  }
  
  // 打开聊天窗口
  const openChatModal = async (user) => {
    setChatUser(user)
    setChatModalVisible(true)
    await fetchMessages(user.user_id)
  }
  
  // 获取消息列表
  const fetchMessages = async (userId) => {
    setMessagesLoading(true)
    try {
      const response = await api.get(`/api/fabu-bot/users/${userId}/messages`)
      const msgs = response.data.messages || []
      setMessages(msgs)
      
      // 滚动到第一条未读消息，或者底部
      setTimeout(() => {
        if (messagesListRef.current) {
          // 找到第一条未读消息
          const firstUnreadIndex = msgs.findIndex(msg => msg.direction === 'incoming' && msg.is_read === 0)
          
          if (firstUnreadIndex !== -1) {
            // 找到对应的元素
            const messageElements = messagesListRef.current.children
            if (messageElements[firstUnreadIndex]) {
              messageElements[firstUnreadIndex].scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          } else {
            // 没有未读消息，滚动到底部
            messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight
          }
        }
      }, 100)
      
      // 刷新未读消息数
      fetchUsers(usersPagination.current, usersPagination.pageSize)
    } catch (error) {
      message.error('获取消息列表失败')
      console.error(error)
    } finally {
      setMessagesLoading(false)
    }
  }
  
  // 发送消息
  const sendMessage = async () => {
    if (!messageInput.trim()) {
      return
    }
    
    setSendMessageLoading(true)
    try {
      await api.post(`/api/fabu-bot/users/${chatUser.user_id}/send`, {
        text: messageInput
      })
      message.success('消息发送成功')
      setMessageInput('')
      // 刷新消息列表
      await fetchMessages(chatUser.user_id)
    } catch (error) {
      message.error('发送消息失败')
      console.error(error)
    } finally {
      setSendMessageLoading(false)
    }
  }

  // 选择Emoji
  const handleEmojiClick = (emojiObject) => {
    setMessageInput(prev => prev + emojiObject.emoji)
    setShowEmojiPicker(false)
  }

  // 上传并发送图片
  const handlePhotoUpload = async (file) => {
    setSendingPhoto(true)
    try {
      // 创建FormData
      const formData = new FormData()
      formData.append('photo', file)
      
      await api.post(`/api/fabu-bot/users/${chatUser.user_id}/send-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      message.success('图片发送成功')
      // 刷新消息列表
      await fetchMessages(chatUser.user_id)
    } catch (error) {
      message.error('发送图片失败')
      console.error(error)
    } finally {
      setSendingPhoto(false)
    }
    return false // 阻止自动上传
  }

  // 点击外部关闭Emoji选择器
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  const updateCommandField = async (command, field, value) => {
    try {
      // 去掉命令开头的 /
      const cleanCommand = command.startsWith('/') ? command.substring(1) : command
      await api.put(`/api/fabu-bot/commands/${cleanCommand}`, {
        [field]: value
      })
      fetchCommands()
    } catch (error) {
      message.error('更新命令失败')
      console.error(error)
    }
  }

  const moveCommand = async (command, direction) => {
    const currentIndex = commands.findIndex(cmd => cmd.command === command)
    if (currentIndex === -1) {
      message.error('命令不存在')
      return
    }

    let newIndex
    if (direction === 'up') {
      newIndex = Math.max(0, currentIndex - 1)
    } else {
      newIndex = Math.min(commands.length - 1, currentIndex + 1)
    }

    const targetCommand = commands[newIndex]
    if (!targetCommand) {
      message.error('目标命令不存在')
      return
    }

    const currentOrder = commands[currentIndex].order || 0
    const targetOrder = targetCommand.order || 0

    // 去掉命令开头的 /
    const cleanCommand = command.startsWith('/') ? command.substring(1) : command
    const cleanTargetCommand = targetCommand.command.startsWith('/') ? targetCommand.command.substring(1) : targetCommand.command

    try {
      await api.put('/api/fabu-bot/commands/order', {
        command: cleanCommand,
        newOrder: targetOrder
      })
      await api.put('/api/fabu-bot/commands/order', {
        command: cleanTargetCommand,
        newOrder: currentOrder
      })
      fetchCommands()
    } catch (error) {
      message.error('移动命令失败')
      console.error(error)
    }
  }

  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      clearInterval(autoRefreshInterval)
      setAutoRefreshInterval(null)
      setAutoRefresh(false)
      setCountdown(30)
    } else {
      fetchBotStatus()
      setCountdown(30)
      const interval = setInterval(() => {
        setCountdown(prevCountdown => {
          if (prevCountdown <= 1) {
            fetchBotStatus()
            return 30
          }
          return prevCountdown - 1
        })
      }, 1000)
      
      setAutoRefreshInterval(interval)
      setAutoRefresh(true)
    }
  }

  useEffect(() => {
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
      }
    }
  }, [autoRefreshInterval])

  useEffect(() => {
    fetchBotStatus()
    fetchMediaGroups()
    fetchSingleVideos()
    fetchConfig()
    fetchCommands()
    fetchUsers()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/bot')}
          style={{ marginRight: '16px' }}
        >
          返回
        </Button>
        <h1 style={{ margin: 0 }}>FaBuBot 管理</h1>
      </div>
      
      <Tabs 
        defaultActiveKey="status"
        tabBarExtraContent={
          <div>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={startBot} 
              disabled={botStatus?.isRunning || fabuBotLoading}
              loading={fabuBotLoading}
              style={{ marginRight: '10px' }}
            >
              启动机器人
            </Button>
            <Button 
              danger 
              icon={<PauseCircleOutlined />}
              onClick={stopBot} 
              disabled={!botStatus?.isRunning || fabuBotLoading}
              loading={fabuBotLoading}
            >
              停止机器人
            </Button>
          </div>
        }
      >
        
        <TabPane tab={botStatus?.isRunning ? '🤖 机器人状态 (运行中)' : '🚫 机器人状态 (已停止)'} key="status">
          <Spin spinning={fabuBotLoading}>
            <Card title="⚙️ 机器人状态" extra={<Button icon={<ReloadOutlined />} onClick={toggleAutoRefresh} loading={refreshLoading} type={autoRefresh ? 'primary' : 'default'}>{autoRefresh ? `停止自动刷新 (${countdown}s)` : '启动自动刷新 (30s)'}</Button>}>  
              <div style={{ fontSize: '16px', lineHeight: '2' }}>
                <p><strong>运行状态:</strong> {botStatus?.isRunning ? '✅ 运行中' : '❌ 已停止'}</p>
                {botStatus?.error && <p><strong>错误信息:</strong> <span style={{ color: 'red' }}>{botStatus.error}</span></p>}
                
                {fabuConfig && (
                  <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                    <h3 style={{ marginBottom: '10px' }}>🌐 配置状态</h3>
                    <p><strong>🤖 机器人名称:</strong> {fabuConfig.BOT_NAME || 'faBuBot'}</p>
                    <p><strong>🔑 机器人 Token:</strong> {fabuConfig.FABU_TELEGRAM_TOKEN ? '已配置' : '未配置'}</p>
                    <p><strong>📢 通知用户 ID:</strong> {fabuConfig.FABU_NOTIFY_USER_ID || '未配置'}</p>
                    <p><strong>📬 转发目标群组:</strong> {fabuConfig.FORWARD_CHAT_ID || '未配置'}</p>
                    <p><strong>📍 代理地址:</strong> {fabuConfig.PROXY_HOST && fabuConfig.PROXY_PORT ? `http://${fabuConfig.PROXY_HOST.replace(/^https?:\/\//, '')}:${fabuConfig.PROXY_PORT}` : '未配置'}
                      {fabuConfig.PROXY_HOST && fabuConfig.PROXY_PORT && (
                        <Button 
                          type="link" 
                          size="small" 
                          onClick={() => {
                            const cleanHost = fabuConfig.PROXY_HOST.replace(/^https?:\/\//, '')
                            checkProxyStatus(`http://${cleanHost}:${fabuConfig.PROXY_PORT}`)
                          }}
                          loading={checkingProxy}
                          style={{ marginLeft: '10px' }}
                        >
                          {checkingProxy ? '检测中...' : '检测'}
                        </Button>
                      )}
                      {proxyStatus && (
                        <span style={{ marginLeft: '10px', color: proxyStatus.success ? '#52c41a' : '#ff4d4f' }}>
                          {proxyStatus.success ? '✅ 可用' : '❌ 不可用'}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </Spin>
        </TabPane>
        
        <TabPane tab="媒体组管理" key="media-groups">
          <Spin spinning={mediaGroupsLoading}>
            <Card 
              title="📋 媒体组列表" 
              extra={
                <Button onClick={fetchMediaGroups} loading={mediaGroupsLoading}>
                  刷新列表
                </Button>
              }
            >
              <Table 
                columns={[
                  {
                    title: 'ID',
                    dataIndex: 'id',
                    key: 'id'
                  },
                  {
                    title: '媒体组ID',
                    dataIndex: 'media_group_id',
                    key: 'media_group_id'
                  },
                  {
                    title: '聊天ID',
                    dataIndex: 'chat_id',
                    key: 'chat_id'
                  },
                  {
                    title: '用户名',
                    dataIndex: 'username',
                    key: 'username'
                  },
                  {
                    title: '消息数量',
                    dataIndex: 'message_count',
                    key: 'message_count'
                  },
                  {
                    title: '创建时间',
                    dataIndex: 'created_at',
                    key: 'created_at',
                    render: (createdAt) => (
                      <span>{new Date(createdAt).toLocaleString()}</span>
                    )
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_, record) => (
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => openMediaGroupModal(record)}
                      >
                        查看
                      </Button>
                    )
                  }
                ]} 
                dataSource={mediaGroups} 
                rowKey="id" 
              />
            </Card>
          </Spin>
        </TabPane>
        
        <TabPane tab="单个视频管理" key="single-videos">
          <Spin spinning={singleVideosLoading}>
            <Card 
              title="🎬 单个视频列表" 
              extra={
                <Button onClick={fetchSingleVideos} loading={singleVideosLoading}>
                  刷新列表
                </Button>
              }
            >
              <Table 
                columns={[
                  {
                    title: 'ID',
                    dataIndex: 'id',
                    key: 'id',
                    width: 60
                  },
                  {
                    title: '文件ID',
                    dataIndex: 'file_id',
                    key: 'file_id',
                    ellipsis: true,
                    render: (fileId) => (
                      <span>{fileId ? `...${fileId.slice(-8)}` : '-'}</span>
                    )
                  },
                  {
                    title: '聊天ID',
                    dataIndex: 'chat_id',
                    key: 'chat_id'
                  },
                  {
                    title: '用户ID',
                    dataIndex: 'user_id',
                    key: 'user_id'
                  },
                  {
                    title: '时长',
                    dataIndex: 'duration',
                    key: 'duration',
                    render: (duration) => duration ? `${duration}秒` : '-'
                  },
                  {
                    title: '创建时间',
                    dataIndex: 'timestamp',
                    key: 'timestamp',
                    render: (timestamp) => (
                      <span>{new Date(timestamp).toLocaleString()}</span>
                    )
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_, record) => (
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => openFileDetailModal(record, 'all')}
                      >
                        查看
                      </Button>
                    )
                  }
                ]} 
                dataSource={singleVideos} 
                rowKey="id" 
              />
            </Card>
          </Spin>
        </TabPane>
        
        <TabPane tab="配置管理" key="config">
          <Spin spinning={configLoading}>
            <Card style={{ marginBottom: 20 }}>
              <Alert message="修改配置后需要重启服务才能生效" type="info" />
            </Card>
            
            <Card title="faBuBot 配置">
              <Form
                form={configForm}
                layout="vertical"
                onFinish={handleConfigUpdate}
                onValuesChange={() => setConfigChanged(true)}
              >
                <Form.Item 
                  label="机器人名称" 
                  name="BOT_NAME"
                >
                  <Input placeholder="请输入机器人名称" />
                </Form.Item>
                
                <Form.Item 
                  label="faBuBot Token" 
                  name="FABU_TELEGRAM_TOKEN" 
                  rules={[{ required: true, message: '请输入 faBuBot Token' }]}
                >
                  <Input.Password
                    placeholder="请输入 faBuBot Token"
                    iconRender={(visible) => (
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    )}
                    visibilityToggle={{
                      visible: visibleFields.FABU_TELEGRAM_TOKEN,
                      onVisibleChange: () => toggleVisible('FABU_TELEGRAM_TOKEN')
                    }}
                    suffix={
                      <Button 
                        type="text" 
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(fabuConfig?.FABU_TELEGRAM_TOKEN || '', 'faBuBot Token')}
                      />
                    }
                  />
                </Form.Item>
                
                <Form.Item 
                  label="faBuBot 启动通知用户 ID" 
                  name="FABU_NOTIFY_USER_ID"
                >
                  <Input placeholder="请输入通知用户 ID" />
                </Form.Item>
                
                <Form.Item 
                  label="转发目标群组 ID" 
                  name="FORWARD_CHAT_ID"
                >
                  <Input placeholder="请输入转发目标群组 ID" />
                </Form.Item>
                
                <Card title="代理配置" size="small" style={{ marginBottom: 16 }}>
                  <Form.Item 
                    label="代理主机" 
                    name="PROXY_HOST"
                  >
                    <Input placeholder="请输入代理主机（如：127.0.0.1）" />
                  </Form.Item>
                  
                  <Form.Item 
                    label="代理端口" 
                    name="PROXY_PORT"
                  >
                    <Input placeholder="请输入代理端口（如：7890）" />
                  </Form.Item>
                </Card>
                
                <Form.Item style={{ textAlign: 'right', margin: 0 }}>
                  <Button type="primary" htmlType="submit" loading={savingConfig} disabled={!configChanged}>
                    保存配置
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Spin>
        </TabPane>
        
        <TabPane 
          tab="命令管理" 
          key="commands"
        >
          <Spin spinning={commandsLoading}>
            <Card 
              title="📋 命令列表" 
              extra={
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button type="primary" onClick={() => showCommandModal()}>添加命令</Button>
                  <Button onClick={fetchCommands} loading={commandsLoading}>
                    刷新列表
                  </Button>
                </div>
              }
            >
              <Table 
                columns={[
                  {
                    title: '排序',
                    dataIndex: 'order',
                    key: 'order',
                    width: 100,
                    render: (order, record, index) => (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button 
                          type="text" 
                          icon={<UpOutlined />} 
                          size="small" 
                          onClick={() => moveCommand(record.command, 'up')}
                          disabled={index === 0}
                        />
                        <span style={{ margin: '0 8px' }}>{order || 0}</span>
                        <Button 
                          type="text" 
                          icon={<DownOutlined />} 
                          size="small" 
                          onClick={() => moveCommand(record.command, 'down')}
                          disabled={index === commands.length - 1}
                        />
                      </div>
                    )
                  },
                  {
                    title: '命令',
                    dataIndex: 'command',
                    key: 'command'
                  },
                  {
                    title: '描述',
                    dataIndex: 'description',
                    key: 'description'
                  },
                  {
                    title: '启动状态',
                    dataIndex: 'isEnabled',
                    key: 'isEnabled',
                    render: (isEnabled, record) => (
                      <Switch 
                        checked={isEnabled} 
                        onChange={(checked) => updateCommandField(record.command, 'isEnabled', checked)}
                        checkedChildren="启用" 
                        unCheckedChildren="禁用"
                      />
                    )
                  },
                  {
                    title: '用户类型',
                    dataIndex: 'isAdmin',
                    key: 'isAdmin',
                    render: (isAdmin, record) => (
                      <Switch 
                        checked={isAdmin} 
                        onChange={(checked) => updateCommandField(record.command, 'isAdmin', checked)}
                        checkedChildren="管理员" 
                        unCheckedChildren="普通用户"
                      />
                    )
                  },
                  {
                    title: '更新时间',
                    dataIndex: 'updatedAt',
                    key: 'updatedAt',
                    render: (updatedAt) => (
                      <span>{new Date(updatedAt).toLocaleString()}</span>
                    )
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_, record) => (
                      <div>
                        <Button type="primary" size="small" style={{ marginRight: '8px' }} onClick={() => showCommandModal(record)}>
                          编辑
                        </Button>
                        <Button danger size="small" onClick={() => showDeleteModal(record.command)}>
                          删除
                        </Button>
                      </div>
                    )
                  }
                ]} 
                dataSource={commands} 
                rowKey="command" 
              />
            </Card>
          </Spin>
        </TabPane>
        
        <TabPane 
          tab="用户管理" 
          key="users"
        >
          <Spin spinning={usersLoading}>
            <Card 
              title="👥 用户列表" 
              extra={
                <Button onClick={() => fetchUsers(usersPagination.current, usersPagination.pageSize)} loading={usersLoading}>
                  刷新列表
                </Button>
              }
            >
              <Table 
                columns={[
                  {
                    title: '用户ID',
                    dataIndex: 'user_id',
                    key: 'user_id',
                    width: 120
                  },
                  {
                    title: '用户名',
                    dataIndex: 'username',
                    key: 'username',
                    render: (username) => username ? `@${username}` : '-'
                  },
                  {
                    title: '姓名',
                    key: 'name',
                    render: (_, record) => (
                      <span>
                        {record.first_name || ''} {record.last_name || ''}
                      </span>
                    )
                  },
                  {
                    title: '语言',
                    dataIndex: 'language_code',
                    key: 'language_code',
                    width: 80
                  },
                  {
                    title: '未读消息',
                    key: 'unread',
                    width: 100,
                    render: (_, record) => {
                      const count = unreadCounts[record.user_id] || 0
                      return count > 0 ? (
                        <Tag color="red" style={{ fontWeight: 'bold' }}>
                          {count} 条未读
                        </Tag>
                      ) : (
                        <Tag color="default">0</Tag>
                      )
                    }
                  },
                  {
                    title: '状态',
                    key: 'status',
                    width: 100,
                    render: (_, record) => (
                      <div>
                        {record.is_bot ? <Tag color="blue">机器人</Tag> : <Tag color="green">用户</Tag>}
                        {record.is_premium && <Tag color="gold">Premium</Tag>}
                      </div>
                    )
                  },
                  {
                    title: '屏蔽状态',
                    dataIndex: 'is_blocked',
                    key: 'is_blocked',
                    width: 100,
                    render: (isBlocked, record) => (
                      <Switch 
                        checked={isBlocked} 
                        onChange={() => toggleUserBlock(record)}
                        checkedChildren={<><StopOutlined /> 已屏蔽</>}
                        unCheckedChildren={<><CheckOutlined /> 正常</>}
                      />
                    )
                  },
                  {
                    title: '最后活跃',
                    dataIndex: 'last_active_at',
                    key: 'last_active_at',
                    width: 160,
                    render: (lastActiveAt) => lastActiveAt ? new Date(lastActiveAt).toLocaleString() : '-'
                  },

                  {
                    title: '操作',
                    key: 'action',
                    width: 160,
                    render: (_, record) => (
                      <div>
                        <Button 
                          type="primary" 
                          size="small" 
                          icon={<UserOutlined />}
                          style={{ marginRight: '8px' }}
                          onClick={() => openUserDetailModal(record)}
                        >
                          详情
                        </Button>
                        <Button 
                          type="default" 
                          size="small"
                          onClick={() => openChatModal(record)}
                        >
                          聊天
                        </Button>
                      </div>
                    )
                  }
                ]} 
                dataSource={users} 
                rowKey="user_id"
                pagination={{
                  current: usersPagination.current,
                  pageSize: usersPagination.pageSize,
                  total: usersPagination.total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                  onChange: (page, pageSize) => fetchUsers(page, pageSize)
                }}
              />
            </Card>
          </Spin>
        </TabPane>
      </Tabs>
      
      {/* 媒体组详情 Modal */}
      <Modal
        title={`媒体组详情 - ${currentMediaGroup?.media_group_id}`}
        open={mediaGroupModalVisible}
        onCancel={() => setMediaGroupModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setMediaGroupModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
        zIndex={1000}
      >
        <Spin spinning={mediaItemsLoading}>
          {currentMediaGroup && (
            <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
              <p><strong>媒体组ID:</strong> {currentMediaGroup.media_group_id}</p>
              <p><strong>聊天ID:</strong> {currentMediaGroup.chat_id}</p>
              <p><strong>用户名:</strong> {currentMediaGroup.username || '-'}</p>
              <p><strong>消息数量:</strong> {currentMediaGroup.message_count}</p>
              <p><strong>创建时间:</strong> {new Date(currentMediaGroup.created_at).toLocaleString()}</p>
              {currentMediaGroup.forwarded_message_ids && (
                <>
                  <p><strong>转发消息ID:</strong> {JSON.parse(currentMediaGroup.forwarded_message_ids).join(', ')}</p>
                  {fabuConfig?.FORWARD_CHAT_ID && (
                    <p>
                      <strong>跳转链接:</strong>
                      {JSON.parse(currentMediaGroup.forwarded_message_ids).map((msgId, index) => (
                        <a 
                          key={index}
                          href={`https://t.me/c/${fabuConfig.FORWARD_CHAT_ID.toString().replace('-100', '')}/${msgId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginLeft: index > 0 ? '8px' : '8px' }}
                        >
                          消息{index + 1}
                        </a>
                      ))}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
          
          {mediaItems.length > 0 ? (
            <Table
              dataSource={mediaItems}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'ID',
                  dataIndex: 'id',
                  key: 'id',
                  width: 15
                },
                {
                  title: '类型',
                  dataIndex: 'type',
                  key: 'type',
                  width: 100,
                  render: (type) => {
                    const typeMap = {
                      photo: '🖼️ 照片',
                      video: '🎬 视频',
                      document: '📄 文档',
                      audio: '🎵 音频'
                    }
                    return typeMap[type] || type
                  }
                },
                {
                  title: '文件ID',
                  dataIndex: 'file_id',
                  key: 'file_id',
                  ellipsis: true,
                  render: (fileId, record) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{fileId ? `...${fileId.slice(-8)}` : '-'}</span>
                      <Button 
                        type="link" 
                        size="small"
                        onClick={() => openFileDetailModal(record, 'fileId')}
                      >
                        查看完整ID
                      </Button>
                    </div>
                  )
                },
                {
                  title: '描述',
                  dataIndex: 'caption',
                  key: 'caption',
                  ellipsis: true,
                  render: (caption, record) => {
                    return (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap'
                        }}>{caption || '-'}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {caption && (
                            <Button 
                              type="link" 
                              size="small"
                              onClick={() => openFileDetailModal(record, 'caption')}
                              style={{ marginTop: '-4px' }}
                            >
                              查看完整描述
                            </Button>
                          )}
                          <Button 
                            type="link" 
                            size="small"
                            onClick={() => showEditCaptionModal(record, 'media-item')}
                            style={{ marginTop: '-4px' }}
                          >
                            编辑
                          </Button>
                        </div>
                      </div>
                    )
                  }
                },
                {
                  title: '时间',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  width: 150,
                  render: (timestamp) => new Date(timestamp).toLocaleString()
                }
              ]}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              暂无媒体内容
            </div>
          )}
        </Spin>
      </Modal>
      
      {/* 文件详情 Modal */}
      <Modal
        title={fileDetailType === 'fileId' ? '完整文件ID' : fileDetailType === 'caption' ? '完整描述' : '视频详情'}
        open={fileDetailModalVisible}
        onCancel={() => setFileDetailModalVisible(false)}
        footer={[
          fileDetailType !== 'all' && (
            <Button key="copy" onClick={() => {
              const text = fileDetailType === 'fileId' 
                ? currentFileItem?.file_id 
                : currentFileItem?.caption
              copyToClipboard(text || '', fileDetailType === 'fileId' ? '文件ID' : '描述')
            }}>
              复制
            </Button>
          ),
          <Button key="close" onClick={() => setFileDetailModalVisible(false)}>
            关闭
          </Button>
        ].filter(Boolean)}
        width={600}
        zIndex={1100}
      >
        {currentFileItem && (
          <div>
            {fileDetailType === 'all' ? (
              <div>
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <p><strong>ID:</strong> {currentFileItem.id}</p>
                  <p><strong>文件ID:</strong></p>
                  <div style={{ 
                    padding: '8px', 
                    background: '#fff', 
                    borderRadius: '4px',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    marginBottom: '8px'
                  }}>
                    {currentFileItem.file_id}
                  </div>
                  <p><strong>聊天ID:</strong> {currentFileItem.chat_id}</p>
                  <p><strong>用户ID:</strong> {currentFileItem.user_id}</p>
                  <p><strong>时长:</strong> {currentFileItem.duration ? `${currentFileItem.duration}秒` : '-'}</p>
                  <p><strong>MIME类型:</strong> {currentFileItem.mime_type || '-'}</p>
                  <p><strong>创建时间:</strong> {new Date(currentFileItem.timestamp).toLocaleString()}</p>
                  {currentFileItem.forwarded_message_id && (
                    <p><strong>转发消息ID:</strong> {currentFileItem.forwarded_message_id}</p>
                  )}
                  {currentFileItem.forwarded_message_id && fabuConfig?.FORWARD_CHAT_ID && (
                    <p>
                      <strong>跳转链接:</strong> 
                      <a 
                        href={`https://t.me/c/${fabuConfig.FORWARD_CHAT_ID.toString().replace('-100', '')}/${currentFileItem.forwarded_message_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: '8px' }}
                      >
                        点击跳转到消息
                      </a>
                    </p>
                  )}
                  {currentFileItem.caption !== undefined && (
                    <>
                      <p style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>描述:</strong>
                        <Button 
                          type="link" 
                          size="small"
                          onClick={() => {
                            // 判断是单个视频还是媒体项
                            const type = currentFileItem.media_group_id ? 'media-item' : 'single-video'
                            showEditCaptionModal(currentFileItem, type)
                          }}
                        >
                          编辑
                        </Button>
                      </p>
                      <div style={{ 
                        padding: '8px', 
                        background: '#fff', 
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {currentFileItem.caption || '-'}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : fileDetailType === 'fileId' ? (
              <div>
                <p><strong>文件ID:</strong></p>
                <div style={{ 
                  padding: '12px', 
                  background: '#f5f5f5', 
                  borderRadius: '4px',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace'
                }}>
                  {currentFileItem.file_id}
                </div>
              </div>
            ) : (
              <div>
                <p><strong>描述:</strong></p>
                <div style={{ 
                  padding: '12px', 
                  background: '#f5f5f5', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {currentFileItem.caption || '-'}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* 命令编辑 Modal */}
      <Modal
        title={editingCommand ? '编辑命令' : '添加命令'}
        open={isCommandModalVisible}
        onCancel={() => setIsCommandModalVisible(false)}
        footer={null}
        width={500}
        zIndex={1050}
      >
        <Form
          form={commandForm}
          layout="vertical"
          onFinish={handleSaveCommand}
        >
          <Form.Item
            label="命令"
            name="command"
            rules={[{ required: true, message: '请输入命令' }]}
          >
            <Input placeholder="请输入命令（如：start）" disabled={!!editingCommand} />
          </Form.Item>
          
          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input placeholder="请输入命令描述" />
          </Form.Item>
          
          <Form.Item
            label="是否启用"
            name="isEnabled"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          
          <Form.Item
            label="仅管理员"
            name="isAdmin"
            valuePropName="checked"
          >
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
          
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsCommandModalVisible(false)} style={{ marginRight: '8px' }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingCommand ? '更新' : '添加'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 删除命令确认 Modal */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button key="cancel" onClick={cancelDelete}>
            取消
          </Button>,
          <Button key="delete" danger onClick={confirmDelete}>
            删除
          </Button>
        ]}
        zIndex={1150}
      >
        <p>确定要删除命令 <strong>{commandToDelete}</strong> 吗？</p>
      </Modal>
      
      {/* 编辑描述 Modal */}
      <Modal
        title="编辑描述"
        open={editCaptionModalVisible}
        onCancel={() => setEditCaptionModalVisible(false)}
        footer={null}
        width={600}
        zIndex={1200}
      >
        <Form
          form={editCaptionForm}
          layout="vertical"
          onFinish={handleSaveCaption}
        >
          <Form.Item
            label="描述"
            name="caption"
          >
            <Input.TextArea 
              placeholder="请输入描述内容"
              rows={8}
              showCount
              maxLength={2000}
            />
          </Form.Item>
          
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setEditCaptionModalVisible(false)} style={{ marginRight: '8px' }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={savingCaption}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 用户详情 Modal */}
      <Modal
        title="用户详情"
        open={userDetailModalVisible}
        onCancel={() => setUserDetailModalVisible(false)}
        footer={[
          <Button 
            key="delete" 
            danger 
            onClick={() => {
              showDeleteUserModal(currentUser)
            }}
          >
            删除用户
          </Button>,
          <Button key="close" onClick={() => setUserDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
        zIndex={1250}
      >
        {currentUser && (
          <div>
            {/* 用户头部信息 */}
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              padding: '24px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              color: '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 'bold'
                }}>
                  {currentUser.first_name ? currentUser.first_name.charAt(0) : (currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U')}
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {currentUser.first_name || ''} {currentUser.last_name || ''}
                  </div>
                  {currentUser.username && (
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      @{currentUser.username}
                    </div>
                  )}
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <Switch
                    checked={currentUser.is_blocked}
                    onChange={async (checked) => {
                      try {
                        await api.put(`/api/fabu-bot/users/${currentUser.user_id}/block`, {
                          isBlocked: checked
                        })
                        message.success(checked ? '用户已屏蔽' : '用户已取消屏蔽')
                        // 更新当前用户状态
                        setCurrentUser({ ...currentUser, is_blocked: checked ? 1 : 0 })
                        // 刷新用户列表
                        fetchUsers(usersPagination.current, usersPagination.pageSize)
                      } catch (error) {
                        message.error('更新用户状态失败')
                        console.error(error)
                      }
                    }}
                    checkedChildren={<><StopOutlined /> 已屏蔽</>}
                    unCheckedChildren={<><CheckOutlined /> 正常</>}
                  />
                </div>
              </div>
            </div>

            {/* 基本信息卡片 */}
            <Card title="基本信息" size="small" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>用户ID</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>{currentUser.user_id}</div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>聊天ID</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>{currentUser.chat_id}</div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>语言</div>
                  <div>{currentUser.language_code || '-'}</div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>账号类型</div>
                  <div>
                    {currentUser.is_bot ? (
                      <Tag color="blue">机器人</Tag>
                    ) : (
                      <Tag color="green">普通用户</Tag>
                    )}
                    {currentUser.is_premium && <Tag color="gold" style={{ marginLeft: '4px' }}>Premium</Tag>}
                  </div>
                </div>
              </div>
            </Card>

            {/* 时间信息卡片 */}
            <Card title="活动信息" size="small">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>注册时间</div>
                  <div>{new Date(currentUser.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>最后活跃</div>
                  <div>{currentUser.last_active_at ? new Date(currentUser.last_active_at).toLocaleString() : '-'}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>信息更新时间</div>
                  <div>{new Date(currentUser.updated_at).toLocaleString()}</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>
      
      {/* 删除用户确认 Modal */}
      <Modal
        title="确认删除"
        open={deleteUserModalVisible}
        onCancel={cancelDeleteUser}
        footer={[
          <Button key="cancel" onClick={cancelDeleteUser}>
            取消
          </Button>,
          <Button key="delete" danger onClick={confirmDeleteUser}>
            删除
          </Button>
        ]}
        zIndex={1300}
      >
        <p>确定要删除用户 <strong>{userToDelete?.username ? `@${userToDelete.username}` : userToDelete?.user_id}</strong> 吗？</p>
        <p style={{ color: '#999', fontSize: '12px' }}>此操作不可恢复！</p>
      </Modal>
      
      {/* 聊天 Modal */}
      <Modal
        title={chatUser ? `与 ${chatUser.first_name || ''} ${chatUser.last_name || ''}${chatUser.username ? ` (@${chatUser.username})` : ''} 聊天` : '聊天'}
        open={chatModalVisible}
        onCancel={() => setChatModalVisible(false)}
        footer={null}
        width={600}
        zIndex={1350}
      >
        <div style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
          {/* 消息列表 */}
          <div 
            ref={messagesListRef}
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px',
              background: '#f5f5f5',
              borderRadius: '4px',
              marginBottom: '16px'
            }}
          >
            <Spin spinning={messagesLoading} tip="加载消息中...">
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                  暂无消息记录
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.direction === 'outgoing' ? 'flex-end' : 'flex-start',
                      marginBottom: '12px'
                    }}
                  >
                    <div 
                      style={{
                        maxWidth: '70%',
                        padding: msg.message_type === 'photo' ? '4px' : '10px 14px',
                        borderRadius: '12px',
                        background: msg.direction === 'outgoing' ? '#1890ff' : '#fff',
                        color: msg.direction === 'outgoing' ? '#fff' : '#333',
                        wordBreak: 'break-word'
                      }}
                    >
                      {msg.message_type === 'photo' && msg.file_id ? (
                        <div>
                          {/* 使用Telegram的file_id来显示图片 */}
                          <div style={{ marginBottom: '4px', color: msg.direction === 'outgoing' ? '#fff' : '#666', fontSize: '12px' }}>
                            [图片]
                          </div>
                          {msg.caption && (
                            <div style={{ fontSize: '14px', marginTop: '4px' }}>{msg.caption}</div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '14px' }}>{msg.content}</div>
                      )}
                      <div 
                        style={{ 
                          fontSize: '11px', 
                          marginTop: '4px', 
                          opacity: 0.7,
                          textAlign: 'right'
                        }}
                      >
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Spin>
          </div>
          
          {/* 输入区域 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Emoji选择器 */}
            {showEmojiPicker && (
              <div 
                ref={emojiPickerRef}
                style={{ 
                  position: 'absolute', 
                  bottom: '100px', 
                  left: '16px',
                  zIndex: 1000
                }}
              >
                <EmojiPicker 
                  onEmojiClick={handleEmojiClick}
                  searchDisabled={false}
                  skinTonesDisabled={true}
                />
              </div>
            )}
            
            {/* 按钮和输入框 */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              {/* 图片上传按钮 */}
              <Upload
                beforeUpload={handlePhotoUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Tooltip title="发送图片">
                  <Button 
                    icon={<PictureOutlined />}
                    loading={sendingPhoto}
                  />
                </Tooltip>
              </Upload>
              
              {/* Emoji按钮 */}
              <Tooltip title="选择表情">
                <Button 
                  icon={<SmileOutlined />}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                />
              </Tooltip>
              
              <Input.TextArea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="输入消息..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                style={{ flex: 1 }}
              />
              <Button 
                type="primary" 
                onClick={sendMessage}
                loading={sendMessageLoading}
              >
                发送
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default FaBuBot
