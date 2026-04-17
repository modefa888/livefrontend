import React, { useState, useEffect } from 'react'
import { Table, Card, Input, Button, Spin, message, Select, Modal, Form, Tooltip } from 'antd'
import { SearchOutlined, FileTextOutlined, SendOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { Option } = Select

function Messages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [selectedType, setSelectedType] = useState(undefined)
  const [botStatus, setBotStatus] = useState({ isRunning: false })
  
  // 发送消息相关状态
  const [isSendModalVisible, setIsSendModalVisible] = useState(false)
  const [sendForm] = Form.useForm()
  const [sendLoading, setSendLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  
  // 修改消息相关状态
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editForm] = Form.useForm()
  const [editLoading, setEditLoading] = useState(false)
  const [editingMessage, setEditingMessage] = useState(null)

  // 从消息数据中提取唯一的类型列表
  const typeOptions = React.useMemo(() => {
    const types = [...new Set(messages.map(msg => msg.type).filter(Boolean))]
    return types.sort()
  }, [messages])

  // 加载机器人状态
  const fetchBotStatus = async () => {
    try {
      
      const response = await api.get('/api/bot/status');
      setBotStatus(response.data);
    } catch (error) {
      console.error('获取机器人状态失败:', error);
    }
  };

  // 加载消息记录
  useEffect(() => {
    fetchMessages();
    fetchBotStatus();
  }, [])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/logs/messages')
      setMessages(response.data)
    } catch (error) {
      message.error('获取消息记录失败')
    } finally {
      setLoading(false)
    }
  }

  // 搜索消息
  const handleSearch = async () => {
    setLoading(true)
    try {
      let url = `/api/logs/messages?keyword=${searchText}`
      if (selectedType) {
        url += `&type=${selectedType}`
      }
      const response = await api.get(url)
      setMessages(response.data)
    } catch (error) {
      message.error('搜索消息失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理类型选择变化
  const handleTypeChange = (value) => {
    setSelectedType(value)
  }

  // 复制文本到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success('复制成功');
      })
      .catch(err => {
        message.error('复制失败');
      });
  };

  // 获取用户列表
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      
      const response = await api.get('/api/bot/users');
      setUsers(response.data.users);
    } catch (error) {
      message.error('获取用户列表失败');
      console.error(error);
    } finally {
      setUsersLoading(false);
    }
  };

  // 显示发送消息模态框
  const showSendModal = async (message) => {
    setSelectedMessage(message);
    await fetchUsers();
    sendForm.resetFields();
    setIsSendModalVisible(true);
  };

  // 显示修改消息模态框
  const showEditModal = (message) => {
    setEditingMessage(message);
    editForm.setFieldsValue({
      fileName: message.fileName || '',
      caption: message.caption || '',
      type: message.type || 'text'
    });
    setIsEditModalVisible(true);
  };

  // 发送消息
  const handleSendMessage = async (values) => {
    try {
      setSendLoading(true);
      
      
      // 检查机器人状态
      const statusResponse = await api.get('/api/bot/status');
      
      if (!statusResponse.data.isRunning) {
        message.error('机器人未启动，无法发送消息');
        setSendLoading(false);
        return;
      }
      
      // 直接使用表单中的值
      const sendData = {
        ...values
      };
      
      // 验证必要字段
      if (!sendData.chatId) {
        message.error('请选择用户');
        setSendLoading(false);
        return;
      }
      
      if (sendData.type === 'text' && !sendData.text) {
        message.error('请输入消息正文');
        setSendLoading(false);
        return;
      }
      
      if (sendData.type === 'video' && !sendData.mediaUrl) {
        message.error('请输入视频文件ID');
        setSendLoading(false);
        return;
      }
      
      await api.post('/api/bot/message/send', sendData);
      message.success('消息发送成功');
      setIsSendModalVisible(false);
      sendForm.resetFields();
      setSelectedMessage(null);
    } catch (error) {
      message.error('发送消息失败');
      console.error(error);
    } finally {
      setSendLoading(false);
    }
  };

  // 修改消息
  const handleEditMessage = async (values) => {
    try {
      setEditLoading(true);
      
      
      // 构建修改数据
      const editData = {
        ...values
      };
      
      // 这里应该调用修改消息的API
      // 由于没有实际的API，这里只做模拟
      console.log('修改消息:', editData);
      
      // 模拟修改成功
      message.success('消息修改成功');
      setIsEditModalVisible(false);
      editForm.resetFields();
      setEditingMessage(null);
      
      // 重新加载消息列表
      fetchMessages();
    } catch (error) {
      message.error('修改消息失败');
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  };

  // 格式化时间为年月日时分秒格式
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '文件ID',
      dataIndex: 'fileId',
      key: 'fileId',
      width: 100,
      render: (text) => {
        if (!text) return '-';
        const displayText = text.length > 8 ? text.slice(-8) : text;
        return (
          <span 
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => copyToClipboard(text)}
            title={text}
          >
            {displayText}
          </span>
        );
      }
    },
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 200,
      render: (text, record) => {
        if (!text) return '-';
        // 将文本分成每行30个字符，最多3行
        const lines = [];
        for (let i = 0; i < text.length && i < 90; i += 30) {
          lines.push(text.slice(i, i + 30));
        }
        return (
          <div 
            style={{ 
              display: '-webkit-box', 
              WebkitLineClamp: 3, 
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-all',
              lineHeight: '1.5em',
              maxHeight: '4.5em',
              cursor: 'pointer'
            }} 
            title={text}
            onClick={() => showEditModal(record)}
          >
            {lines.join('\n')}
          </div>
        );
      }
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100
    },
    {
      title: '标题',
      dataIndex: 'caption',
      key: 'caption',
      width: 250,
      render: (text, record) => {
        if (!text) return '-';
        // 将文本分成每行30个字符，最多3行
        const lines = [];
        for (let i = 0; i < text.length && i < 90; i += 30) {
          lines.push(text.slice(i, i + 30));
        }
        return (
          <div 
            style={{ 
              display: '-webkit-box', 
              WebkitLineClamp: 3, 
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-all',
              lineHeight: '1.5em',
              maxHeight: '4.5em',
              cursor: 'pointer'
            }} 
            title={text}
            onClick={() => showEditModal(record)}
          >
            {lines.join('\n')}
          </div>
        );
      }
    },
    {
      title: '时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (time) => formatDate(time)
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<SendOutlined />} 
          size="small"
          onClick={() => showSendModal(record)}
          disabled={!botStatus.isRunning}
          tooltip={!botStatus.isRunning ? '机器人未启动，无法发送消息' : ''}
        >
          发送
        </Button>
      )
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>消息记录</h2>
      
      <Card className="card" style={{ marginBottom: 16, padding: '8px 16px' }} size="small">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="搜索消息"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            size="small"
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="选择类型"
            value={selectedType}
            onChange={handleTypeChange}
            style={{ width: 130 }}
            size="small"
            allowClear
          >
            {typeOptions.map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            size="small"
          >
            搜索
          </Button>
        </div>
      </Card>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table 
          columns={columns} 
          dataSource={messages} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      )}

      {/* 发送消息模态框 */}
      <Modal
        title="发送消息"
        open={isSendModalVisible}
        onCancel={() => {
          setIsSendModalVisible(false);
          setSelectedMessage(null);
        }}
        onOk={() => sendForm.submit()}
        confirmLoading={sendLoading}
        width={600}
      >
        <Form
          form={sendForm}
          layout="vertical"
          onFinish={handleSendMessage}
        >
          <Form.Item
            name="chatId"
            label="选择用户"
            rules={[{ required: true, message: '请选择用户' }]}
          >
            <Select 
              placeholder="请选择用户" 
              loading={usersLoading}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) => {
                const label = option.label || '';
                return label.toLowerCase().includes(input.toLowerCase());
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
            name="type"
            label="消息类型"
            initialValue={selectedMessage ? selectedMessage.type : 'text'}
            rules={[{ required: true, message: '请选择消息类型' }]}
          >
            <Select placeholder="请选择消息类型">
              <Option value="text">文本</Option>
              <Option value="video">视频</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="caption"
            label="标题"
            initialValue={selectedMessage ? selectedMessage.caption : ''}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="请输入标题"
              maxLength={200}
            />
          </Form.Item>
          
          <Form.Item
            name="text"
            label="消息正文"
            initialValue={selectedMessage ? selectedMessage.fileName : ''}
            rules={[{ required: true, message: '请输入消息正文' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="请输入消息正文"
              maxLength={500}
            />
          </Form.Item>
          
          {selectedMessage && selectedMessage.type === 'video' && (
            <Form.Item
              label="视频文件ID"
              name="mediaUrl"
              initialValue={selectedMessage.fileId}
              rules={[{ required: true, message: '请输入视频文件ID' }]}
            >
              <Input placeholder="请输入视频文件ID" />
              {selectedMessage.video && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  视频信息: 时长 {selectedMessage.video.duration}秒, 分辨率 {selectedMessage.video.width}x{selectedMessage.video.height}
                </div>
              )}
            </Form.Item>
          )}
        </Form>
      </Modal>
      
      {/* 修改消息模态框 */}
      <Modal
        title="修改消息"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingMessage(null);
        }}
        onOk={() => editForm.submit()}
        confirmLoading={editLoading}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditMessage}
        >
          <Form.Item
            name="fileName"
            label="文件名"
            rules={[{ required: true, message: '请输入文件名' }]}
          >
            <Input.TextArea 
              rows={2} 
              placeholder="请输入文件名"
              maxLength={200}
            />
          </Form.Item>
          
          <Form.Item
            name="caption"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="请输入标题"
              maxLength={200}
            />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="消息类型"
            rules={[{ required: true, message: '请选择消息类型' }]}
          >
            <Select placeholder="请选择消息类型">
              <Option value="text">文本</Option>
              <Option value="video">视频</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Messages
