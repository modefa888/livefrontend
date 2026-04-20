import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Form, Input, Select, Modal, message, Spin, Tabs, Checkbox, Switch, List, Alert, Row, Col, Space, Divider } from 'antd'
import { RobotOutlined, PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, UpOutlined, DownOutlined, ArrowLeftOutlined, EyeInvisibleOutlined, EyeTwoTone, CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'
import { useBotLoading } from '../contexts/BotLoadingContext'

const { Option } = Select
const { TabPane } = Tabs
const { Item: ListItem, Item: { Meta: ListItemMeta } } = List

// 加密密钥，应该从环境变量中获取
// 注意：前后端密钥必须一致，且长度必须符合 AES-256 要求（32字节）
const SECRET_KEY = 'your-secret-key-for-encryption';
const IV_LENGTH = 16; // 初始化向量长度

/**
 * 将字符串转换为 32 字节密钥（用于 AES-256）
 * @param {string} str - 输入字符串
 * @returns {Uint8Array} 32字节密钥
 */
function getKeyBytes(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  // 如果密钥长度不足32字节，重复填充；如果超过，截取前32字节
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    key[i] = data[i % data.length];
  }
  return key;
}

/**
 * 将十六进制字符串转换为 Uint8Array
 * @param {string} hex - 十六进制字符串
 * @returns {Uint8Array} 字节数组
 */
function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * 解密数据
 * @param {string} text - 要解密的文本
 * @returns {Promise<string>} 解密后的文本
 */
