import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Table, Form, Input, Select, Modal, message, Spin, Tabs, Alert, Switch, Popconfirm, Tag, Upload, Tooltip, Descriptions, Divider, InputNumber, Radio } from 'antd'
import { RobotOutlined, PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, ArrowLeftOutlined, EyeInvisibleOutlined, EyeTwoTone, CopyOutlined, UpOutlined, DownOutlined, UserOutlined, StopOutlined, CheckOutlined, SmileOutlined, PictureOutlined } from '@ant-design/icons'
import EmojiPicker from 'emoji-picker-react'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'
import { useBotLoading } from '../contexts/BotLoadingContext'

const { Option } = Select


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
  
  // 群组管理
  const [groups, setGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [groupsPagination, setGroupsPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [addGroupModalVisible, setAddGroupModalVisible] = useState(false)
  const [addGroupForm] = Form.useForm()
  const [groupDetailModalVisible, setGroupDetailModalVisible] = useState(false)
  const [currentGroup, setCurrentGroup] = useState(null)
  const [groupDetailTab, setGroupDetailTab] = useState('info')
  const [groupMembers, setGroupMembers] = useState([])
  const [groupMembersLoading, setGroupMembersLoading] = useState(false)
  const [groupLogs, setGroupLogs] = useState([])
  const [groupLogsLoading, setGroupLogsLoading] = useState(false)
  const [groupWarnings, setGroupWarnings] = useState([])
  const [groupWarningsLoading, setGroupWarningsLoading] = useState(false)
  const [groupBans, setGroupBans] = useState([])
  const [groupBansLoading, setGroupBansLoading] = useState(false)
  const [groupReports, setGroupReports] = useState([])
  const [groupReportsLoading, setGroupReportsLoading] = useState(false)
  const [reportDetailModalVisible, setReportDetailModalVisible] = useState(false)
  const [currentReport, setCurrentReport] = useState(null)
  const [reportActionLoading, setReportActionLoading] = useState(false)
  const [banModalVisible, setBanModalVisible] = useState(false)
  const [banDetailModalVisible, setBanDetailModalVisible] = useState(false)
  const [currentBan, setCurrentBan] = useState(null)
  const [warnModalVisible, setWarnModalVisible] = useState(false)
  const [dismissModalVisible, setDismissModalVisible] = useState(false)
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false)
  const [welcomeForm] = Form.useForm()
  const [floodModalVisible, setFloodModalVisible] = useState(false)
  const [floodForm] = Form.useForm()
  const [banForm] = Form.useForm()
  const [warnForm] = Form.useForm()
  const [dismissForm] = Form.useForm()
  const [forbiddenWords, setForbiddenWords] = useState([])
  const [forbiddenWordsLoading, setForbiddenWordsLoading] = useState(false)
  const [addForbiddenWordModalVisible, setAddForbiddenWordModalVisible] = useState(false)
  const [addForbiddenWordForm] = Form.useForm()

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

  // 群组管理函数
  const fetchGroups = async (page = 1, pageSize = 20) => {
    setGroupsLoading(true)
    try {
      const response = await api.get('/api/fabu-bot/groups', {
        params: { page, pageSize }
      })
      setGroups(response.data.groups)
      setGroupsPagination({
        current: response.data.page,
        pageSize: response.data.pageSize,
        total: response.data.total
      })
    } catch (error) {
      message.error('获取群组列表失败')
      console.error(error)
    } finally {
      setGroupsLoading(false)
    }
  }

  const handleAddGroup = async (values) => {
    try {
      await api.post('/api/fabu-bot/groups', values)
      message.success('群组添加成功')
      setAddGroupModalVisible(false)
      addGroupForm.resetFields()
      fetchGroups()
    } catch (error) {
      message.error('添加群组失败')
      console.error(error)
    }
  }

  const handleUpdateGroupField = async (groupId, field, value) => {
    try {
      await api.put(`/api/fabu-bot/groups/${groupId}`, {
        [field]: value
      })
      fetchGroups()
    } catch (error) {
      message.error('更新群组失败')
      console.error(error)
    }
  }

  const handleViewGroupDetail = async (group) => {
    setCurrentGroup(group)
    setGroupDetailTab('info')
    setGroupDetailModalVisible(true)
    await fetchGroupDetails(group.group_id)
  }

  const fetchGroupDetails = async (groupId) => {
    try {
      const response = await api.get(`/api/fabu-bot/groups/${groupId}`)
      setCurrentGroup(response.data)
    } catch (error) {
      message.error('获取群组详情失败')
      console.error(error)
    }
  }

  const fetchGroupMembers = async (groupId, page = 1, pageSize = 50) => {
    setGroupMembersLoading(true)
    try {
      const response = await api.get(`/api/fabu-bot/groups/${groupId}/members`, {
        params: { page, pageSize }
      })
      setGroupMembers(response.data.members)
    } catch (error) {
      message.error('获取成员列表失败')
      console.error(error)
    } finally {
      setGroupMembersLoading(false)
    }
  }

  const fetchGroupLogs = async (groupId, page = 1, pageSize = 50) => {
    setGroupLogsLoading(true)
    try {
      const response = await api.get(`/api/fabu-bot/groups/${groupId}/logs`, {
        params: { page, pageSize }
      })
      setGroupLogs(response.data.logs)
    } catch (error) {
      message.error('获取操作日志失败')
      console.error(error)
    } finally {
      setGroupLogsLoading(false)
    }
  }

  const fetchForbiddenWords = async (groupId) => {
    setForbiddenWordsLoading(true)
    try {
      const response = await api.get(`/api/fabu-bot/groups/${groupId}/forbidden-words`)
      setForbiddenWords(response.data.words)
    } catch (error) {
      message.error('获取违禁词列表失败')
      console.error(error)
    } finally {
      setForbiddenWordsLoading(false)
    }
  }

  const [addMode, setAddMode] = useState('single') // single or batch

  const handleAddForbiddenWord = async (values) => {
    try {
      if (addMode === 'single') {
        await api.post(`/api/fabu-bot/groups/${currentGroup.group_id}/forbidden-words`, values)
        message.success('违禁词添加成功')
      } else {
        // 批量模式：分割文本
        const rawText = values.words || ''
        const words = rawText
          .split(/[\\n,，；;\\s]+/)
          .map(w => w.trim())
          .filter(w => w.length > 0)
        
        if (words.length === 0) {
          message.error('请输入违禁词')
          return
        }

        await api.post(`/api/fabu-bot/groups/${currentGroup.group_id}/forbidden-words/batch`, {
          words,
          wordType: values.wordType,
          action: values.action,
          isGlobal: values.isGlobal
        })
        message.success(`成功添加 ${words.length} 个违禁词`)
      }
      
      setAddForbiddenWordModalVisible(false)
      addForbiddenWordForm.resetFields()
      fetchForbiddenWords(currentGroup.group_id)
    } catch (error) {
      message.error('添加违禁词失败')
      console.error(error)
    }
  }

  const handleDeleteForbiddenWord = async (wordId) => {
    try {
      await api.delete(`/api/fabu-bot/groups/${currentGroup.group_id}/forbidden-words/${wordId}`)
      message.success('违禁词删除成功')
      fetchForbiddenWords(currentGroup.group_id)
    } catch (error) {
      message.error('删除违禁词失败')
      console.error(error)
    }
  }

  const fetchGroupWarnings = async (groupId, page = 1, pageSize = 50) => {
    setGroupWarningsLoading(true)
    try {
      const response = await api.get(`/api/fabu-bot/groups/${groupId}/warnings`, {
        params: { page, pageSize }
      })
      setGroupWarnings(response.data.warnings)
    } catch (error) {
      message.error('获取警告记录失败')
      console.error(error)
    } finally {
      setGroupWarningsLoading(false)
    }
  }

  const fetchGroupBans = async (groupId, page = 1, pageSize = 50) => {
    setGroupBansLoading(true)
    try {
      const response = await api.get(`/api/fabu-bot/groups/${groupId}/bans`, {
        params: { page, pageSize }
      })
      setGroupBans(response.data.bans)
    } catch (error) {
      message.error('获取封禁记录失败')
      console.error(error)
    } finally {
      setGroupBansLoading(false)
    }
  }

  const fetchGroupReports = async (groupId, page = 1, pageSize = 50) => {
    setGroupReportsLoading(true)
    try {
      const response = await api.get(`/api/fabu-bot/groups/${groupId}/reports`, {
        params: { page, pageSize }
      })
      setGroupReports(response.data.reports)
    } catch (error) {
      message.error('获取举报记录失败')
      console.error(error)
    } finally {
      setGroupReportsLoading(false)
    }
  }

  // 删除举报消息
  const handleDeleteReportMessage = async () => {
    if (!currentReport || !currentGroup) return
    setReportActionLoading(true)
    try {
      const response = await api.post(`/api/fabu-bot/groups/${currentGroup.group_id}/reports/${currentReport.id}/delete-message`)
      message.success(response.data.message)
      setReportDetailModalVisible(false)
      // 刷新数据
      fetchGroupReports(currentGroup.group_id)
      fetchGroupLogs(currentGroup.group_id)
    } catch (error) {
      message.error('删除消息失败')
      console.error(error)
    } finally {
      setReportActionLoading(false)
    }
  }

  // 封禁用户
  const handleBanUser = async (values) => {
    if (!currentReport || !currentGroup) return
    setReportActionLoading(true)
    try {
      const response = await api.post(`/api/fabu-bot/groups/${currentGroup.group_id}/reports/${currentReport.id}/ban-user`, values)
      message.success(response.data.message)
      setBanModalVisible(false)
      setReportDetailModalVisible(false)
      banForm.resetFields()
      // 刷新数据
      fetchGroupReports(currentGroup.group_id)
      fetchGroupBans(currentGroup.group_id)
      fetchGroupLogs(currentGroup.group_id)
    } catch (error) {
      message.error('封禁用户失败')
      console.error(error)
    } finally {
      setReportActionLoading(false)
    }
  }

  // 警告用户
  const handleWarnUser = async (values) => {
    if (!currentReport || !currentGroup) return
    setReportActionLoading(true)
    try {
      const response = await api.post(`/api/fabu-bot/groups/${currentGroup.group_id}/reports/${currentReport.id}/warn-user`, values)
      message.success(response.data.message)
      setWarnModalVisible(false)
      setReportDetailModalVisible(false)
      warnForm.resetFields()
      // 刷新数据
      fetchGroupReports(currentGroup.group_id)
      fetchGroupWarnings(currentGroup.group_id)
      fetchGroupLogs(currentGroup.group_id)
    } catch (error) {
      message.error('警告用户失败')
      console.error(error)
    } finally {
      setReportActionLoading(false)
    }
  }

  // 驳回举报
  const handleDismissReport = async (values) => {
    if (!currentReport || !currentGroup) return
    setReportActionLoading(true)
    try {
      const response = await api.post(`/api/fabu-bot/groups/${currentGroup.group_id}/reports/${currentReport.id}/dismiss`, values)
      message.success(response.data.message)
      setDismissModalVisible(false)
      setReportDetailModalVisible(false)
      dismissForm.resetFields()
      // 刷新数据
      fetchGroupReports(currentGroup.group_id)
      fetchGroupLogs(currentGroup.group_id)
    } catch (error) {
      message.error('驳回举报失败')
      console.error(error)
    } finally {
      setReportActionLoading(false)
    }
  }

  // 更新欢迎消息
  const handleUpdateWelcome = async (values) => {
    if (!currentGroup) return
    try {
      const response = await api.put(`/api/fabu-bot/groups/${currentGroup.group_id}/welcome`, values)
      message.success(response.data.message)
      setWelcomeModalVisible(false)
      welcomeForm.resetFields()
      // 刷新群组数据
      await fetchGroupDetails(currentGroup.group_id)
    } catch (error) {
      message.error('更新欢迎消息失败')
      console.error(error)
    }
  }

  // 更新反刷屏设置
  const handleUpdateFlood = async (values) => {
    if (!currentGroup) return
    try {
      const response = await api.put(`/api/fabu-bot/groups/${currentGroup.group_id}/flood`, values)
      message.success(response.data.message)
      setFloodModalVisible(false)
      floodForm.resetFields()
      // 刷新群组数据
      await fetchGroupDetails(currentGroup.group_id)
    } catch (error) {
      message.error('更新反刷屏设置失败')
      console.error(error)
    }
  }

  const handleGroupDetailTabChange = (key) => {
    setGroupDetailTab(key)
    if (currentGroup) {
      switch (key) {
        case 'members':
          fetchGroupMembers(currentGroup.group_id)
          break
        case 'logs':
          fetchGroupLogs(currentGroup.group_id)
          break
        case 'forbidden-words':
          fetchForbiddenWords(currentGroup.group_id)
          break
        case 'warnings':
          fetchGroupWarnings(currentGroup.group_id)
          break
        case 'bans':
          fetchGroupBans(currentGroup.group_id)
          break
        case 'reports':
          fetchGroupReports(currentGroup.group_id)
          break
        case 'special':
          // 特殊功能Tab不需要额外加载数据
          break
      }
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
    fetchGroups()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/bot')}
            style={{ marginRight: '16px' }}
          >
            返回
          </Button>
          <h1 style={{ margin: 0 }}>FaBuBot 管理</h1>
        </div>
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
      </div>
      
      <Tabs 
        defaultActiveKey="status"
        items={[
          {
            key: 'status',
            label: botStatus?.isRunning ? '🤖 机器人状态 (运行中)' : '🚫 机器人状态 (已停止)',
            children: (
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
            )
          },
          {
            key: 'media-groups',
            label: '媒体组管理',
            children: (
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
            )
          },
          {
            key: 'single-videos',
            label: '单个视频管理',
            children: (
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
            )
          },
          {
            key: 'config',
            label: '配置管理',
            children: (
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
            )
          },
          {
            key: 'commands',
            label: '命令管理',
            children: (
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
                        title: '命令类型',
                        dataIndex: 'command_type',
                        key: 'command_type',
                        render: (commandType) => (
                          <Tag color={commandType === 'group' ? 'blue' : 'green'}>
                            {commandType === 'group' ? '群组命令' : '机器人命令'}
                          </Tag>
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
            )
          },
          {
            key: 'users',
            label: '用户管理',
            children: (
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
            )
          },
          {
            key: 'groups',
            label: '群组管理',
            children: (
              <Spin spinning={groupsLoading}>
                <Card 
                  title="群组列表" 
                  extra={
                    <Button 
                      type="primary" 
                      onClick={() => setAddGroupModalVisible(true)}
                    >
                      添加群组
                    </Button>
                  }
                >
                  <Table
                    columns={[
                      {
                        title: '群组ID',
                        dataIndex: 'group_id',
                        key: 'group_id',
                        width: 120
                      },
                      {
                        title: '群组名称',
                        dataIndex: 'group_title',
                        key: 'group_title'
                      },
                      {
                        title: '群组类型',
                        dataIndex: 'group_type',
                        key: 'group_type',
                        width: 100,
                        render: (type) => {
                          const typeMap = {
                            supergroup: '超级群',
                            group: '普通群',
                            channel: '频道'
                          }
                          return typeMap[type] || type
                        }
                      },
                      {
                        title: '启用状态',
                        dataIndex: 'is_enabled',
                        key: 'is_enabled',
                        width: 100,
                        render: (isEnabled, record) => (
                          <Switch
                            checked={isEnabled}
                            onChange={(checked) => handleUpdateGroupField(record.group_id, 'is_enabled', checked)}
                            checkedChildren="启用"
                            unCheckedChildren="禁用"
                          />
                        )
                      },
                      {
                        title: '欢迎消息',
                        dataIndex: 'welcome_enabled',
                        key: 'welcome_enabled',
                        width: 100,
                        render: (enabled, record) => (
                          <Switch
                            checked={enabled}
                            onChange={(checked) => handleUpdateGroupField(record.group_id, 'welcome_enabled', checked)}
                            checkedChildren="开"
                            unCheckedChildren="关"
                          />
                        )
                      },
                      {
                        title: '反垃圾',
                        dataIndex: 'anti_spam_enabled',
                        key: 'anti_spam_enabled',
                        width: 80,
                        render: (enabled, record) => (
                          <Switch
                            checked={enabled}
                            onChange={(checked) => handleUpdateGroupField(record.group_id, 'anti_spam_enabled', checked)}
                            checkedChildren="开"
                            unCheckedChildren="关"
                          />
                        )
                      },
                      {
                        title: '创建时间',
                        dataIndex: 'created_at',
                        key: 'created_at',
                        width: 160,
                        render: (time) => time ? new Date(time).toLocaleString() : '-'
                      },
                      {
                        title: '操作',
                        key: 'action',
                        width: 100,
                        render: (_, record) => (
                          <Button 
                            type="primary" 
                            size="small"
                            onClick={() => handleViewGroupDetail(record)}
                          >
                            详情
                          </Button>
                        )
                      }
                    ]}
                    dataSource={groups}
                    rowKey="group_id"
                    pagination={{
                      current: groupsPagination.current,
                      pageSize: groupsPagination.pageSize,
                      total: groupsPagination.total,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => `共 ${total} 条记录`,
                      onChange: (page, pageSize) => fetchGroups(page, pageSize)
                    }}
                  />
                </Card>
              </Spin>
            )
          }
        ]}
      />
      
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
          
          <Form.Item
            label="命令类型"
            name="commandType"
            initialValue="bot"
          >
            <Select>
              <Option value="bot">机器人命令</Option>
              <Option value="group">群组命令</Option>
            </Select>
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
      
      {/* 添加群组 Modal */}
      <Modal
        title="添加群组"
        open={addGroupModalVisible}
        onCancel={() => setAddGroupModalVisible(false)}
        footer={null}
      >
        <Form form={addGroupForm} onFinish={handleAddGroup} layout="vertical">
          <Form.Item
            name="groupId"
            label="群组ID"
            rules={[{ required: true, message: '请输入群组ID' }]}
            extra="Telegram 群组ID（负数，例如：-1001234567890）"
          >
            <Input placeholder="请输入群组ID" />
          </Form.Item>
          <Form.Item
            name="groupTitle"
            label="群组名称"
            rules={[{ required: true, message: '请输入群组名称' }]}
          >
            <Input placeholder="请输入群组名称" />
          </Form.Item>
          <Form.Item
            name="groupUsername"
            label="群组用户名"
            extra="如果是公开群组，填写 @ 后面的部分"
          >
            <Input placeholder="例如：my_group" />
          </Form.Item>
          <Form.Item
            name="groupType"
            label="群组类型"
            initialValue="supergroup"
          >
            <Select>
              <Option value="supergroup">超级群</Option>
              <Option value="group">普通群</Option>
              <Option value="channel">频道</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setAddGroupModalVisible(false)} style={{ marginRight: '8px' }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              添加
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 群组详情 Modal */}
      <Modal
        title={currentGroup ? `群组详情 - ${currentGroup.group_title}` : '群组详情'}
        open={groupDetailModalVisible}
        onCancel={() => setGroupDetailModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setGroupDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {currentGroup && (
          <Tabs 
            activeKey={groupDetailTab} 
            onChange={handleGroupDetailTabChange}
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <>
                    <Card size="small" style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>群组ID</div>
                          <div style={{ fontFamily: 'monospace' }}>{currentGroup.group_id}</div>
                        </div>
                        <div>
                          <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>群组名称</div>
                          <div>{currentGroup.group_title}</div>
                        </div>
                        {currentGroup.group_username && (
                          <div>
                            <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>群组用户名</div>
                            <div>@{currentGroup.group_username}</div>
                          </div>
                        )}
                        <div>
                          <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>成员数量</div>
                          <div>{currentGroup.member_count || 0}</div>
                        </div>
                        <div>
                          <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>创建时间</div>
                          <div>{new Date(currentGroup.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    </Card>
                    <Card title="功能开关" size="small">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>欢迎消息</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Button
                                type="primary"
                                size="small"
                                onClick={() => {
                                  welcomeForm.setFieldsValue({
                                    welcome_text: currentGroup.welcome?.welcome_text || '欢迎 {user} 加入本群！',
                                    leave_text: currentGroup.welcome?.leave_text || ''
                                  });
                                  setWelcomeModalVisible(true);
                                }}
                              >
                                设置
                              </Button>
                              <Switch
                                checked={Boolean(currentGroup.welcome_enabled)}
                                onChange={(checked) => handleUpdateGroupField(currentGroup.group_id, 'welcome_enabled', checked)}
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>离开消息</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Button
                                type="primary"
                                size="small"
                                onClick={() => {
                                  welcomeForm.setFieldsValue({
                                    welcome_text: currentGroup.welcome?.welcome_text || '欢迎 {user} 加入本群！',
                                    leave_text: currentGroup.welcome?.leave_text || ''
                                  });
                                  setWelcomeModalVisible(true);
                                }}
                              >
                                设置
                              </Button>
                              <Switch
                                checked={Boolean(currentGroup.leave_message_enabled)}
                                onChange={(checked) => handleUpdateGroupField(currentGroup.group_id, 'leave_message_enabled', checked)}
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>反垃圾消息</span>
                            <Switch
                              checked={Boolean(currentGroup.anti_spam_enabled)}
                              onChange={(checked) => handleUpdateGroupField(currentGroup.group_id, 'anti_spam_enabled', checked)}
                            />
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>反刷屏</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Button
                                type="primary"
                                size="small"
                                onClick={() => {
                                  floodForm.setFieldsValue({
                                    flood_max_messages: currentGroup.flood_max_messages || 5,
                                    flood_time_window: currentGroup.flood_time_window || 5000
                                  });
                                  setFloodModalVisible(true);
                                }}
                              >
                                设置
                              </Button>
                              <Switch
                                checked={Boolean(currentGroup.anti_flood_enabled)}
                                onChange={(checked) => handleUpdateGroupField(currentGroup.group_id, 'anti_flood_enabled', checked)}
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>反链接</span>
                            <Switch
                              checked={Boolean(currentGroup.anti_link_enabled)}
                              onChange={(checked) => handleUpdateGroupField(currentGroup.group_id, 'anti_link_enabled', checked)}
                            />
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>自动删除服务消息</span>
                            <Switch
                              checked={Boolean(currentGroup.auto_delete_enabled)}
                              onChange={(checked) => handleUpdateGroupField(currentGroup.group_id, 'auto_delete_enabled', checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </>
                )
              },
              {
                key: 'members',
                label: '群成员',
                children: (
                  <Spin spinning={groupMembersLoading}>
                    <Table
                      dataSource={groupMembers}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: '用户ID',
                          dataIndex: 'user_id',
                          key: 'user_id',
                          width: 120
                        },
                        {
                          title: '用户名',
                          dataIndex: 'user_username',
                          key: 'user_username',
                          render: (username) => username ? `@${username}` : '-'
                        },
                        {
                          title: '姓名',
                          key: 'name',
                          render: (_, record) => (
                            <span>
                              {record.user_first_name || ''} {record.user_last_name || ''}
                            </span>
                          )
                        },
                        {
                          title: '身份',
                          key: 'role',
                          width: 100,
                          render: (_, record) => {
                            const isOwner = Boolean(record.is_owner);
                            const isAdmin = Boolean(record.is_admin);
                            if (isOwner) {
                              return <Tag color="gold">群主</Tag>;
                            } else if (isAdmin) {
                              return <Tag color="blue">管理员</Tag>;
                            } else {
                              return <Tag color="default">成员</Tag>;
                            }
                          }
                        },
                        {
                          title: '状态',
                          key: 'status',
                          width: 120,
                          render: (_, record) => {
                            const isBanned = Boolean(record.is_banned);
                            const isMuted = Boolean(record.is_muted);
                            if (isBanned) {
                              return <Tag color="red">已封禁</Tag>;
                            } else if (isMuted) {
                              return <Tag color="orange">已禁言</Tag>;
                            } else {
                              return <Tag color="green">正常</Tag>;
                            }
                          }
                        },
                        {
                          title: '警告',
                          dataIndex: 'warnings_count',
                          key: 'warnings_count',
                          width: 60
                        },
                        {
                          title: '加入时间',
                          dataIndex: 'joined_at',
                          key: 'joined_at',
                          width: 160,
                          render: (time) => time ? new Date(time).toLocaleString() : '-'
                        }
                      ]}
                    />
                  </Spin>
                )
              },
              {
                key: 'forbidden-words',
                label: '违禁词',
                children: (
                  <Card 
                    size="small"
                    extra={
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => setAddForbiddenWordModalVisible(true)}
                      >
                        添加违禁词
                      </Button>
                    }
                  >
                    <Spin spinning={forbiddenWordsLoading}>
                      <Table
                        dataSource={forbiddenWords}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: '违禁词',
                            dataIndex: 'word',
                            key: 'word'
                          },
                          {
                            title: '类型',
                            dataIndex: 'word_type',
                            key: 'word_type',
                            width: 100,
                            render: (type) => {
                              const typeMap = {
                                porn: '色情',
                                spam: '垃圾',
                                advertisement: '广告',
                                insult: '辱骂',
                                other: '其他'
                              }
                              return typeMap[type] || type
                            }
                          },
                          {
                            title: '操作',
                            dataIndex: 'action',
                            key: 'action',
                            width: 100,
                            render: (action) => {
                              const actionMap = {
                                delete: '删除',
                                warn: '警告',
                                mute: '禁言',
                                ban: '封禁'
                              }
                              return actionMap[action] || action
                            }
                          },
                          {
                            title: '范围',
                            key: 'scope',
                            width: 80,
                            render: (_, record) => (
                              record.group_id ? '本群' : '全局'
                            )
                          },
                          {
                            title: '操作',
                            key: 'action',
                            width: 80,
                            render: (_, record) => (
                              <Popconfirm
                                title="确定删除这个违禁词吗？"
                                onConfirm={() => handleDeleteForbiddenWord(record.id)}
                                okText="确定"
                                cancelText="取消"
                              >
                                <Button type="text" danger size="small">删除</Button>
                              </Popconfirm>
                            )
                          }
                        ]}
                      />
                    </Spin>
                  </Card>
                )
              },
              {
                key: 'warnings',
                label: '警告记录',
                children: (
                  <Spin spinning={groupWarningsLoading}>
                    <Table
                      dataSource={groupWarnings}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: '用户ID',
                          dataIndex: 'user_id',
                          key: 'user_id',
                          width: 120
                        },
                        {
                          title: '警告者',
                          dataIndex: 'warned_by',
                          key: 'warned_by',
                          width: 120
                        },
                        {
                          title: '原因',
                          dataIndex: 'reason',
                          key: 'reason'
                        },
                        {
                          title: '状态',
                          dataIndex: 'is_active',
                          key: 'is_active',
                          width: 80,
                          render: (active) => {
                            const isActive = Boolean(active);
                            return isActive ? <Tag color="orange">有效</Tag> : <Tag color="default">已取消</Tag>;
                          }
                        },
                        {
                          title: '时间',
                          dataIndex: 'created_at',
                          key: 'created_at',
                          width: 160,
                          render: (time) => new Date(time).toLocaleString()
                        }
                      ]}
                    />
                  </Spin>
                )
              },
              {
                key: 'bans',
                label: '封禁记录',
                children: (
                  <Spin spinning={groupBansLoading}>
                    <Table
                      dataSource={groupBans}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: '用户ID',
                          dataIndex: 'user_id',
                          key: 'user_id',
                          width: 120
                        },
                        {
                          title: '封禁者',
                          dataIndex: 'banned_by',
                          key: 'banned_by',
                          width: 120
                        },
                        {
                          title: '原因',
                          dataIndex: 'reason',
                          key: 'reason'
                        },
                        {
                          title: '到期时间',
                          dataIndex: 'ban_until',
                          key: 'ban_until',
                          width: 160,
                          render: (time) => time ? new Date(time).toLocaleString() : '永久'
                        },
                        {
                          title: '状态',
                          dataIndex: 'is_active',
                          key: 'is_active',
                          width: 80,
                          render: (active) => {
                            const isActive = Boolean(active);
                            return isActive ? <Tag color="red">封禁中</Tag> : <Tag color="green">已解封</Tag>;
                          }
                        },
                        {
                          title: '时间',
                          dataIndex: 'created_at',
                          key: 'created_at',
                          width: 160,
                          render: (time) => new Date(time).toLocaleString()
                        },
                        {
                          title: '操作',
                          key: 'action',
                          width: 160,
                          render: (_, record) => (
                            <>
                              <Button
                                type="primary"
                                size="small"
                                onClick={() => {
                                  setCurrentBan(record);
                                  setBanDetailModalVisible(true);
                                }}
                                style={{ marginRight: '8px' }}
                              >
                                查看
                              </Button>
                              {Boolean(record.is_active) && (
                                <Popconfirm
                                  title="确认解封该用户？"
                                  description="解封后，该用户可以重新加入群组"
                                  onConfirm={async () => {
                                    try {
                                      await api.delete(`/api/fabu-bot/groups/${currentGroup.group_id}/bans/${record.user_id}`);
                                      message.success('用户解封成功');
                                      fetchGroupBans(currentGroup.group_id);
                                    } catch (error) {
                                      message.error('解封用户失败');
                                      console.error('解封失败:', error);
                                    }
                                  }}
                                  okText="确认"
                                  cancelText="取消"
                                >
                                  <Button type="primary" size="small" danger>
                                    解封
                                  </Button>
                                </Popconfirm>
                              )}
                            </>
                          )
                        }
                      ]}
                    />
                  </Spin>
                )
              },
              {
                key: 'reports',
                label: '举报记录',
                children: (
                  <Spin spinning={groupReportsLoading}>
                    <Table
                      dataSource={groupReports}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: '被举报用户ID',
                          dataIndex: 'reported_user_id',
                          key: 'reported_user_id',
                          width: 140
                        },
                        {
                          title: '举报者',
                          dataIndex: 'reported_by',
                          key: 'reported_by',
                          width: 120
                        },
                        {
                          title: '消息ID',
                          dataIndex: 'message_id',
                          key: 'message_id',
                          width: 100
                        },
                        {
                          title: '举报内容',
                          dataIndex: 'message_text',
                          key: 'message_text',
                          render: (text) => {
                            if (text) {
                              return text.length > 50 ? text.substring(0, 50) + '...' : text
                            }
                            return '-'
                          }
                        },
                        {
                          title: '举报原因',
                          dataIndex: 'reason',
                          key: 'reason',
                          render: (reason) => reason || '-'
                        },
                        {
                          title: '状态',
                          dataIndex: 'status',
                          key: 'status',
                          width: 100,
                          render: (status) => {
                            const statusMap = {
                              'pending': <Tag color="orange">待处理</Tag>,
                              'resolved': <Tag color="green">已处理</Tag>,
                              'dismissed': <Tag color="default">已驳回</Tag>
                            }
                            return statusMap[status] || status
                          }
                        },
                        {
                          title: '时间',
                          dataIndex: 'created_at',
                          key: 'created_at',
                          width: 160,
                          render: (time) => new Date(time).toLocaleString()
                        },
                        {
                          title: '操作',
                          key: 'action',
                          width: 80,
                          render: (_, record) => (
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => {
                                setCurrentReport(record)
                                setReportDetailModalVisible(true)
                              }}
                            >
                              查看
                            </Button>
                          )
                        }
                      ]}
                    />
                  </Spin>
                )
              },
              {
                key: 'special',
                label: '特殊功能',
                children: (
                  <Card size="small">
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontWeight: 'bold' }}>多群组转发</span>
                        <Switch
                          checked={currentGroup.is_forward_enabled || false}
                          onChange={async (checked) => {
                            try {
                              await api.put(`/api/fabu-bot/groups/${currentGroup.group_id}/forward-toggle`, {
                                enabled: checked
                              });
                              message.success(checked ? '已开启转发，当前群组已添加到转发目标' : '已关闭转发，当前群组已从转发目标移除');
                              await fetchGroupDetails(currentGroup.group_id);
                            } catch (error) {
                              message.error('更新失败');
                              console.error(error);
                            }
                          }}
                        />
                      </div>
                      
                      <Alert
                        message="提示"
                        description="开启后，当前群组将被添加到转发目标列表中，所有群保存的媒体内容都将自动转发到此群组。关闭后，当前群组将从转发目标列表中移除。"
                        type="info"
                        showIcon
                        style={{ marginTop: '16px' }}
                      />
                    </div>
                  </Card>
                )
              },
              {
                key: 'logs',
                label: '操作日志',
                children: (
                  <Spin spinning={groupLogsLoading}>
                    <Table
                      dataSource={groupLogs}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: '操作类型',
                          dataIndex: 'action_type',
                          key: 'action_type',
                          width: 120,
                          render: (type, record) => {
                            const typeMap = {
                              'user_join': '👤 加入',
                              'user_leave': '🚪 离开',
                              'user_warn': '⚠️ 警告',
                              'user_unwarn': '✅ 取消警告',
                              'user_ban': '🔨 封禁',
                              'user_unban': '🔓 解封',
                              'user_kick': '👢 踢出',
                              'user_mute': '🔇 禁言',
                              'user_unmute': '🔊 解除禁言',
                              'admin_promote': '⬆️ 升为管理',
                              'admin_demote': '⬇️ 降为成员',
                              'message_delete': '🗑️ 删除消息',
                              'message_pin': '📌 置顶',
                              'message_unpin': '📌 取消置顶',
                              'rules_change': '📜 群规更新',
                              'forbidden_word_add': '📝 添加违禁词',
                              'forbidden_word_remove': '📝 删除违禁词'
                            }
                            
                            if (type === 'other') {
                              let details = record.details
                              if (typeof details === 'string') {
                                try {
                                  details = JSON.parse(details)
                                } catch (e) {
                                  details = {}
                                }
                              }
                              if (details) {
                                if (details.reported_message_id) {
                                  return '🚩 举报'
                                }
                                if (details.word) {
                                  return '🚫 违禁词'
                                }
                                if (details.count) {
                                  return '🧹 清理消息'
                                }
                              }
                              return '📋 其他操作'
                            }
                            
                            return typeMap[type] || type
                          }
                        },
                        {
                          title: '目标用户',
                          dataIndex: 'user_id',
                          key: 'user_id',
                          width: 120,
                          render: (userId) => userId ? userId : '-'
                        },
                        {
                          title: '执行者',
                          dataIndex: 'actor_id',
                          key: 'actor_id',
                          width: 120,
                          render: (actorId) => actorId ? actorId : '-'
                        },
                        {
                          title: '详情',
                          dataIndex: 'details',
                          key: 'details',
                          render: (details) => {
                            if (!details) return '-'
                            if (typeof details === 'string') {
                              try {
                                details = JSON.parse(details)
                              } catch (e) {
                                return details
                              }
                            }
                            if (typeof details === 'object' && Object.keys(details).length > 0) {
                              return (
                                <div style={{ fontSize: '12px' }}>
                                  {Object.entries(details).map(([key, value]) => (
                                    <div key={key}>
                                      <strong>{key}:</strong> {JSON.stringify(value)}
                                    </div>
                                  ))}
                                </div>
                              )
                            }
                            return '-'
                          }
                        },
                        {
                          title: '时间',
                          dataIndex: 'created_at',
                          key: 'created_at',
                          width: 160,
                          render: (time) => new Date(time).toLocaleString()
                        }
                      ]}
                    />
                  </Spin>
                )
              }
            ]}
          />
        )}
      </Modal>
      
      {/* 添加违禁词 Modal */}
      <Modal
        title="添加违禁词"
        open={addForbiddenWordModalVisible}
        onCancel={() => {
          setAddForbiddenWordModalVisible(false)
          setAddMode('single')
        }}
        footer={null}
      >
        <Form form={addForbiddenWordForm} onFinish={handleAddForbiddenWord} layout="vertical">
          <Form.Item label="添加模式" initialValue="single">
            <Radio.Group 
              value={addMode} 
              onChange={(e) => setAddMode(e.target.value)}
            >
              <Radio value="single">单条添加</Radio>
              <Radio value="batch">批量添加</Radio>
            </Radio.Group>
          </Form.Item>
          
          {addMode === 'single' ? (
            <Form.Item
              name="word"
              label="违禁词"
              rules={[{ required: true, message: '请输入违禁词' }]}
            >
              <Input placeholder="请输入违禁词" />
            </Form.Item>
          ) : (
            <Form.Item
              name="words"
              label="违禁词列表"
              rules={[{ required: true, message: '请输入违禁词' }]}
              help="支持换行、逗号、分号、空格分隔多个违禁词"
            >
              <Input.TextArea 
                rows={8} 
                placeholder="请输入违禁词列表，支持：
- 换行分隔
- 英文逗号(,)
- 中文逗号(，)
- 英文分号(;)
- 中文分号(；)
- 空格分隔

示例：
违禁词1
违禁词2,违禁词3
违禁词4；违禁词5" 
              />
            </Form.Item>
          )}
          
          <Form.Item
            name="wordType"
            label="类型"
            initialValue="other"
          >
            <Select>
              <Option value="porn">色情</Option>
              <Option value="spam">垃圾</Option>
              <Option value="advertisement">广告</Option>
              <Option value="insult">辱骂</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="action"
            label="触发操作"
            initialValue="delete"
          >
            <Select>
              <Option value="delete">删除</Option>
              <Option value="warn">警告</Option>
              <Option value="mute">禁言</Option>
              <Option value="ban">封禁</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="isGlobal"
            label="全局违禁词"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => {
              setAddForbiddenWordModalVisible(false)
              setAddMode('single')
            }} style={{ marginRight: '8px' }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {addMode === 'single' ? '添加' : '批量添加'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 举报详情 Modal */}
      <Modal
        title="举报详情"
        open={reportDetailModalVisible}
        onCancel={() => {
          setReportDetailModalVisible(false)
          setCurrentReport(null)
        }}
        footer={[
          <Button key="close" onClick={() => {
            setReportDetailModalVisible(false)
            setCurrentReport(null)
          }}>
            关闭
          </Button>,
          currentReport && currentReport.status === 'pending' && (
            <>
              <Button 
                key="dismiss" 
                onClick={() => setDismissModalVisible(true)}
                style={{ marginRight: '8px' }}
              >
                驳回举报
              </Button>
              {currentReport.reported_user_id && (
                <>
                  <Button 
                    key="warn" 
                    type="primary" 
                    onClick={() => setWarnModalVisible(true)}
                    style={{ marginRight: '8px', backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                  >
                    警告用户
                  </Button>
                  <Button 
                    key="ban" 
                    type="primary" 
                    onClick={() => setBanModalVisible(true)}
                    style={{ marginRight: '8px', backgroundColor: '#faad14', borderColor: '#faad14' }}
                  >
                    封禁用户
                  </Button>
                </>
              )}
              {currentReport.message_id && (
                <Button 
                  key="delete" 
                  type="primary" 
                  danger 
                  onClick={handleDeleteReportMessage}
                  loading={reportActionLoading}
                >
                  删除消息
                </Button>
              )}
            </>
          )
        ]}
        width={600}
      >
        {currentReport && (
          <div style={{ fontSize: '14px' }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="记录ID">{currentReport.id}</Descriptions.Item>
              <Descriptions.Item label="群组ID">{currentReport.group_id}</Descriptions.Item>
              <Descriptions.Item label="被举报用户ID">{currentReport.reported_user_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="举报者ID">{currentReport.reported_by || '-'}</Descriptions.Item>
              <Descriptions.Item label="消息ID">{currentReport.message_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="举报原因">{currentReport.reason || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const statusMap = {
                    'pending': <Tag color="orange">待处理</Tag>,
                    'resolved': <Tag color="green">已处理</Tag>,
                    'dismissed': <Tag color="default">已驳回</Tag>
                  }
                  return statusMap[currentReport.status] || currentReport.status
                })()}
              </Descriptions.Item>
              {currentReport.resolved_by && (
                <Descriptions.Item label="处理者">{currentReport.resolved_by}</Descriptions.Item>
              )}
              {currentReport.resolved_at && (
                <Descriptions.Item label="处理时间">
                  {new Date(currentReport.resolved_at).toLocaleString()}
                </Descriptions.Item>
              )}
              {currentReport.resolution_note && (
                <Descriptions.Item label="处理备注">{currentReport.resolution_note}</Descriptions.Item>
              )}
              <Descriptions.Item label="创建时间">
                {currentReport.created_at ? new Date(currentReport.created_at).toLocaleString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {currentReport.updated_at ? new Date(currentReport.updated_at).toLocaleString() : '-'}
              </Descriptions.Item>
            </Descriptions>
            
            {currentReport.message_text && (
              <div style={{ marginTop: '16px' }}>
                <Divider orientation="left">举报内容</Divider>
                <div style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  maxHeight: '400px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {currentReport.message_text}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 封禁用户 Modal */}
      <Modal
        title="封禁用户"
        open={banModalVisible}
        onCancel={() => {
          setBanModalVisible(false)
          banForm.resetFields()
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setBanModalVisible(false)
            banForm.resetFields()
          }}>
            取消
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            loading={reportActionLoading}
            onClick={() => banForm.submit()}
          >
            确认封禁
          </Button>
        ]}
      >
        <Form
          form={banForm}
          layout="vertical"
          onFinish={handleBanUser}
        >
          <Form.Item
            name="reason"
            label="封禁原因"
            initialValue="举报处理"
          >
            <Input.TextArea rows={3} placeholder="请输入封禁原因" />
          </Form.Item>
          <Form.Item
            name="banDuration"
            label="封禁时长（分钟）"
            tooltip="0表示永久封禁"
            initialValue={0}
          >
            <InputNumber
              min={0}
              placeholder="请输入封禁时长"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="resolutionNote"
            label="处理备注"
          >
            <Input.TextArea rows={2} placeholder="请输入处理备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 警告用户 Modal */}
      <Modal
        title="警告用户"
        open={warnModalVisible}
        onCancel={() => {
          setWarnModalVisible(false)
          warnForm.resetFields()
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setWarnModalVisible(false)
            warnForm.resetFields()
          }}>
            取消
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            loading={reportActionLoading}
            onClick={() => warnForm.submit()}
          >
            确认警告
          </Button>
        ]}
      >
        <Form
          form={warnForm}
          layout="vertical"
          onFinish={handleWarnUser}
        >
          <Form.Item
            name="reason"
            label="警告原因"
            initialValue="举报处理"
          >
            <Input.TextArea rows={3} placeholder="请输入警告原因" />
          </Form.Item>
          <Form.Item
            name="resolutionNote"
            label="处理备注"
          >
            <Input.TextArea rows={2} placeholder="请输入处理备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 驳回举报 Modal */}
      <Modal
        title="驳回举报"
        open={dismissModalVisible}
        onCancel={() => {
          setDismissModalVisible(false)
          dismissForm.resetFields()
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setDismissModalVisible(false)
            dismissForm.resetFields()
          }}>
            取消
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            loading={reportActionLoading}
            onClick={() => dismissForm.submit()}
          >
            确认驳回
          </Button>
        ]}
      >
        <Form
          form={dismissForm}
          layout="vertical"
          onFinish={handleDismissReport}
        >
          <Form.Item
            name="resolutionNote"
            label="驳回原因"
          >
            <Input.TextArea rows={3} placeholder="请输入驳回原因" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 封禁详情 Modal */}
      <Modal
        title="封禁详情"
        open={banDetailModalVisible}
        onCancel={() => {
          setBanDetailModalVisible(false);
          setCurrentBan(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setBanDetailModalVisible(false);
            setCurrentBan(null);
          }}>
            关闭
          </Button>,
          currentBan && currentBan.is_active && (
            <>
              <Button 
                key="unban" 
                type="primary" 
                danger
                loading={reportActionLoading}
                onClick={async () => {
                  try {
                    setReportActionLoading(true);
                    await api.delete(`/api/fabu-bot/groups/${currentGroup.group_id}/bans/${currentBan.user_id}`);
                    message.success('用户解封成功');
                    setBanDetailModalVisible(false);
                    setCurrentBan(null);
                    fetchGroupBans(currentGroup.group_id);
                  } catch (error) {
                    message.error('解封用户失败');
                    console.error('解封失败:', error);
                  } finally {
                    setReportActionLoading(false);
                  }
                }}
              >
                解封
              </Button>
            </>
          )
        ]}
        width={600}
      >
        {currentBan && (
          <div style={{ fontSize: '14px' }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="记录ID">{currentBan.id}</Descriptions.Item>
              <Descriptions.Item label="群组ID">{currentBan.group_id}</Descriptions.Item>
              <Descriptions.Item label="被封禁用户ID">{currentBan.user_id}</Descriptions.Item>
              <Descriptions.Item label="封禁者ID">{currentBan.banned_by}</Descriptions.Item>
              <Descriptions.Item label="封禁原因">{currentBan.reason || '未提供原因'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {currentBan.is_active ? <Tag color="red">封禁中</Tag> : <Tag color="green">已解封</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="到期时间">
                {currentBan.ban_until ? new Date(currentBan.ban_until).toLocaleString() : '永久'}
              </Descriptions.Item>
              {currentBan.unbanned_by && (
                <Descriptions.Item label="解封者">{currentBan.unbanned_by}</Descriptions.Item>
              )}
              {currentBan.unbanned_at && (
                <Descriptions.Item label="解封时间">
                  {new Date(currentBan.unbanned_at).toLocaleString()}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="创建时间">
                {currentBan.created_at ? new Date(currentBan.created_at).toLocaleString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {currentBan.updated_at ? new Date(currentBan.updated_at).toLocaleString() : '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* 欢迎消息设置Modal */}
      <Modal
        title="欢迎消息设置"
        open={welcomeModalVisible}
        onCancel={() => {
          setWelcomeModalVisible(false)
          welcomeForm.resetFields()
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setWelcomeModalVisible(false)
            welcomeForm.resetFields()
          }}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={() => welcomeForm.submit()}>
            保存
          </Button>
        ]}
        width={600}
      >
        <Form
          form={welcomeForm}
          layout="vertical"
          onFinish={handleUpdateWelcome}
        >
          <Alert
            message="提示"
            description="可以使用 {user} 代表用户名，{group} 代表群名，{count} 代表成员数"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          <Form.Item
            name="welcome_text"
            label="欢迎消息"
            rules={[{ required: false, message: '请输入欢迎消息' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="例如：欢迎 {user} 加入本群！现在群里有 {count} 个成员。"
            />
          </Form.Item>
          <Form.Item
            name="leave_text"
            label="离开消息"
            rules={[{ required: false, message: '请输入离开消息' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="例如：{user} 离开了本群。"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 反刷屏设置Modal */}
      <Modal
        title="反刷屏设置"
        open={floodModalVisible}
        onCancel={() => {
          setFloodModalVisible(false)
          floodForm.resetFields()
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setFloodModalVisible(false)
            floodForm.resetFields()
          }}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={() => floodForm.submit()}>
            保存
          </Button>
        ]}
        width={500}
      >
        <Form
          form={floodForm}
          layout="vertical"
          onFinish={handleUpdateFlood}
        >
          <Alert
            message="提示"
            description="设置用户在指定时间内可发送的最大消息数，超过该数量将被视为刷屏"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          <Form.Item
            name="flood_max_messages"
            label="最大消息数"
            rules={[{ required: true, message: '请输入最大消息数' }]}
          >
            <InputNumber
              min={1}
              max={50}
              placeholder="例如：5"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="flood_time_window"
            label="时间窗口（毫秒）"
            rules={[{ required: true, message: '请输入时间窗口' }]}
          >
            <InputNumber
              min={1000}
              max={30000}
              step={1000}
              placeholder="例如：5000"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FaBuBot
