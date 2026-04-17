import React, { useState, useEffect } from 'react'
import { Card, Table, Button, message, Space, Popconfirm, Tag, Modal, List, Checkbox, Form, Input, InputNumber, Dropdown, Menu, Select } from 'antd'
const { Option } = Select
import { DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined, UserOutlined, MessageOutlined, AudioMutedOutlined, UnorderedListOutlined, TeamOutlined, ExclamationCircleOutlined, DownOutlined, BoldOutlined, ItalicOutlined, UnderlineOutlined, StrikethroughOutlined, LinkOutlined, CodeOutlined, AlignLeftOutlined, PictureOutlined, LoadingOutlined } from '@ant-design/icons'
import api from '../utils/api'

const BotGroups = () => {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [followModalVisible, setFollowModalVisible] = useState(false)
  const [currentGroupId, setCurrentGroupId] = useState('')
  const [vtbs, setVtbs] = useState([])
  const [vtbLoading, setVtbLoading] = useState(false)
  
  // 新的状态管理
  const [messageModalVisible, setMessageModalVisible] = useState(false)
  const [messageForm] = Form.useForm()
  const [messageType, setMessageType] = useState('text') // text, photo, video, audio, document
  const [messageFormat, setMessageFormat] = useState('html') // html, markdown
  const [htmlContent, setHtmlContent] = useState('')
  const [captionHtmlContent, setCaptionHtmlContent] = useState('')
  const [imageModalVisible, setImageModalVisible] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [memberModalVisible, setMemberModalVisible] = useState(false)
  const [memberForm] = Form.useForm()
  const [memberAction, setMemberAction] = useState('mute') // mute, unmute, kick, unban
  const [actionLoading, setActionLoading] = useState(false)
  const [manageModalVisible, setManageModalVisible] = useState(false)
  const [currentGroup, setCurrentGroup] = useState(null)
  const [dyJxGroups, setDyJxGroups] = useState([])
  const [isDyParseEnabled, setIsDyParseEnabled] = useState(false)
  const [biliJxGroups, setBiliJxGroups] = useState([])
  const [isBiliParseEnabled, setIsBiliParseEnabled] = useState(false)



  // 获取群组列表
  const fetchGroups = async () => {
    setLoading(true)
    try {
      // 获取当前用户信息
      const userResponse = await api.get('/api/auth/me')
      const currentUserId = userResponse.data.id.toString()
      const currentUserLevel = userResponse.data.permissionLevel
      
      const response = await api.get('/api/bot/groups')
      
      let userGroups = []
      if (currentUserLevel === 2 || currentUserLevel === 3) {
        // 管理员和超级管理员显示所有群组
        userGroups = response.data
      } else {
        // 普通用户只显示自己添加的群组
        userGroups = response.data.filter(group => 
          group.userId === currentUserId
        )
      }
      
      setGroups(userGroups)
    } catch (error) {
      message.error('获取群组列表失败')
      console.error('获取群组列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始化时获取群组列表
  useEffect(() => {
    fetchGroups()
  }, [])

  // 当当前群组变化时，获取 DY_JX_GROUPS 和 BILI_JX_GROUPS 设置并更新解析状态
  useEffect(() => {
    if (manageModalVisible && currentGroup) {
      const checkParseStatus = async () => {
        const dyGroups = await fetchDyJxGroups()
        const biliGroups = await fetchBiliJxGroups()
        const groupIdStr = String(currentGroup.groupId)
        setIsDyParseEnabled(dyGroups.some(id => String(id) === groupIdStr))
        setIsBiliParseEnabled(biliGroups.some(id => String(id) === groupIdStr))
      }
      checkParseStatus()
    }
  }, [currentGroup, manageModalVisible])

  // 删除群组
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/bot/groups/${id}`)
      message.success('群组删除成功')
      fetchGroups()
    } catch (error) {
      message.error('删除群组失败')
      console.error('删除群组失败:', error)
    }
  }

  // 禁用/启用群组
  const handleToggleDisable = async (id, currentDisabled) => {
    try {
      await api.put(`/api/bot/groups/${id}/disable`, {
        disabled: !currentDisabled
      })
      message.success(currentDisabled ? '群组已启用' : '群组已禁用')
      fetchGroups()
      // 更新当前群组状态，使模态框中的按钮同步变化
      if (currentGroup && currentGroup.id === id) {
        setCurrentGroup(prev => ({
          ...prev,
          disabled: !currentDisabled
        }))
      }
    } catch (error) {
      message.error('更新群组状态失败')
      console.error('更新群组状态失败:', error)
    }
  }

  // 打开关注主播模态框
  const handleFollowVtb = (groupId) => {
    setCurrentGroupId(groupId)
    fetchVtbs(groupId)
    setFollowModalVisible(true)
  }

  // 获取主播列表
  const fetchVtbs = async (groupId) => {
    setVtbLoading(true)
    try {
      const response = await api.get(`/api/bot/groups/${groupId}/vtbs`)
      setVtbs(response.data)
    } catch (error) {
      message.error('获取主播列表失败')
      console.error('获取主播列表失败:', error)
    } finally {
      setVtbLoading(false)
    }
  }

  // 关注/取消关注主播
  const handleToggleFollow = async (vtbId, isFollowing) => {
    try {
      const vtb = vtbs.find(v => v.id === vtbId)
      if (!vtb) return
      
      await api.post(`/api/bot/groups/${currentGroupId}/vtbs/${vtb.mid}/follow`, {
        follow: !isFollowing
      })
      
      message.success(isFollowing ? '已取消关注主播' : '已关注主播')
      // 更新本地状态
      setVtbs(vtbs.map(v => 
        v.id === vtbId ? { ...v, isFollowing: !isFollowing } : v
      ))
    } catch (error) {
      message.error('操作失败')
      console.error('操作失败:', error)
    }
  }
  
  // 打开发布消息模态框
  const handleOpenMessageModal = (groupId) => {
    setCurrentGroupId(groupId)
    messageForm.resetFields()
    setHtmlContent('')
    setCaptionHtmlContent('')
    setMessageModalVisible(true)
  }
  
  // 插入 HTML 语法
  const insertHtml = (tag, placeholder, target = 'text') => {
    let newText = target === 'text' ? htmlContent : captionHtmlContent;
    switch (tag) {
      case 'bold':
        newText += `<b>${placeholder}</b>\n`;
        break;
      case 'italic':
        newText += `<i>${placeholder}</i>\n`;
        break;
      case 'underline':
        newText += `<u>${placeholder}</u>\n`;
        break;
      case 'strikethrough':
        newText += `<s>${placeholder}</s>\n`;
        break;
      case 'link':
        newText += `<a href="https://example.com">${placeholder}</a>\n`;
        break;
      case 'code':
        newText += `<code>${placeholder}</code>\n`;
        break;
      case 'pre':
        newText += `<pre>${placeholder}</pre>\n`;
        break;
      case 'em':
        newText += `<em>${placeholder}</em>\n`;
        break;
      case 'strong':
        newText += `<strong>${placeholder}</strong>\n`;
        break;
      case 'spoiler':
        newText += `<tg-spoiler>${placeholder}</tg-spoiler>\n`;
        break;
      case 'quote':
        newText += `<blockquote>${placeholder}</blockquote>\n`;
        break;
      case 'ul':
        newText += `<ul>\n${placeholder}\n</ul>\n`;
        break;
      case 'ol':
        newText += `<ol>\n${placeholder}\n</ol>\n`;
        break;
      case 'li':
        newText += `<li>${placeholder}</li>\n`;
        break;
      case 'image':
        newText += `<img src="${placeholder}" alt="图片" />\n`;
        break;
      default:
        break;
    }
    if (target === 'text') {
      setHtmlContent(newText);
      messageForm.setFieldsValue({ text: newText });
    } else {
      setCaptionHtmlContent(newText);
      messageForm.setFieldsValue({ caption: newText });
    }
    console.log('Inserted HTML:', newText);
  };
  
  // 插入图片
  const handleInsertImage = (target = 'text') => {
    setImageUrl('');
    setImageModalVisible(true);
    // 存储目标，用于确认插入时使用
    window.insertImageTarget = target;
  };
  
  // 确认插入图片
  const handleConfirmInsertImage = () => {
    if (imageUrl) {
      const target = window.insertImageTarget || 'text';
      insertHtml('image', imageUrl, target);
      setImageModalVisible(false);
      // 清除存储的目标
      window.insertImageTarget = undefined;
    } else {
      message.error('请输入图片 URL');
    }
  };
  
  // 取消插入图片
  const handleCancelInsertImage = () => {
    setImageModalVisible(false);
  };

  // 打开管理模态框
  const handleOpenManageModal = (record) => {
    setCurrentGroup(record);
    setManageModalVisible(true);
  };
  
  // 发布消息
  const handleSendMessage = async (values) => {
    try {
      setSendingMessage(true);
      // 根据消息类型构建请求数据
      let messageData = {
        type: messageType,
        ...values
      };
      
      // 使用 htmlContent 的值
      if (messageType === 'text') {
        messageData.text = htmlContent;
      }
      
      // 使用 captionHtmlContent 的值
      if (['photo', 'video', 'audio', 'document'].includes(messageType)) {
        messageData.caption = captionHtmlContent;
      }
      
      await api.post(`/api/bot/groups/${currentGroupId}/message`, messageData)
      message.success('消息发送成功')
      setMessageModalVisible(false)
    } catch (error) {
      message.error('发送消息失败')
      console.error('发送消息失败:', error)
    } finally {
      setSendingMessage(false);
    }
  }
  
  // 打开成员操作模态框
  const handleOpenMemberModal = (groupId, action) => {
    setCurrentGroupId(groupId)
    setMemberAction(action)
    memberForm.resetFields()
    setMemberModalVisible(true)
  }
  
  // 执行成员操作
  const handleMemberAction = async (values) => {
    setActionLoading(true)
    try {
      const { userId, until_date } = values
      let endpoint = ''
      let data = { userId }
      
      if (memberAction === 'mute') {
        endpoint = 'mute'
        if (until_date) {
          data.until_date = Math.floor(Date.now() / 1000) + until_date * 3600 // 转换为小时
        }
      } else if (memberAction === 'unmute') {
        endpoint = 'unmute'
      } else if (memberAction === 'kick') {
        endpoint = 'kick'
      } else if (memberAction === 'unban') {
        endpoint = 'unban'
      }
      
      await api.post(`/api/bot/groups/${currentGroupId}/${endpoint}`, data)
      
      message.success(getActionMessage(memberAction))
      setMemberModalVisible(false)
    } catch (error) {
      message.error('操作失败')
      console.error('操作失败:', error)
    } finally {
      setActionLoading(false)
    }
  }
  

  
  // 获取操作成功消息
  const getActionMessage = (action) => {
    const messages = {
      mute: '用户已禁言',
      unmute: '用户已解除禁言',
      kick: '用户已踢出群组',
      unban: '用户已解除封禁'
    }
    return messages[action] || '操作成功'
  }
  
  // 获取操作标题
  const getActionTitle = (action) => {
    const titles = {
      mute: '禁言成员',
      unmute: '解除禁言',
      kick: '踢出成员',
      unban: '解除封禁'
    }
    return titles[action] || '成员操作'
  }

  // 获取 DY_JX_GROUPS 设置
  const fetchDyJxGroups = async () => {
    try {
      const response = await api.get('/api/config/settings')
      const dyJxSetting = response.data.settings.find(s => s.setting_key === 'DY_JX_GROUPS')
      if (dyJxSetting && dyJxSetting.setting_value) {
        const value = dyJxSetting.setting_value
        // 解析格式: 1_[-1003000233318,-4233387672]
        const match = value.match(/^(\d+)_\[(.+)\]$/)
        if (match) {
          const groupsStr = match[2]
          try {
            const groups = JSON.parse(`[${groupsStr}]`)
            setDyJxGroups(groups)
            return groups
          } catch {
            setDyJxGroups([])
            return []
          }
        } else {
          setDyJxGroups([])
          return []
        }
      } else {
        setDyJxGroups([])
        return []
      }
    } catch (error) {
      console.error('获取 DY_JX_GROUPS 设置失败:', error)
      setDyJxGroups([])
      return []
    }
  }

  // 更新 DY_JX_GROUPS 设置
  const updateDyJxGroups = async (groupIds) => {
    try {
      const value = `1_[${groupIds.join(',')}]`
      await api.put('/api/config/settings', {
        settings: [{ setting_key: 'DY_JX_GROUPS', setting_value: value }]
      })
      message.success('设置更新成功')
    } catch (error) {
      message.error('更新设置失败')
      console.error('更新 DY_JX_GROUPS 设置失败:', error)
    }
  }

  // 切换抖音解析状态
  const handleToggleDyParse = async (groupId) => {
    try {
      let newGroups = [...dyJxGroups]
      const groupIdStr = String(groupId)
      
      if (isDyParseEnabled) {
        // 取消选中，从数组中删除
        newGroups = newGroups.filter(id => String(id) !== groupIdStr)
      } else {
        // 选中，添加到数组
        if (!newGroups.includes(groupId) && !newGroups.includes(groupIdStr)) {
          newGroups.push(groupId)
        }
      }
      
      setDyJxGroups(newGroups)
      setIsDyParseEnabled(!isDyParseEnabled)
      await updateDyJxGroups(newGroups)
    } catch (error) {
      message.error('操作失败')
      console.error('切换抖音解析状态失败:', error)
    }
  }

  // 获取 BILI_JX_GROUPS 设置
  const fetchBiliJxGroups = async () => {
    try {
      const response = await api.get('/api/config/settings')
      const biliJxSetting = response.data.settings.find(s => s.setting_key === 'BILI_JX_GROUPS')
      if (biliJxSetting && biliJxSetting.setting_value) {
        const value = biliJxSetting.setting_value
        // 解析格式: 1_[-1003000233318,-4233387672]
        const match = value.match(/^(\d+)_\[(.+)\]$/)
        if (match) {
          const groupsStr = match[2]
          try {
            const groups = JSON.parse(`[${groupsStr}]`)
            setBiliJxGroups(groups)
            return groups
          } catch {
            setBiliJxGroups([])
            return []
          }
        } else {
          setBiliJxGroups([])
          return []
        }
      } else {
        setBiliJxGroups([])
        return []
      }
    } catch (error) {
      console.error('获取 BILI_JX_GROUPS 设置失败:', error)
      setBiliJxGroups([])
      return []
    }
  }

  // 更新 BILI_JX_GROUPS 设置
  const updateBiliJxGroups = async (groupIds) => {
    try {
      const value = `1_[${groupIds.join(',')}]`
      await api.put('/api/config/settings', {
        settings: [{ setting_key: 'BILI_JX_GROUPS', setting_value: value }]
      })
      message.success('设置更新成功')
    } catch (error) {
      message.error('更新设置失败')
      console.error('更新 BILI_JX_GROUPS 设置失败:', error)
    }
  }

  // 切换B站解析状态
  const handleToggleBiliParse = async (groupId) => {
    try {
      let newGroups = [...biliJxGroups]
      const groupIdStr = String(groupId)
      
      if (isBiliParseEnabled) {
        // 取消选中，从数组中删除
        newGroups = newGroups.filter(id => String(id) !== groupIdStr)
      } else {
        // 选中，添加到数组
        if (!newGroups.includes(groupId) && !newGroups.includes(groupIdStr)) {
          newGroups.push(groupId)
        }
      }
      
      setBiliJxGroups(newGroups)
      setIsBiliParseEnabled(!isBiliParseEnabled)
      await updateBiliJxGroups(newGroups)
    } catch (error) {
      message.error('操作失败')
      console.error('切换B站解析状态失败:', error)
    }
  }

  // 列定义
  const columns = [
    {
      title: '群组ID',
      dataIndex: 'groupId',
      key: 'groupId'
    },
    {
      title: '群组名称',
      dataIndex: 'groupName',
      key: 'groupName'
    },
    {
      title: '群组类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let color = 'blue'
        if (type === 'group') color = 'green'
        if (type === 'supergroup') color = 'orange'
        if (type === 'channel') color = 'purple'
        return <Tag color={color}>{type}</Tag>
      }
    },
    {
      title: '权限级别',
      dataIndex: 'permissionLevel',
      key: 'permissionLevel',
      render: (level) => {
        let color = 'default'
        if (level === 0) color = 'default'
        if (level === 1) color = 'blue'
        if (level === 2) color = 'red'
        return <Tag color={color}>{level}</Tag>
      }
    },
    {
      title: '添加者',
      dataIndex: 'addedBy',
      key: 'addedBy',
      render: (addedBy) => <Tag color="cyan">{addedBy}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'disabled',
      key: 'disabled',
      render: (disabled) => (
        <Tag color={disabled ? 'red' : 'green'}>
          {disabled ? '已禁用' : '正常'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (time) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        return (
          <Button
            type="primary"
            onClick={() => handleOpenManageModal(record)}
            size="small"
          >
            管理
          </Button>
        );
      }
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="机器人群组管理"
        extra={
          <div style={{ color: '#666', fontSize: '14px' }}>
            💡 提示：群组通过 Telegram 邀请机器人自动添加
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={groups}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10
          }}
        />
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <h4 style={{ marginBottom: '8px' }}>群组管理说明：</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>群组通过在 Telegram 中邀请机器人自动添加到系统</li>
            <li>机器人被添加为管理员时会自动记录群组信息</li>
            <li>机器人被移出群组时会自动从系统中删除</li>
            <li>此处仅显示已添加的群组，无法手动添加群组</li>
          </ul>
        </div>
      </Card>

      {/* 关注主播模态框 */}
      <Modal
        title="关注主播"
        open={followModalVisible}
        onCancel={() => setFollowModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setFollowModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <div style={{ padding: '16px' }}>
          <h4 style={{ marginBottom: '16px' }}>请选择要关注的主播：</h4>
          <List
            loading={vtbLoading}
            dataSource={vtbs}
            renderItem={(vtb, index) => (
              <List.Item
                key={vtb.id}
                actions={[
                  <Button
                    key="follow"
                    type={vtb.isFollowing ? 'default' : 'primary'}
                    onClick={() => handleToggleFollow(vtb.id, vtb.isFollowing)}
                  >
                    {vtb.isFollowing ? '取消关注' : '关注'}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<UserOutlined />}
                  title={
                    <div>
                      <span>{index + 1}. {vtb.isFollowing ? '✅ ' : '🔴 '}{vtb.username}</span>
                    </div>
                  }
                  description={`房间ID: ${vtb.roomid}`}
                />
              </List.Item>
            )}
          />
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <p>点击按钮关注对应主播</p>
            <p>已关注的主播会显示 ✅ 标记，未关注的主播会显示 🔴 标记</p>
          </div>
        </div>
      </Modal>
      
      {/* 发布消息模态框 */}
      <Modal
        title="发布消息到群组"
        open={messageModalVisible}
        onCancel={() => setMessageModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={messageForm}
          layout="vertical"
          onFinish={handleSendMessage}
        >
          <Form.Item
            label="消息类型"
          >
            <Select
              value={messageType}
              onChange={setMessageType}
              style={{ width: '100%' }}
            >
              <Option value="text">文本</Option>
              <Option value="photo">图片</Option>
              <Option value="video">视频</Option>
              <Option value="audio">音频</Option>
              <Option value="document">文档</Option>
            </Select>
          </Form.Item>
          
          {messageType === 'text' && (
            <>

                <Form.Item
                  label="消息内容"
                  rules={[{ required: true, message: '请输入消息内容' }]}
                >
                  <div>
                    {/* Telegram 风格工具栏 */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      flexWrap: 'wrap', 
                      marginBottom: '8px', 
                      padding: '8px', 
                      border: '1px solid #d9d9d9', 
                      borderRadius: '4px 4px 0 0',
                      background: '#f5f5f5'
                    }}>
                      <Button 
                        size="small" 
                        icon={<BoldOutlined />} 
                        onClick={() => insertHtml('bold', '粗体')}
                        title="粗体"
                      />
                      <Button 
                        size="small" 
                        icon={<ItalicOutlined />} 
                        onClick={() => insertHtml('italic', '斜体')}
                        title="斜体"
                      />
                      <Button 
                        size="small" 
                        icon={<UnderlineOutlined />} 
                        onClick={() => insertHtml('underline', '下划线')}
                        title="下划线"
                      />
                      <Button 
                        size="small" 
                        icon={<StrikethroughOutlined />} 
                        onClick={() => insertHtml('strikethrough', '删除线')}
                        title="删除线"
                      />
                      <Button 
                        size="small" 
                        icon={<LinkOutlined />} 
                        onClick={() => insertHtml('link', '链接文本')}
                        title="链接"
                      />
                      <Button 
                        size="small" 
                        icon={<CodeOutlined />} 
                        onClick={() => insertHtml('code', '代码')}
                        title="行内代码"
                      />
                      <Button 
                        size="small" 
                        icon={<AlignLeftOutlined />} 
                        onClick={() => insertHtml('pre', '预格式化文本')}
                        title="预格式化文本"
                      />
                      <Button 
                        size="small" 
                        icon={<AlignLeftOutlined />} 
                        onClick={() => insertHtml('em', '强调文本')}
                        title="强调"
                      />
                      <Button 
                        size="small" 
                        icon={<BoldOutlined />} 
                        onClick={() => insertHtml('strong', '加强语气')}
                        title="加强语气"
                      />
                      <Button 
                        size="small" 
                        icon={<AlignLeftOutlined />} 
                        onClick={() => insertHtml('spoiler', '剧透内容')}
                        title="剧透"
                      />
                      <Button 
                        size="small" 
                        icon={<AlignLeftOutlined />} 
                        onClick={() => insertHtml('quote', '引用')}
                        title="引用"
                      />
                      <Button 
                        size="small" 
                        icon={<UnorderedListOutlined />} 
                        onClick={() => insertHtml('ul', '<li>列表项1</li><li>列表项2</li>')}
                        title="无序列表"
                      />
                      <Button 
                        size="small" 
                        icon={<UnorderedListOutlined />} 
                        onClick={() => insertHtml('ol', '<li>列表项1</li><li>列表项2</li>')}
                        title="有序列表"
                      />
                      <Button 
                        size="small" 
                        icon={<UnorderedListOutlined />} 
                        onClick={() => insertHtml('li', '列表项')}
                        title="列表项"
                      />
                      <Button 
                        size="small" 
                        icon={<PictureOutlined />} 
                        onClick={handleInsertImage}
                        title="添加图片"
                      />
                    </div>
                    
                    {/* 文本编辑器 */}
                    <Input.TextArea 
                      rows={6} 
                      placeholder="请输入消息内容（支持 HTML 标签）"
                      value={htmlContent}
                      onChange={(e) => {
                        const value = e.target.value;
                        setHtmlContent(value);
                      }}
                      style={{ 
                        borderTop: 'none', 
                        borderRadius: '0 0 4px 4px'
                      }}
                    />
                    
                    {/* 语法提示 */}
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      支持的 HTML 标签: 
                      <code>&lt;b&gt;粗体&lt;/b&gt;</code>、
                      <code>&lt;i&gt;斜体&lt;/i&gt;</code>、
                      <code>&lt;u&gt;下划线&lt;/u&gt;</code>、
                      <code>&lt;s&gt;删除线&lt;/s&gt;</code>、
                      <code>&lt;a href="url"&gt;链接&lt;/a&gt;</code>、
                      <code>&lt;code&gt;代码&lt;/code&gt;</code>、
                      <code>&lt;blockquote&gt;引用&lt;/blockquote&gt;</code>、
                      <code>- 列表项</code>
                    </div>
                  </div>
                </Form.Item>
            </>
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
                label="消息格式"
              >
                <Select
                  value={messageFormat}
                  onChange={setMessageFormat}
                  style={{ width: '100%' }}
                >
                  <Option value="html">HTML</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="caption"
                label="媒体描述"
              >
                <div>
                  {/* Telegram 风格工具栏 */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    flexWrap: 'wrap', 
                    marginBottom: '8px', 
                    padding: '8px', 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '4px 4px 0 0',
                    background: '#f5f5f5'
                  }}>
                    <Button 
                      size="small" 
                      icon={<BoldOutlined />} 
                      onClick={() => insertHtml('bold', '粗体', 'caption')}
                      title="粗体"
                    />
                    <Button 
                      size="small" 
                      icon={<ItalicOutlined />} 
                      onClick={() => insertHtml('italic', '斜体', 'caption')}
                      title="斜体"
                    />
                    <Button 
                      size="small" 
                      icon={<UnderlineOutlined />} 
                      onClick={() => insertHtml('underline', '下划线', 'caption')}
                      title="下划线"
                    />
                    <Button 
                      size="small" 
                      icon={<StrikethroughOutlined />} 
                      onClick={() => insertHtml('strikethrough', '删除线', 'caption')}
                      title="删除线"
                    />
                    <Button 
                      size="small" 
                      icon={<LinkOutlined />} 
                      onClick={() => insertHtml('link', '链接文本', 'caption')}
                      title="链接"
                    />
                    <Button 
                      size="small" 
                      icon={<CodeOutlined />} 
                      onClick={() => insertHtml('code', '代码', 'caption')}
                      title="行内代码"
                    />
                    <Button 
                      size="small" 
                      icon={<AlignLeftOutlined />} 
                      onClick={() => insertHtml('pre', '预格式化文本', 'caption')}
                      title="预格式化文本"
                    />
                    <Button 
                      size="small" 
                      icon={<AlignLeftOutlined />} 
                      onClick={() => insertHtml('em', '强调文本', 'caption')}
                      title="强调"
                    />
                    <Button 
                      size="small" 
                      icon={<BoldOutlined />} 
                      onClick={() => insertHtml('strong', '加强语气', 'caption')}
                      title="加强语气"
                    />
                    <Button 
                      size="small" 
                      icon={<AlignLeftOutlined />} 
                      onClick={() => insertHtml('spoiler', '剧透内容', 'caption')}
                      title="剧透"
                    />
                    <Button 
                      size="small" 
                      icon={<AlignLeftOutlined />} 
                      onClick={() => insertHtml('quote', '引用', 'caption')}
                      title="引用"
                    />
                    <Button 
                      size="small" 
                      icon={<UnorderedListOutlined />} 
                      onClick={() => insertHtml('ul', '<li>列表项1</li><li>列表项2</li>', 'caption')}
                      title="无序列表"
                    />
                    <Button 
                      size="small" 
                      icon={<UnorderedListOutlined />} 
                      onClick={() => insertHtml('ol', '<li>列表项1</li><li>列表项2</li>', 'caption')}
                      title="有序列表"
                    />
                    <Button 
                      size="small" 
                      icon={<UnorderedListOutlined />} 
                      onClick={() => insertHtml('li', '列表项', 'caption')}
                      title="列表项"
                    />

                  </div>
                  
                  {/* 文本编辑器 */}
                  <Input.TextArea 
                    rows={4} 
                    placeholder="请输入媒体描述（支持 HTML 标签）"
                    value={captionHtmlContent}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCaptionHtmlContent(value);
                    }}
                    style={{ 
                      borderTop: 'none', 
                      borderRadius: '0 0 4px 4px'
                    }}
                  />
                  
                  {/* 语法提示 */}
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    支持的 HTML 标签: 
                    <code>&lt;b&gt;粗体&lt;/b&gt;</code>、
                    <code>&lt;i&gt;斜体&lt;/i&gt;</code>、
                    <code>&lt;u&gt;下划线&lt;/u&gt;</code>、
                    <code>&lt;s&gt;删除线&lt;/s&gt;</code>、
                    <code>&lt;a href="url"&gt;链接&lt;/a&gt;</code>、
                    <code>&lt;code&gt;代码&lt;/code&gt;</code>、
                    <code>&lt;blockquote&gt;引用&lt;/blockquote&gt;</code>、
                    <code>- 列表项</code>
                  </div>
                </div>
              </Form.Item>
            </>
          )}
          
          <Form.Item>
            <Space style={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => setMessageModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={sendingMessage}>
                发送消息
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 成员操作模态框 */}
      <Modal
        title={getActionTitle(memberAction)}
        open={memberModalVisible}
        onCancel={() => setMemberModalVisible(false)}
        footer={null}
        width={400}
      >
        <Form
          form={memberForm}
          layout="vertical"
          onFinish={handleMemberAction}
        >
          <Form.Item
            name="userId"
            label="用户ID"
            rules={[{ required: true, message: '请输入用户ID' }]}
          >
            <Input placeholder="请输入用户ID" />
          </Form.Item>
          {memberAction === 'mute' && (
            <Form.Item
              name="until_date"
              label="禁言时长（小时）"
              initialValue={1}
            >
              <InputNumber min={1} max={8760} style={{ width: '100%' }} />
            </Form.Item>
          )}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={actionLoading}>
                {memberAction === 'mute' ? '禁言' : 
                 memberAction === 'unmute' ? '解除禁言' : 
                 memberAction === 'kick' ? '踢人' : '解除封禁'}
              </Button>
              <Button onClick={() => setMemberModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 图片 URL 输入模态框 */}
      <Modal
        title="添加图片"
        open={imageModalVisible}
        onOk={handleConfirmInsertImage}
        onCancel={handleCancelInsertImage}
      >
        <Form layout="vertical">
          <Form.Item
            label="图片 URL"
            rules={[{ required: true, message: '请输入图片 URL' }]}
          >
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="请输入图片的完整 URL"
            />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 管理模态框 */}
      <Modal
        title="群组管理"
        open={manageModalVisible}
        onCancel={() => setManageModalVisible(false)}
        footer={null}
        width={600}
      >
        {currentGroup && (
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <h4>群组信息</h4>
              <p>群组ID: {currentGroup.groupId}</p>
              <p>群组名称: {currentGroup.groupName}</p>
              <p>群组类型: {currentGroup.groupType}</p>
              <p>权限级别: {currentGroup.level}</p>
              <p>添加者: {currentGroup.addedBy}</p>
              <p>状态: {currentGroup.disabled ? '已禁用' : '正常'}</p>
              <p>创建时间: {new Date(currentGroup.createTime).toLocaleString()}</p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <h4>基本操作</h4>
              <Space size="middle" style={{ marginBottom: '16px' }}>
                <Button
                  type={currentGroup.disabled ? 'primary' : 'default'}
                  icon={currentGroup.disabled ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                  onClick={() => {
                    handleToggleDisable(currentGroup.id, currentGroup.disabled);
                  }}
                >
                  {currentGroup.disabled ? '启用' : '禁用'}
                </Button>
                <Button
                  type="primary"
                  icon={<MessageOutlined />}
                  onClick={() => {
                    setCurrentGroupId(currentGroup.groupId);
                    handleOpenMessageModal(currentGroup.groupId);
                  }}
                >
                  发布消息
                </Button>
              </Space>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <h4>成员管理</h4>
              <Space size="middle" style={{ marginBottom: '16px' }}>
                <Button
                  icon={<AudioMutedOutlined />}
                  onClick={() => {
                    setCurrentGroupId(currentGroup.groupId);
                    handleOpenMemberModal(currentGroup.groupId, 'mute');
                  }}
                >
                  禁言成员
                </Button>
                <Button
                  icon={<TeamOutlined />}
                  onClick={() => {
                    setCurrentGroupId(currentGroup.groupId);
                    handleOpenMemberModal(currentGroup.groupId, 'kick');
                  }}
                >
                  踢出成员
                </Button>
              </Space>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <h4>主播管理</h4>
              <Button
                icon={<UserOutlined />}
                onClick={() => {
                  setCurrentGroupId(currentGroup.groupId);
                  handleFollowVtb(currentGroup.groupId);
                }}
              >
                关注主播
              </Button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <h4>解析设置</h4>
              <Checkbox
                checked={isDyParseEnabled}
                onChange={() => handleToggleDyParse(currentGroup.groupId)}
              >
                启用抖音解析
              </Checkbox>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                开启后，该群组将被添加到 DY_JX_GROUPS 设置中，用于抖音解析相关功能
              </p>
              <Checkbox
                checked={isBiliParseEnabled}
                onChange={() => handleToggleBiliParse(currentGroup.groupId)}
                style={{ marginTop: '16px' }}
              >
                启用B站解析
              </Checkbox>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                开启后，该群组将被添加到 BILI_JX_GROUPS 设置中，用于B站视频解析相关功能
              </p>
            </div>
            
            <div style={{ marginTop: '24px' }}>
              <h4>危险操作</h4>
              <Popconfirm
                title="确定要删除这个群组吗？"
                onConfirm={() => {
                  handleDelete(currentGroup.id);
                }}
                okText="确认删除"
                cancelText="取消"
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                >
                  删除群组
                </Button>
              </Popconfirm>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default BotGroups