async function decrypt(text) {
  try {
    // 检查是否为加密格式（包含冒号分隔的IV和密文）
    if (!text || !text.includes(':')) {
      return text; // 不是加密格式，直接返回原文
    }

    const textParts = text.split(':');
    if (textParts.length < 2) {
      return text; // 格式不正确，返回原文
    }

    const ivHex = textParts.shift();
    const encryptedHex = textParts.join(':');

    // 验证IV长度是否为32个字符（16字节）
    if (ivHex.length !== 32) {
      return text; // IV长度不正确，可能是明文
    }

    const iv = hexToUint8Array(ivHex);
    const encryptedText = hexToUint8Array(encryptedHex);
    
    // 使用 Web Crypto API 进行解密
    const key = await window.crypto.subtle.importKey(
      'raw',
      getKeyBytes(SECRET_KEY),
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      key,
      encryptedText
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('解密失败:', error);
    return text; // 解密失败时返回原文本
  }
}

/**
 * 解密环境配置中的敏感字段
 * @param {object} environment - 加密的环境配置对象
 * @returns {Promise<object>} 解密后的环境配置对象
 */
async function decryptEnvironment(environment) {
  const sensitiveFields = ['bot_token', 'authorization', 'github_token'];
  const decryptedEnv = { ...environment };
  
  for (const field of sensitiveFields) {
    if (decryptedEnv[field]) {
      decryptedEnv[field] = await decrypt(decryptedEnv[field]);
    }
  }
  
  return decryptedEnv;
}

/**
 * 解密环境配置列表中的敏感字段
 * @param {array} environments - 加密的环境配置列表
 * @returns {Promise<array>} 解密后的环境配置列表
 */
async function decryptEnvironments(environments) {
  return Promise.all(environments.map(decryptEnvironment));
}

const Bot = () => {

  const navigate = useNavigate()
  const { livebotLoading, setLivebotLoading } = useBotLoading()
  
  // 机器人状态
  const [botStatus, setBotStatus] = useState(null)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [envConfig, setEnvConfig] = useState(null)
  
  // 代理检测相关状态
  const [proxyStatus, setProxyStatus] = useState(null)
  const [checkingProxy, setCheckingProxy] = useState(false)
  
  // 启动记录相关状态
  const [startupRecords, setStartupRecords] = useState([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  
  // 命令管理
  const [commands, setCommands] = useState([])
  const [commandsLoading, setCommandsLoading] = useState(false)
  const [isCommandModalVisible, setIsCommandModalVisible] = useState(false)
  const [editingCommand, setEditingCommand] = useState(null)
  const [commandForm] = Form.useForm()
  
  // 消息发送
  const [messageForm] = Form.useForm()
  const [messageLoading, setMessageLoading] = useState(false)
  const [messageType, setMessageType] = useState('text')
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  
  // 消息管理
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [replyForm] = Form.useForm()
  const [replyLoading, setReplyLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [usersPerPage] = useState(10)
  
  // 已查看的用户列表
  const [viewedUsers, setViewedUsers] = useState(new Set());
  
  // 用户互动时间记录
  const [userInteractionTimes, setUserInteractionTimes] = useState(new Map());
  
  // 计算用户的最后互动时间
  useEffect(() => {
    const newInteractionTimes = new Map();
    
    // 遍历所有消息，更新每个用户的最后互动时间
    messages.forEach(msg => {
      const userId = msg.chat?.id;
      if (userId) {
        const messageTime = new Date(msg.date * 1000).getTime();
        const currentTime = newInteractionTimes.get(userId) || 0;
        if (messageTime > currentTime) {
          newInteractionTimes.set(userId, messageTime);
        }
      }
    });
    
    setUserInteractionTimes(newInteractionTimes);
  }, [messages]);
  
  // 计算每个用户的消息数量（只计算用户发送的消息，不计算机器人发送的消息）
  const usersWithMessageCount = users.map(user => {
    // 如果用户已被查看，消息数量为0
    if (viewedUsers.has(user.userId)) {
      return {
        ...user,
        messageCount: 0
      };
    }
    
    // 只计算用户发送的消息，不计算机器人发送的消息
    const messageCount = messages.filter(msg => {
      const isUserMessage = msg.from?.id === user.userId || msg.chat?.id === user.userId;
      const isBotMessage = msg.from?.id === 'bot' && msg.chat?.id === user.userId;
      // 只计算用户发送的消息
      return isUserMessage && !isBotMessage;
    }).length;
    
    return {
      ...user,
      messageCount
    };
  });
  
  // 过滤后的用户列表，并按互动时间和消息数量排序
  const filteredUsers = usersWithMessageCount
    .filter(user => 
      user.username.toLowerCase().includes(searchKeyword.toLowerCase())
    )
    .sort((a, b) => {
      // 选中的用户排在最前面
      if (a.userId === selectedUser?.userId) return -1;
      if (b.userId === selectedUser?.userId) return 1;
      
      // 按互动时间排序，最近互动的排在前面
      const timeA = userInteractionTimes.get(a.userId) || 0;
      const timeB = userInteractionTimes.get(b.userId) || 0;
      if (timeA !== timeB) return timeB - timeA;
      
      // 有消息的用户排在前面
      if (a.messageCount > 0 && b.messageCount === 0) return -1;
      if (a.messageCount === 0 && b.messageCount > 0) return 1;
      
      // 消息数量相同的按用户名排序
      return a.username.localeCompare(b.username);
    });
  
  // 分页后的用户列表
  const paginatedUsers = filteredUsers.slice(0, userPage * usersPerPage)
  
  // 自动刷新状态相关
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null)
  const [countdown, setCountdown] = useState(30)
  const [messageAutoRefresh, setMessageAutoRefresh] = useState(false)
  const [messageAutoRefreshInterval, setMessageAutoRefreshInterval] = useState(null)
  const [messageCountdown, setMessageCountdown] = useState(5)
  
  // 发送记录
  const [sendRecords, setSendRecords] = useState([])
  const [sendRecordsLoading, setSendRecordsLoading] = useState(false)
  
  // 配置管理状态
  const [configLoading, setConfigLoading] = useState(true);
  const [configActiveTab, setConfigActiveTab] = useState('environment');
  const [environments, setEnvironments] = useState([]);
  const [currentEnvironment, setCurrentEnvironment] = useState('local');
  const [settings, setSettings] = useState([]);
  const [sites, setSites] = useState([]);
  
  // 为每个 tab 创建独立的 form 实例
  const [envForm] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [sitesForm] = Form.useForm();
  
  // 独立的保存状态
  const [savingEnv, setSavingEnv] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingSites, setSavingSites] = useState(false);
  
  // 独立的表单变更状态
  const [envChanged, setEnvChanged] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [sitesChanged, setSitesChanged] = useState({});
  const [localSiteValues, setLocalSiteValues] = useState({});
  
  // 敏感字段显示状态
  const [visibleFields, setVisibleFields] = useState({
    bot_token: false,
    authorization: false,
    github_token: false
  });
  





  
  // 获取机器人状态
  const fetchBotStatus = async () => {
    setRefreshLoading(true)
    try {
      const response = await api.get('/api/bot/status')
      setBotStatus(response.data)
    } catch (error) {
      message.error('获取机器人状态失败')
      console.error(error)
    } finally {
      setRefreshLoading(false)
    }
  }
  
  // 启动机器人
  const startBot = async () => {
    // 警告用户代理不可用，但不阻止启动
    if (envConfig?.proxy && proxyStatus && !proxyStatus.success) {
      message.warning('代理检测失败，但仍将尝试启动机器人')
    }

    setLivebotLoading(true)
    try {
      await api.post('/api/bot/start', {})
      message.success('机器人启动成功')
      fetchBotStatus()
      fetchStartupRecords() // 自动刷新启动记录
      // 启动机器人后自动开启自动刷新
      if (!autoRefresh) {
        toggleAutoRefresh()
      }
    } catch (error) {
      message.error('启动机器人失败')
      fetchStartupRecords() // 即使失败也刷新启动记录
      console.error(error)
    } finally {
      setLivebotLoading(false)
    }
  }

  // 停止机器人
  const stopBot = async () => {
    setLivebotLoading(true)
    try {
      await api.post('/api/bot/stop', {})
      message.success('机器人停止成功')
      fetchBotStatus()
    } catch (error) {
      message.error('停止机器人失败')
      console.error(error)
    } finally {
      setLivebotLoading(false)
    }
  }
  
  // 获取环境配置
  const fetchEnvConfig = async () => {
    try {
      const response = await api.get('/api/bot/env')
      setEnvConfig(response.data)
      // 自动检测代理状态
      if (response.data.proxy) {
        checkProxyStatus(response.data.proxy)
      }
    } catch (error) {
      console.error('获取环境配置失败:', error)
    }
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

  // 获取启动记录
  const fetchStartupRecords = async () => {
    setRecordsLoading(true)
    try {
      const response = await api.get('/api/bot/startup-records')
      setStartupRecords(response.data.records || [])
    } catch (error) {
      console.error('获取启动记录失败:', error)
    } finally {
      setRecordsLoading(false)
    }
  }
  
  // 获取命令列表
  const fetchCommands = async () => {
    setCommandsLoading(true)
    try {
      const response = await api.get('/api/bot/commands')
      // 按order字段排序
      const sortedCommands = response.data.commands.sort((a, b) => (a.order || 0) - (b.order || 0))
      setCommands(sortedCommands)
    } catch (error) {
      message.error('获取命令列表失败')
      console.error(error)
    } finally {
      setCommandsLoading(false)
    }
  }
  
  // 打开命令编辑模态框
  const showCommandModal = (command = null) => {
    setEditingCommand(command)
    if (command) {
      commandForm.setFieldsValue(command)
    } else {
      commandForm.resetFields()
    }
    setIsCommandModalVisible(true)
  }
  
  // 保存命令
  const handleSaveCommand = async (values) => {
    try {
      if (editingCommand) {
        // 更新命令
        await api.put(`/api/bot/commands/${editingCommand.command}`, values)
        message.success('命令更新成功')
      } else {
        // 添加命令
        await api.post('/api/bot/commands', values)
        message.success('命令添加成功')
      }
      setIsCommandModalVisible(false)
      fetchCommands()
    } catch (error) {
      message.error(editingCommand ? '更新命令失败' : '添加命令失败')
      console.error(error)
    }
  }
  
  // 删除命令
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [commandToDelete, setCommandToDelete] = useState(null);

  const showDeleteModal = (command) => {
    setCommandToDelete(command);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      const cmd = commandToDelete.startsWith('/') ? commandToDelete.slice(1) : commandToDelete;
      await api.delete(`/api/bot/commands/${cmd}`);
      message.success('命令删除成功');
      fetchCommands();
      setDeleteModalVisible(false);
      setCommandToDelete(null);
    } catch (error) {
      message.error('删除命令失败');
      console.error(error);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setCommandToDelete(null);
  };
  
  // 获取用户列表
  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const response = await api.get('/api/bot/users')
      setUsers(response.data.users)
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setUsersLoading(false)
    }
  }
  
  // 发送消息
  const handleSendMessage = async (values) => {
    setMessageLoading(true)
    try {
      await api.post('/api/bot/message/send', values)
      message.success('消息发送成功')
      fetchSendRecords() // 自动刷新发送记录
      // 不再自动清空表单
    } catch (error) {
      message.error('发送消息失败')
      console.error(error)
    } finally {
      setMessageLoading(false)
    }
  }
  
  // 从localStorage加载本地机器人消息
  const loadLocalBotMessages = () => {
    try {
      const savedMessages = localStorage.getItem('localBotMessages')
      return savedMessages ? JSON.parse(savedMessages) : []
    } catch (error) {
      console.error('加载本地消息失败:', error)
      return []
    }
  }
  
  // 存储本地机器人消息
  const [localBotMessages, setLocalBotMessages] = useState(loadLocalBotMessages())
  
  // 保存本地机器人消息到localStorage
  const saveLocalBotMessages = (messages) => {
    try {
      localStorage.setItem('localBotMessages', JSON.stringify(messages))
    } catch (error) {
      console.error('保存本地消息失败:', error)
    }
  }
  
  // 获取消息列表
  const fetchMessages = async () => {
    setMessagesLoading(true)
    try {
      const response = await api.get('/api/bot/messages')
      // 获取服务器消息
      const serverMessages = response.data.messages || []
      
      // 从localStorage加载本地机器人消息
      const localMessages = loadLocalBotMessages()
      
      // 提取本地消息的ID列表
      const localMessageIds = new Set(localMessages.map(msg => msg.message_id))
      
      // 提取服务器消息中不在本地消息中的新消息
      const newServerMessages = serverMessages.filter(msg => !localMessageIds.has(msg.message_id))
      
      // 合并消息：本地消息 + 新服务器消息
      const allMessages = [...localMessages, ...newServerMessages]
      
      // 按时间倒序排序
      allMessages.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      setMessages(allMessages)
    } catch (error) {
      message.error('获取消息列表失败')
      console.error(error)
    } finally {
      setMessagesLoading(false)
    }
  }
  
  // 回复消息
  const handleReplyMessage = async (values) => {
    setReplyLoading(true)
    try {
      await api.post('/api/bot/message/send', {
        ...values,
        chatId: selectedUser?.userId
      })
      message.success('回复消息成功')
      
      // 立即将发送的消息添加到本地消息列表
      const newMessage = {
        message_id: Date.now(),
        from: {
          id: 'bot', // 标记为机器人发送的消息
          first_name: 'Bot'
        },
        chat: {
          id: selectedUser?.userId
        },
        date: Math.floor(Date.now() / 1000),
        text: values.text,
        caption: values.caption,
        photo: values.mediaUrl && values.type === 'photo' ? [{ file_id: values.mediaUrl }] : undefined,
        video: values.mediaUrl && values.type === 'video' ? { file_id: values.mediaUrl } : undefined,
        audio: values.mediaUrl && values.type === 'audio' ? { file_id: values.mediaUrl } : undefined,
        document: values.mediaUrl && values.type === 'document' ? { file_id: values.mediaUrl } : undefined
      }
      // 确保selectedUser存在
      if (selectedUser) {
        // 更新本地机器人消息状态
        const updatedLocalMessages = [newMessage, ...localBotMessages]
        setLocalBotMessages(updatedLocalMessages)
        // 保存到localStorage
        saveLocalBotMessages(updatedLocalMessages)
        // 更新当前消息列表
        setMessages(prev => [newMessage, ...prev])
      }
      
      replyForm.resetFields()
    } catch (error) {
      message.error('回复消息失败')
      console.error(error)
    } finally {
      setReplyLoading(false)
    }
  }
  
  // 切换消息自动刷新
  const toggleMessageAutoRefresh = () => {
    if (messageAutoRefresh) {
      // 关闭自动刷新
      clearInterval(messageAutoRefreshInterval);
      setMessageAutoRefreshInterval(null);
      setMessageAutoRefresh(false);
      setMessageCountdown(5);
    } else {
      // 开启自动刷新，每5秒刷新一次
      fetchMessages();
      setMessageCountdown(5);
      const interval = setInterval(() => {
        setMessageCountdown(prev => {
          if (prev <= 1) {
            fetchMessages();
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
      setMessageAutoRefreshInterval(interval);
      setMessageAutoRefresh(true);
    }
  };
  
  // 获取发送记录
  const fetchSendRecords = async () => {
    setSendRecordsLoading(true);
    try {
      
      const response = await api.get('/api/bot/send-records');
      setSendRecords(response.data.records || []);
    } catch (error) {
      console.error('获取发送记录失败', error);
    } finally {
      setSendRecordsLoading(false);
    }
  };
  
  // 配置管理相关函数
  
  // 复制到剪贴板
  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success(`${fieldName} 已复制到剪贴板`);
      })
      .catch(err => {
        message.error('复制失败');
        console.error('复制失败:', err);
      });
  };
  
  // 切换字段显示状态
  const toggleVisible = (field) => {
    setVisibleFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 获取配置数据
  const fetchConfig = async () => {
    try {
      setConfigLoading(true);
      
      // 获取环境配置
      const envResponse = await api.get('/api/config/environments');
      // 解密环境配置中的敏感字段
      const decryptedEnvironments = await decryptEnvironments(envResponse.data.environments);
      setEnvironments(decryptedEnvironments);

      // 获取当前环境
      const currentEnvResponse = await api.get('/api/config/current-env');
      setCurrentEnvironment(currentEnvResponse.data.environment);

      // 获取系统设置
      const settingsResponse = await api.get('/api/config/settings');
      setSettings(settingsResponse.data.settings);

      // 获取网站配置
      const sitesResponse = await api.get('/api/config/sites');
      setSites(sitesResponse.data.sites);
    } catch (error) {
      message.error('获取配置数据失败');
      console.error('获取配置数据失败:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  // 初始化本地网站配置值
  useEffect(() => {
    const initialValues = {};
    sites.forEach(site => {
      initialValues[site.site_type] = site.site_list;
    });
    setLocalSiteValues(initialValues);
  }, [sites]);

  // 当环境数据或当前标签变化时，设置表单值
  useEffect(() => {
    const envName = configActiveTab === 'environment' ? 'local' : 'server';
    const environment = environments.find(env => env.env_name === envName);
    if (environment) {
      // 重置表单并设置新值
      envForm.resetFields();
      envForm.setFieldsValue({
        app_name: environment.app_name,
        bot_token: environment.bot_token,
        proxy: environment.proxy,
        authorization: environment.authorization,
        github_token: environment.github_token,
        user_name: environment.user_name,
        user_email: environment.user_email,
        api_host: environment.api_host,
        backend_port: environment.backend_port,
        frontend_port: environment.frontend_port
      });
      setEnvChanged(false);
    }
  }, [environments, configActiveTab, envForm]);

  // 更新环境配置
  const handleEnvUpdate = async (values) => {
    try {
      setSavingEnv(true);
      const envName = configActiveTab === 'environment' ? 'local' : 'server';
      await api.put(`/api/config/environments/${envName}`, values);
      message.success('环境配置更新成功');
      setEnvChanged(false);
      // 如果当前环境是刚更新的环境，并且有代理配置，自动检测代理
      if (envName === currentEnvironment && values.proxy) {
        // 先重新获取环境配置，再检测代理
        await fetchEnvConfig();
      }
    } catch (error) {
      message.error('环境配置更新失败');
      console.error('环境配置更新失败:', error);
    } finally {
      setSavingEnv(false);
    }
  };

  // 更新系统设置
  const handleSettingsUpdate = async (values) => {
    try {
      setSavingSettings(true);
      const settingsToUpdate = Object.entries(values).map(([key, value]) => ({
        setting_key: key,
        setting_value: value
      }));
      
      await api.put('/api/config/settings', { settings: settingsToUpdate });
      message.success('系统设置更新成功');
      setSettingsChanged(false);
    } catch (error) {
      message.error('系统设置更新失败');
      console.error('系统设置更新失败:', error);
    } finally {
      setSavingSettings(false);
    }
  };

  // 更新网站配置（单个，有加载状态）
  const handleSingleSiteSave = async (siteType, value) => {
    try {
      setSavingSites(true);
      await api.put(`/api/config/sites/${siteType}`, { site_list: value });
      message.success('网站配置更新成功');
      // 更新变更状态
      const newSitesChanged = { ...sitesChanged };
      newSitesChanged[siteType] = false;
      setSitesChanged(newSitesChanged);
    } catch (error) {
      message.error('网站配置更新失败');
      console.error('网站配置更新失败:', error);
    } finally {
      setSavingSites(false);
    }
  };

  // 更新当前环境
  const handleCurrentEnvironmentChange = async (value) => {
    try {
      await api.put('/api/config/current-env', { environment: value });
      setCurrentEnvironment(value);
      // 切换环境后重新获取环境配置并重置代理状态
      setProxyStatus(null);
      await fetchEnvConfig();
      message.success('当前环境更新成功');
    } catch (error) {
      message.error('当前环境更新失败');
      console.error('当前环境更新失败:', error);
    }
  };
  
  // 渲染环境配置表单
  const renderEnvironmentForm = (envName) => {
    const environment = environments.find(env => env.env_name === envName);
    if (!environment) return null;

    return (
      <Form
        form={envForm}
        layout="vertical"
        onFinish={(values) => handleEnvUpdate(values)}
        onValuesChange={() => setEnvChanged(true)}
      >
        <Form.Item 
          label="机器人名称" 
          name="app_name" 
          rules={[{ required: true, message: '请输入机器人名称' }]}
          tooltip={`当前值: ${environment.app_name}`}
        >
          <Input placeholder="请输入机器人名称" />
        </Form.Item>
        <Form.Item 
          label="机器人 Token" 
          name="bot_token" 
          rules={[{ required: true, message: '请输入机器人 Token' }]}
          tooltip={`当前值: ${environment.bot_token}`}
        >
          <Input 
            placeholder="请输入机器人 Token" 
            type={visibleFields.bot_token ? 'text' : 'password'}
            suffix={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Button 
                  type="text" 
                  icon={visibleFields.bot_token ? <EyeInvisibleOutlined /> : <EyeTwoTone />}
                  onClick={() => toggleVisible('bot_token')}
                  style={{ marginRight: 8 }}
                />
                <Button 
                  type="text" 
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(environment.bot_token, '机器人 Token')}
                />
              </div>
            }
          />
        </Form.Item>
        <Form.Item 
          label="代理地址" 
          name="proxy" 
          rules={[{ required: true, message: '请输入代理地址' }]}
          tooltip={`当前值: ${environment.proxy}`}
        >
          <Input placeholder="请输入代理地址" />
        </Form.Item>
        <Form.Item 
          label="授权密钥" 
          name="authorization" 
          rules={[{ required: true, message: '请输入授权密钥' }]}
          tooltip={`当前值: ${environment.authorization}`}
        >
          <Input 
            placeholder="请输入授权密钥" 
            type={visibleFields.authorization ? 'text' : 'password'}
            suffix={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Button 
                  type="text" 
                  icon={visibleFields.authorization ? <EyeInvisibleOutlined /> : <EyeTwoTone />}
                  onClick={() => toggleVisible('authorization')}
                  style={{ marginRight: 8 }}
                />
                <Button 
                  type="text" 
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(environment.authorization, '授权密钥')}
                />
              </div>
            }
          />
        </Form.Item>
        <Form.Item 
          label="GitHub Token" 
          name="github_token" 
          rules={[{ required: true, message: '请输入 GitHub Token' }]}
          tooltip={`当前值: ${environment.github_token}`}
        >
          <Input 
            placeholder="请输入 GitHub Token" 
            type={visibleFields.github_token ? 'text' : 'password'}
            suffix={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Button 
                  type="text" 
                  icon={visibleFields.github_token ? <EyeInvisibleOutlined /> : <EyeTwoTone />}
                  onClick={() => toggleVisible('github_token')}
                  style={{ marginRight: 8 }}
                />
                <Button 
                  type="text" 
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(environment.github_token, 'GitHub Token')}
                />
              </div>
            }
          />
        </Form.Item>
        <Form.Item 
          label="用户名" 
          name="user_name" 
          rules={[{ required: true, message: '请输入用户名' }]}
          tooltip={`当前值: ${environment.user_name}`}
        >
          <Input placeholder="请输入用户名" />
        </Form.Item>
        <Form.Item 
          label="用户邮箱" 
          name="user_email" 
          rules={[{ required: true, message: '请输入用户邮箱' }]}
          tooltip={`当前值: ${environment.user_email}`}
        >
          <Input placeholder="请输入用户邮箱" />
        </Form.Item>
        <Divider />
        <Form.Item 
          label="API主机地址" 
          name="api_host" 
          rules={[{ required: true, message: '请输入API主机地址' }]}
          tooltip={`当前值: ${environment.api_host}`}
        >
          <Input placeholder="例如：http://localhost" />
        </Form.Item>
        <Form.Item 
          label="后端端口" 
          name="backend_port" 
          rules={[{ required: true, message: '请输入后端端口' }]}
          tooltip={`当前值: ${environment.backend_port}`}
        >
          <Input placeholder="例如：3002" />
        </Form.Item>
        <Form.Item 
          label="前端端口" 
          name="frontend_port" 
          rules={[{ required: true, message: '请输入前端端口' }]}
          tooltip={`当前值: ${environment.frontend_port}`}
        >
          <Input placeholder="例如：3003" />
        </Form.Item>
        <Form.Item style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" loading={savingEnv} disabled={!envChanged}>
            保存配置
          </Button>
        </Form.Item>
      </Form>
    );
  };

  // 获取字段提示信息
  const getFieldTooltip = (setting) => {
    if (setting.setting_key === 'dy_jx_groups') {
      return '格式：1_[群组ID列表]，如 1_[-1003000233318,987654321]\n1表示启动群组发送，其他值表示关闭\n群组ID支持负数（频道）和正数（超级群组）';
    }
    if (setting.setting_key === 'dy_jx_api') {
      return '抖音解析接口地址，如 http://xxx/api/dy_jx.php?msg=';
    }
    if (setting.setting_key === 'SITE_KEY_VALUE') {
      return '网站域名映射到网站名称\n格式：{"域名":"网站名称","域名2":"网站名称2"}\n例如：{"live.douyin.com":"抖音","www.huya.com":"虎牙"}';
    }
    if (setting.setting_key === 'KEY_OBJECT') {
      return '英文分类映射到中文分类名称\n格式：{"英文key":"中文名称","英文key2":"中文名称2"}\n例如：{"lucky":"超级福袋","looks":"颜值"}';
    }
    return `配置键: ${setting.setting_key}\n当前值: ${setting.setting_value}`;
  };

  // 键值对编辑器组件
  const KeyValueEditor = ({ setting, onChange }) => {
    // 解析 JSON 字符串为键值对数组
    const parseJsonToPairs = (jsonStr) => {
      try {
        const obj = JSON.parse(jsonStr);
        return Object.entries(obj).map(([key, value]) => ({ key, value }));
      } catch (e) {
        return [];
      }
    };

    // 将键值对数组转换为 JSON 字符串
    const pairsToJson = (pairs) => {
      const obj = {};
      pairs.forEach(pair => {
        if (pair.key) {
          obj[pair.key] = pair.value;
        }
      });
      return JSON.stringify(obj);
    };

    const [pairs, setPairs] = useState(parseJsonToPairs(setting.setting_value));

    // 监听外部 setting_value 变化，同步更新内部状态
    useEffect(() => {
      setPairs(parseJsonToPairs(setting.setting_value));
    }, [setting.setting_value]);

    // 添加新的键值对
    const addPair = () => {
      const newPairs = [...pairs, { key: '', value: '' }];
      setPairs(newPairs);
      onChange(pairsToJson(newPairs));
    };

    // 删除键值对
    const removePair = (index) => {
      const newPairs = [...pairs];
      newPairs.splice(index, 1);
      setPairs(newPairs);
      // 通知表单更新
      onChange(pairsToJson(newPairs));
    };

    // 更新键值对
    const updatePair = (index, field, value) => {
      const newPairs = [...pairs];
      newPairs[index][field] = value;
      setPairs(newPairs);
      // 通知表单更新
      onChange(pairsToJson(newPairs));
    };

    return (
      <div>
        {pairs.map((pair, index) => (
          <Row key={index} gutter={8} style={{ marginBottom: 8 }}>
            <Col span={10}>
              <Input
                placeholder="Key"
                value={pair.key}
                onChange={(e) => updatePair(index, 'key', e.target.value)}
              />
            </Col>
            <Col span={12}>
              <Input
                placeholder="Value"
                value={pair.value}
                onChange={(e) => updatePair(index, 'value', e.target.value)}
              />
            </Col>
            <Col span={2}>
              <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removePair(index)}
            />
            </Col>
          </Row>
        ))}
        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={addPair}
          style={{ marginTop: 8 }}
        >
          添加键值对
        </Button>
      </div>
    );
  };

  // 渲染系统设置表单
  const renderSettingsForm = () => {
    const initialValues = {};
    settings.forEach(setting => {
      initialValues[setting.setting_key] = setting.setting_value;
    });

    // 获取字段的显示标签
    const getFieldLabel = (setting) => {
      if (setting.description) return setting.description;
      if (setting.setting_key === 'SITE_KEY_VALUE') return '网站映射配置';
      if (setting.setting_key === 'KEY_OBJECT') return '分类映射配置';
      return setting.setting_key;
    };

    // 获取字段的占位符
    const getPlaceholder = (setting) => {
      if (setting.description) return `请输入${setting.description}`;
      if (setting.setting_key === 'SITE_KEY_VALUE') return '请输入网站域名映射JSON，例如：{"live.douyin.com":"抖音"}';
      if (setting.setting_key === 'KEY_OBJECT') return '请输入分类映射JSON，例如：{"lucky":"超级福袋"}';
      return `请输入${setting.setting_key}`;
    };

    // 渲染普通的表单项
    const renderNormalField = (setting) => (
      <Form.Item 
        key={setting.setting_key} 
        label={getFieldLabel(setting)} 
        name={setting.setting_key}
        tooltip={getFieldTooltip(setting)}
      >
        {setting.setting_type === 'number' ? (
          <Input type="number" placeholder={getPlaceholder(setting)} />
        ) : (
          <Input placeholder={getPlaceholder(setting)} />
        )}
      </Form.Item>
    );

    // 渲染键值对编辑器字段
    const renderKeyValueField = (setting) => {
      const currentValue = settingsForm.getFieldValue(setting.setting_key) || setting.setting_value;
      
      return (
        <Form.Item 
          key={setting.setting_key} 
          label={getFieldLabel(setting)} 
          name={setting.setting_key}
          tooltip={getFieldTooltip(setting)}
        >
          <KeyValueEditor 
            setting={{ ...setting, setting_value: currentValue }} 
            onChange={(value) => {
              settingsForm.setFieldValue(setting.setting_key, value);
              setSettingsChanged(true);
            }}
          />
          <Divider style={{ margin: '8px 0' }} />
          <details>
            <summary style={{ cursor: 'pointer', color: '#1890ff', fontSize: '12px' }}>查看/编辑原始 JSON</summary>
            <Input.TextArea
              rows={4}
              placeholder={getPlaceholder(setting)}
              value={currentValue}
              onChange={(e) => {
                settingsForm.setFieldValue(setting.setting_key, e.target.value);
                setSettingsChanged(true);
              }}
              style={{ marginTop: 8 }}
            />
          </details>
        </Form.Item>
      );
    };

    return (
      <Form
        form={settingsForm}
        layout="vertical"
        initialValues={initialValues}
        onFinish={(values) => handleSettingsUpdate(values)}
        onValuesChange={() => setSettingsChanged(true)}
      >
        {settings.map(setting => (
          (setting.setting_key === 'SITE_KEY_VALUE' || setting.setting_key === 'KEY_OBJECT') 
            ? renderKeyValueField(setting)
            : renderNormalField(setting)
        ))}
        <Form.Item style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" loading={savingSettings} disabled={!settingsChanged}>
            保存设置
          </Button>
        </Form.Item>
      </Form>
    );
  };

  // 渲染网站配置表单
  const renderSiteForm = () => {
    return (
      <div>
        {sites.map(site => {
          const isChanged = sitesChanged[site.site_type];
          const currentValue = localSiteValues[site.site_type] ?? site.site_list;
          
          return (
            <Card key={site.site_type} title={site.description || (site.site_type === 'S19_SITE' ? '成人网站列表' : 'CG网站源')} style={{ marginBottom: 16 }}>
              <Form.Item 
                label={site.description || (site.site_type === 'S19_SITE' ? '成人网站列表' : 'CG网站源')}
                tooltip={`当前值: ${site.site_list}`}
              >
                <Input.TextArea
                  rows={6}
                  value={currentValue}
                  onChange={(e) => {
                    const newValues = { ...localSiteValues };
                    newValues[site.site_type] = e.target.value;
                    setLocalSiteValues(newValues);
                    const newSitesChanged = { ...sitesChanged };
                    newSitesChanged[site.site_type] = true;
                    setSitesChanged(newSitesChanged);
                  }}
                  placeholder="多个网站以 # 分隔"
                />
              </Form.Item>
              <div style={{ textAlign: 'right' }}>
                <Button 
                  type="primary" 
                  onClick={() => handleSingleSiteSave(site.site_type, currentValue)}
                  loading={savingSites}
                  disabled={!isChanged}
                >
                  保存配置
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };
  
  // 切换自动刷新
  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      // 关闭自动刷新
      clearInterval(autoRefreshInterval);
      setAutoRefreshInterval(null);
      setAutoRefresh(false);
      setCountdown(30);
    } else {
      // 开启自动刷新，每30秒刷新一次
      fetchBotStatus();
      fetchEnvConfig();
      fetchStartupRecords();
      
      // 启动倒计时
      setCountdown(30);
      const countdownInterval = setInterval(() => {
        setCountdown(prevCountdown => {
          if (prevCountdown <= 1) {
            // 倒计时结束，刷新状态并重置倒计时
            fetchBotStatus();
            fetchEnvConfig();
            fetchStartupRecords();
            return 30;
          }
          return prevCountdown - 1;
        });
      }, 1000);
      
      setAutoRefreshInterval(countdownInterval);
      setAutoRefresh(true);
    }
  };

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
      if (messageAutoRefreshInterval) {
        clearInterval(messageAutoRefreshInterval);
      }
    };
  }, [autoRefreshInterval, messageAutoRefreshInterval]);

  // 初始化时获取数据
  useEffect(() => {
    fetchBotStatus()
    fetchEnvConfig()
    fetchCommands()
    fetchUsers()
    fetchStartupRecords()
    fetchConfig()
    
    // 先从localStorage加载本地机器人消息
    const savedMessages = loadLocalBotMessages()
    setMessages(savedMessages)
    
    // 然后获取服务器消息（只添加新消息）
    fetchMessages()
  }, [])





  // 处理标签页切换
  const handleTabChange = (key) => {
    // 检查是否是消息发送标签页
    if (key === 'message' && !botStatus?.isRunning) {
      message.warning('请先启动机器人');
      return false;
    }
    return true;
  };

  // 处理状态直接修改
  const handleStatusChange = async (command, field, value) => {
    try {

      // 调用后端 API 更新命令状态
      await api.put(`/api/bot/commands/${command}`, {
        [field]: value
      });
      
      // 更新前端命令列表
      setCommands(prevCommands => {
        return prevCommands.map(cmd => {
          if (cmd.command === command) {
            return { ...cmd, [field]: value };
          }
          return cmd;
        });
      });
      
      // 显示操作成功提示
      message.success('状态更新成功');
    } catch (error) {
      console.error('更新状态失败:', error);
      message.error('状态更新失败');
    }
  };

  // 处理命令排序
  const handleCommandOrder = async (command, direction) => {
    try {
      // 获取认证令牌
      
      // 找到当前命令的索引
      const currentIndex = commands.findIndex(cmd => cmd.command === command);
      if (currentIndex === -1) {
        message.error('命令不存在');
        return;
      }
      
      // 计算新的索引
      let newIndex;
      if (direction === 'up') {
        newIndex = Math.max(0, currentIndex - 1);
      } else {
        newIndex = Math.min(commands.length - 1, currentIndex + 1);
      }
      
      // 找到目标命令
      const targetCommand = commands[newIndex];
      if (!targetCommand) {
        message.error('目标命令不存在');
        return;
      }
      
      // 交换顺序
      const currentOrder = commands[currentIndex].order || 0;
      const targetOrder = targetCommand.order || 0;
      
      // 调用后端 API 更新命令排序
      await api.put('/api/bot/commands/order', {
        command,
        newOrder: targetOrder
      });
      
      // 更新目标命令的顺序
      await api.put('/api/bot/commands/order', {
        command: targetCommand.command,
        newOrder: currentOrder
      });
      
      // 重新获取命令列表，更新排序
      fetchCommands();
      
      // 显示操作成功提示
      message.success('命令排序更新成功');
    } catch (error) {
      console.error('更新命令排序失败:', error);
      message.error('命令排序更新失败');
    }
  };

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
          <h1 style={{ margin: 0 }}>LiveBot 管理</h1>
        </div>
        <div>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            onClick={startBot} 
            disabled={botStatus?.isRunning || livebotLoading}
            loading={livebotLoading}
            style={{ marginRight: '10px' }}
          >
            启动机器人
          </Button>
          <Button 
            danger 
            icon={<PauseCircleOutlined />}
            onClick={stopBot} 
            disabled={!botStatus?.isRunning || livebotLoading}
            loading={livebotLoading}
          >
            停止机器人
          </Button>
        </div>
      </div>
      
      <Tabs 
        defaultActiveKey="status"
        onChange={handleTabChange}
      >



        
        <TabPane tab={botStatus?.isRunning ? '🤖 机器人状态 (运行中)' : '🚫 机器人状态 (已停止)'} key="status">
          <Spin spinning={livebotLoading}>
            <Card title="⚙️ 机器人状态" extra={<Button icon={<ReloadOutlined />} onClick={toggleAutoRefresh} loading={refreshLoading} type={autoRefresh ? 'primary' : 'default'}>{autoRefresh ? `停止自动刷新 (${countdown}s)` : '启动自动刷新 (30s)'}</Button>}>  
              <div style={{ fontSize: '16px', lineHeight: '2' }}>
                <p><strong>运行状态:</strong> {botStatus?.isRunning ? '✅ 运行中' : '❌ 已停止'}</p>
                
                <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <h3 style={{ marginBottom: '10px' }}>🌐 环境配置</h3>
                  <p><strong>🏭 当前环境:</strong> {envConfig?.environment || '未知'}</p>
                  <p><strong>🤖 机器人名称:</strong> {envConfig?.appName || '未知'}</p>
                  <p><strong>🔑 机器人 Token:</strong> <span style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => {
                    navigator.clipboard.writeText(envConfig?.botToken || '').then(() => {
                      message.success('Token 已复制到剪贴板');
                    }).catch(err => {
                      console.error('复制失败:', err);
                      message.error('复制失败，请手动复制');
                    });
                  }}>{envConfig?.botToken ? envConfig.botToken.substring(0, 20) + '...' : '未知'}</span></p>
                  <p><strong>📍 代理地址:</strong> {envConfig?.proxy || '未知'}
                    {envConfig?.proxy && (
                      <Button 
                        type="link" 
                        size="small" 
                        onClick={() => checkProxyStatus(envConfig.proxy)}
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

                <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ marginBottom: 0 }}>📊 启动记录</h3>
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={fetchStartupRecords}
                      loading={recordsLoading}
                    >
                      刷新
                    </Button>
                  </div>
                  <Spin spinning={recordsLoading}>
                    {startupRecords.length > 0 ? (
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {startupRecords.map((record, index) => (
                          <div key={index} style={{ padding: '5px 0', borderBottom: '1px solid #e8e8e8' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                              <span>{new Date(record.timestamp).toLocaleString()}</span>
                              <span style={{ color: record.success ? '#52c41a' : '#ff4d4f' }}>
                                {record.success ? '✅ 成功' : '❌ 失败'}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                              <span>环境: {record.environment || '未知'}</span>
                              <span style={{ marginLeft: '15px' }}>机器人: {record.appName || '未知'}</span>
                              <span style={{ marginLeft: '15px' }}>操作人: {record.createdBy || '未知'}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                              <span>代理: {record.proxy || '未知'}</span>
                            </div>
                            {record.error && (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                错误: {record.error.substring(0, 50)}...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                        暂无启动记录
                      </div>
                    )}
                  </Spin>
                </div>
              </div>
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
                          onClick={() => handleCommandOrder(record.command, 'up')}
                          disabled={index === 0}
                        />
                        <span style={{ margin: '0 8px' }}>{order || 0}</span>
                        <Button 
                          type="text" 
                          icon={<DownOutlined />} 
                          size="small" 
                          onClick={() => handleCommandOrder(record.command, 'down')}
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
                        onChange={(checked) => handleStatusChange(record.command, 'isEnabled', checked)}
                        checkedChildren="启用" 
                        unCheckedChildren="禁用"
                        style={{ color: isEnabled ? '#52c41a' : '#ff4d4f' }}
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
                        onChange={(checked) => handleStatusChange(record.command, 'isAdmin', checked)}
                        checkedChildren="管理员" 
                        unCheckedChildren="普通用户"
                        style={{ color: isAdmin ? '#1890ff' : '#faad14' }}
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
          tab="消息发送" 
          key="message"
          disabled={!botStatus?.isRunning}
        >
          <Card title="📤 发送消息">
            <Form
              form={messageForm}
              layout="vertical"
              onFinish={handleSendMessage}
            >
              <Form.Item
                name="userId"
                label="选择用户"
              >
                <Select 
                  placeholder="请选择用户"
                  loading={usersLoading}
                  showSearch
                  optionFilterProp="label"
                  onChange={(value) => {
                    // 当选择用户时，自动填充聊天ID
                    const selectedUser = users.find(user => user.userId === value);
                    if (selectedUser) {
                      messageForm.setFieldsValue({ chatId: selectedUser.userId });
                    }
                  }}
                >
                  {users.map(user => (
                    <Option key={user.userId} value={user.userId} label={`${user.username} (ID: ${user.userId})`}>
                      {user.username} (ID: {user.userId})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="chatId"
                label="聊天ID"
                rules={[{ required: true, message: '请输入聊天ID' }]}
              >
                <Input placeholder="请输入聊天ID" />
              </Form.Item>
              <Form.Item
                name="type"
                label="消息类型"
                rules={[{ required: true, message: '请选择消息类型' }]}
              >
                <Select value={messageType} onChange={setMessageType}>
                  <Option value="text">文本</Option>
                  <Option value="photo">图片</Option>
                  <Option value="video">视频</Option>
                  <Option value="audio">音频</Option>
                  <Option value="document">文档</Option>
                </Select>
              </Form.Item>
              {messageType === 'text' && (
                <Form.Item
                  name="text"
                  label="消息内容"
                  rules={[{ required: true, message: '请输入消息内容' }]}
                >
                  <Input.TextArea rows={4} placeholder="请输入消息内容" />
                </Form.Item>
              )}
              {['photo', 'video', 'audio', 'document'].includes(messageType) && (
                <>
                  <Form.Item
                    name="mediaUrl"
                    label="媒体URL"
                    rules={[{ required: true, message: '请输入媒体URL' }]}
                  >
                    <Input placeholder="请输入媒体URL" />
                  </Form.Item>
                  <Form.Item
                    name="caption"
                    label="媒体描述"
                  >
                    <Input.TextArea rows={2} placeholder="请输入媒体描述" />
                  </Form.Item>
                </>
              )}
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={messageLoading}>
                  发送消息
                </Button>
                <Button style={{ marginLeft: '10px' }} onClick={() => messageForm.resetFields()}>
                  清空表单
                </Button>
              </Form.Item>
            </Form>
          </Card>
          
          {/* 发送记录卡片 */}
          <Card title="📋 发送记录" style={{ marginTop: '20px' }} extra={<Button onClick={fetchSendRecords} loading={sendRecordsLoading}>刷新</Button>}>
            <Spin spinning={sendRecordsLoading}>
              {sendRecords.length > 0 ? (
                <Table
                  dataSource={sendRecords}
                  rowKey="id"
                  columns={[
                    {
                      title: '接收人',
                      dataIndex: 'chatId',
                      key: 'chatId'
                    },
                    {
                      title: '类型',
                      dataIndex: 'type',
                      key: 'type'
                    },
                    {
                      title: '内容',
                      dataIndex: 'text',
                      key: 'text',
                      width: 150,
                      render: (text, record) => {
                        if (record.type === 'text') {
                          return text;
                        } else {
                          return (
                            <>
                              <div>媒体URL: {record.mediaUrl}</div>
                              {record.caption && <div>描述: {record.caption}</div>}
                            </>
                          );
                        }
                      }
                    },
                    {
                      title: '状态',
                      dataIndex: 'success',
                      key: 'success',
                      render: (success) => (
                        <span style={{ color: success ? '#52c41a' : '#ff4d4f' }}>
                          {success ? '✅ 成功' : '❌ 失败'}
                        </span>
                      )
                    },
                    {
                      title: '错误信息',
                      dataIndex: 'error',
                      key: 'error',
                      render: (error) => error || '-'
                    },
                    {
                      title: '操作人',
                      dataIndex: 'createdBy',
                      key: 'createdBy'
                    },
                    {
                      title: '时间',
                      dataIndex: 'timestamp',
                      key: 'timestamp',
                      render: (timestamp) => new Date(timestamp).toLocaleString()
                    }
                  ]}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  暂无发送记录
                </div>
              )}
            </Spin>
          </Card>
        </TabPane>
        
        <TabPane 
          tab="消息管理" 
          key="messages"
          disabled={!botStatus?.isRunning}
        >
          <Spin spinning={messagesLoading}>
            <Card 
              title="💬 消息列表" 
              extra={
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button type="primary" onClick={fetchMessages} loading={messagesLoading}>
                    刷新消息
                  </Button>
                  <Button 
                    onClick={toggleMessageAutoRefresh} 
                    type={messageAutoRefresh ? 'default' : 'primary'}
                  >
                    {messageAutoRefresh ? `停止自动刷新 (${messageCountdown}s)` : '启动自动刷新 (5s)'}
                  </Button>
                </div>
              }
            >
              <div style={{ display: 'flex', gap: '20px' }}>
                {/* 用户列表 */}
                <div style={{ width: '200px', borderRight: '1px solid #f0f0f0', paddingRight: '10px' }}>
                  <h4 style={{ marginBottom: '10px' }}>用户列表</h4>
                  <Input 
                    placeholder="搜索用户" 
                    style={{ marginBottom: '10px' }} 
                    onChange={(e) => {
                      setSearchKeyword(e.target.value)
                      setUserPage(1) // 搜索时重置页码
                    }}
                  />
                  <div 
                    style={{ height: '400px', overflowY: 'auto' }} 
                    onScroll={(e) => {
                      const { scrollTop, clientHeight, scrollHeight } = e.target;
                      // 当滚动到底部时加载更多
                      if (scrollTop + clientHeight >= scrollHeight - 10) {
                        if (paginatedUsers.length < filteredUsers.length) {
                          setUserPage(userPage + 1);
                        }
                      }
                    }}
                  >
                    {paginatedUsers.map(user => (
                      <div 
                        key={user.userId} 
                        style={{
                          padding: '8px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          marginBottom: '5px',
                          backgroundColor: selectedUser?.userId === user.userId ? '#e6f7ff' : 'transparent',
                          border: selectedUser?.userId === user.userId ? '1px solid #91d5ff' : '1px solid transparent',
                          position: 'relative'
                        }}
                        onClick={() => {
                          setSelectedUser(user)
                          // 将用户添加到已查看列表，清除消息数量
                          setViewedUsers(prev => new Set(prev).add(user.userId))
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>{user.username}</div>
                          {user.messageCount > 0 && (
                            <div style={{
                              backgroundColor: '#ff4d4f',
                              color: '#fff',
                              fontSize: '12px',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              minWidth: '16px',
                              textAlign: 'center'
                            }}>
                              {user.messageCount}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>ID: {user.userId}</div>
                        {userInteractionTimes.get(user.userId) && (
                          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                            最后互动: {new Date(userInteractionTimes.get(user.userId)).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                    {paginatedUsers.length < filteredUsers.length && (
                      <div style={{ textAlign: 'center', padding: '10px', color: '#999' }}>
                        加载中...
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
                    共 {filteredUsers.length} 个用户，已显示 {paginatedUsers.length} 个
                  </div>
                </div>
                
                {/* 消息列表 */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
                    <div style={{ marginBottom: '5px', fontSize: '16px', fontWeight: 'bold' }}>
                      {selectedUser ? `${selectedUser.username} 的消息` : '请选择用户'}
                    </div>
                    <div style={{ 
                      flex: 1, 
                      overflowY: 'auto', 
                      border: '1px solid #f0f0f0', 
                      borderRadius: '4px', 
                      padding: '10px',
                      marginBottom: '5px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {selectedUser ? (
                        messages
                        .filter(msg => {
                          // 显示用户发送的消息
                          const isUserMessage = msg.from?.id === selectedUser.userId || msg.chat?.id === selectedUser.userId
                          // 显示机器人发送的消息
                          const isBotMessage = msg.from?.id === 'bot' && msg.chat?.id === selectedUser.userId
                          
                          return isUserMessage || isBotMessage
                        })
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((msg, index) => (
                            <div key={index} style={{ 
                              marginBottom: '8px', 
                              padding: '8px', 
                              borderRadius: '4px',
                              backgroundColor: msg.from?.id === selectedUser.userId ? '#f6ffed' : '#f0f2f5',
                              alignSelf: msg.from?.id === selectedUser.userId ? 'flex-start' : 'flex-end',
                              maxWidth: '80%',
                              marginLeft: msg.from?.id === selectedUser.userId ? '0' : 'auto',
                              marginRight: msg.from?.id === selectedUser.userId ? 'auto' : '0'
                            }}>
                              <div style={{ fontSize: '11px', color: '#999', marginBottom: '3px', textAlign: msg.from?.id === selectedUser.userId ? 'left' : 'right' }}>
                                {msg.from?.id === selectedUser.userId ? '用户' : '机器人'} - {new Date(msg.date * 1000).toLocaleString()}
                              </div>
                              <div style={{ textAlign: msg.from?.id === selectedUser.userId ? 'left' : 'right' }}>
                                {msg.text ? (
                                  msg.text
                                ) : msg.photo ? (
                                  <>
                                    [图片]
                                    {msg.caption && <div style={{ marginTop: '5px', fontSize: '12px' }}>{msg.caption}</div>}
                                  </>
                                ) : msg.video ? (
                                  <>
                                    [视频]
                                    {msg.caption && <div style={{ marginTop: '5px', fontSize: '12px' }}>{msg.caption}</div>}
                                  </>
                                ) : msg.audio ? (
                                  <>
                                    [音频]
                                    {msg.caption && <div style={{ marginTop: '5px', fontSize: '12px' }}>{msg.caption}</div>}
                                  </>
                                ) : msg.document ? (
                                  <>
                                    [文档]
                                    {msg.caption && <div style={{ marginTop: '5px', fontSize: '12px' }}>{msg.caption}</div>}
                                  </>
                                ) : (
                                  '[其他消息]'
                                )}
                              </div>
                            </div>
                        ))
                      ) : (
                        <div style={{ textAlign: 'center', color: '#999', marginTop: '100px' }}>
                          请选择一个用户查看消息
                        </div>
                      )}
                    </div>
                    
                    {/* 回复表单 */}
                    {selectedUser && (
                      <div style={{ 
                        border: '1px solid #f0f0f0', 
                        borderRadius: '4px', 
                        padding: '10px',
                        backgroundColor: '#fafafa'
                      }}>
                        <Form
                          form={replyForm}
                          layout="vertical"
                          onFinish={handleReplyMessage}
                        >
                          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                            <Form.Item
                              name="type"
                              label="消息类型"
                              initialValue="text"
                              rules={[{ required: true, message: '请选择消息类型' }]}
                              style={{ marginBottom: 0, flex: 1 }}
                            >
                              <Select value={messageType} onChange={setMessageType} style={{ width: '100%' }}>
                                <Option value="text">文本</Option>
                                <Option value="photo">图片</Option>
                                <Option value="video">视频</Option>
                                <Option value="audio">音频</Option>
                                <Option value="document">文档</Option>
                              </Select>
                            </Form.Item>
                          </div>
                          <Form.Item
                            name="text"
                            label="消息内容"
                            rules={[{ required: messageType === 'text', message: '请输入消息内容' }]}
                            style={{ marginBottom: '8px' }}
                          >
                            <Input.TextArea 
                              rows={2} 
                              placeholder="请输入回复内容"
                              onChange={(e) => {
                                const value = e.target.value
                                // 检测是否为URL
                                if (value.startsWith('http://') || value.startsWith('https://')) {
                                  // 检测URL类型
                                  if (value.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                                    setMessageType('photo')
                                    replyForm.setFieldsValue({ type: 'photo', mediaUrl: value })
                                  } else if (value.match(/\.(mp4|avi|mov|wmv|flv)$/i)) {
                                    setMessageType('video')
                                    replyForm.setFieldsValue({ type: 'video', mediaUrl: value })
                                  } else if (value.match(/\.(mp3|wav|flac|aac)$/i)) {
                                    setMessageType('audio')
                                    replyForm.setFieldsValue({ type: 'audio', mediaUrl: value })
                                  } else {
                                    setMessageType('document')
                                    replyForm.setFieldsValue({ type: 'document', mediaUrl: value })
                                  }
                                }
                              }}
                            />
                          </Form.Item>
                          {['photo', 'video', 'audio', 'document'].includes(messageType) && (
                            <>
                              <Form.Item
                                name="mediaUrl"
                                label="媒体URL"
                                rules={[{ required: true, message: '请输入媒体URL' }]}
                                style={{ marginBottom: '8px' }}
                              >
                                <Input 
                                  placeholder="请输入媒体URL"
                                  onChange={(e) => {
                                    const value = e.target.value
                                    // 检测URL类型
                                    if (value.startsWith('http://') || value.startsWith('https://')) {
                                      if (value.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                                        setMessageType('photo')
                                        replyForm.setFieldsValue({ type: 'photo' })
                                      } else if (value.match(/\.(mp4|avi|mov|wmv|flv)$/i)) {
                                        setMessageType('video')
                                        replyForm.setFieldsValue({ type: 'video' })
                                      } else if (value.match(/\.(mp3|wav|flac|aac)$/i)) {
                                        setMessageType('audio')
                                        replyForm.setFieldsValue({ type: 'audio' })
                                      } else {
                                        setMessageType('document')
                                        replyForm.setFieldsValue({ type: 'document' })
                                      }
                                    }
                                  }}
                                />
                              </Form.Item>
                              <Form.Item
                                name="caption"
                                label="媒体描述"
                                style={{ marginBottom: '8px' }}
                              >
                                <Input.TextArea rows={1} placeholder="请输入媒体描述" />
                              </Form.Item>
                            </>
                          )}
                          <Form.Item style={{ marginBottom: 0 }}>
                            <Button type="primary" htmlType="submit" loading={replyLoading}>
                              发送消息
                            </Button>
                            <Button style={{ marginLeft: '10px' }} onClick={() => replyForm.resetFields()}>
                              清空
                            </Button>
                          </Form.Item>
                        </Form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Spin>
        </TabPane>
        
        <TabPane tab="配置管理" key="config">
          <Spin spinning={configLoading}>
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>当前环境</h3>
                <Select value={currentEnvironment} onChange={handleCurrentEnvironmentChange} style={{ width: 200 }}>
                  <Option value="local">本地环境</Option>
                  <Option value="server">生产环境</Option>
                </Select>
              </div>
              <Alert message="修改当前环境后需要重启服务才能生效" type="info" style={{ marginTop: 16 }} />
            </Card>

            <Tabs activeKey={configActiveTab} onChange={setConfigActiveTab}>
              <TabPane tab="本地环境配置" key="environment">
                {renderEnvironmentForm('local')}
              </TabPane>
              <TabPane tab="生产环境配置" key="server">
                {renderEnvironmentForm('server')}
              </TabPane>
              <TabPane tab="系统设置" key="settings">
                {renderSettingsForm()}
              </TabPane>
              <TabPane tab="网站配置" key="sites">
                {renderSiteForm()}
              </TabPane>
            </Tabs>
          </Spin>
        </TabPane>
      </Tabs>



      <Modal
        title={editingCommand ? '编辑命令' : '添加命令'}
        open={isCommandModalVisible}
        onCancel={() => setIsCommandModalVisible(false)}
        onOk={() => commandForm.submit()}
      >
        <Form
          form={commandForm}
          layout="vertical"
          onFinish={handleSaveCommand}
        >
          <Form.Item
            name="command"
            label="命令"
            rules={[{ required: true, message: '请输入命令' }]}
            disabled={!!editingCommand}
          >
            <Input placeholder="请输入命令" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input placeholder="请输入命令描述" />
          </Form.Item>
          <Form.Item
            name="isEnabled"
            label="启动状态"
            initialValue={true}
          >
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="isAdmin"
            label="用户类型"
            initialValue={false}
          >
            <Select>
              <Option value={false}>普通用户</Option>
              <Option value={true}>管理员</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
{/* 删除确认模态框 */}
      <Modal
        title="确认删除"
        visible={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="确认删除"
        cancelText="取消"
        okType="danger"
      >
        <p>确定要删除命令 <strong>{commandToDelete}</strong> 吗？</p>
        <p style={{ color: '#f5222d', marginTop: '8px' }}>此操作无法撤销！</p>
      </Modal>

    </div>
  )
}

export default Bot