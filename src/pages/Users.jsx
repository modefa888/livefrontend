import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Spin, Result, Card, Tag } from 'antd'
import api from '../utils/api'

const { Option } = Select

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form] = Form.useForm()
  const [user, setUser] = useState(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [permissionChecked, setPermissionChecked] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchPermission, setSearchPermission] = useState(undefined)

  // 检查用户权限
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await api.get('/api/auth/me')
        setUser(response.data)
        setHasPermission(response.data.permissionLevel >= 2)
      } catch (error) {
        message.error('获取用户信息失败')
        setHasPermission(false)
      } finally {
        setPermissionChecked(true)
      }
    }
    
    checkPermission()
  }, [])

  // 加载用户列表
  useEffect(() => {
    if (hasPermission) {
      fetchUsers()
    } else {
      setLoading(false)
    }
  }, [hasPermission])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (searchKeyword) params.keyword = searchKeyword
      if (searchPermission !== undefined && searchPermission !== null && searchPermission !== '') {
        params.permissionLevel = searchPermission
      }
      
      const response = await api.get('/api/users', { params })
      setUsers(response.data)
    } catch (error) {
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 打开添加/编辑模态框
  const openModal = (user = null) => {
    setEditingUser(user)
    form.setFieldsValue(user || {})
    setModalVisible(true)
  }

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false)
    setEditingUser(null)
    form.resetFields()
  }

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        // 更新用户
        await api.put(`/api/users/${editingUser.id}`, values)
        message.success('用户更新成功')
      } else {
        // 添加用户
        await api.post('/api/users', values)
        message.success('用户添加成功')
      }
      closeModal()
      fetchUsers()
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 删除用户
  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个用户吗？',
      onOk: async () => {
        try {
          await api.delete(`/api/users/${id}`)
          message.success('用户删除成功')
          fetchUsers()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  // 拉黑/取消拉黑用户
  const handleBlock = (user) => {
    const isBlocked = user.permissionLevel === 0
    const newPermissionLevel = isBlocked ? 1 : 0
    const action = isBlocked ? '取消拉黑' : '拉黑'
    
    Modal.confirm({
      title: `确认${action}`,
      content: `确定要${action}这个用户吗？`,
      onOk: async () => {
        try {
          await api.put(`/api/users/${user.id}`, 
            { permissionLevel: newPermissionLevel }
          )
          message.success(`用户${action}成功`)
          fetchUsers()
        } catch (error) {
          message.error(`${action}失败`)
        }
      }
    })
  }

  // 格式化时间为年月日时分秒格式
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 根据权限级别获取权限信息
  const getPermissionInfo = (level) => {
    switch (level) {
      case 3:
        return { label: '👑 超级管理员', color: 'purple' };
      case 2:
        return { label: '🛡️ 管理员', color: 'blue' };
      case 1:
        return { label: '👤 普通用户', color: 'green' };
      case 0:
        return { label: '🔒 拉黑用户', color: 'red' };
      default:
        return { label: '❓ 未知', color: 'default' };
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '🔢 ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      align: 'center'
    },
    {
      title: '🆔 用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 100,
      align: 'center'
    },
    {
      title: '👤 用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '📁 类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      align: 'center',
      render: (type) => <Tag color="cyan">{type || '-'}</Tag>
    },
    {
      title: '🏷️ 来源ID',
      dataIndex: 'fromId',
      key: 'fromId',
      width: 100,
      align: 'center'
    },
    {
      title: '🎭 角色',
      dataIndex: 'role',
      key: 'role',
      width: 80,
      align: 'center',
      render: (role) => <Tag color="orange">{role || '-'}</Tag>
    },
    {
      title: '⚡ 权限级别',
      dataIndex: 'permissionLevel',
      key: 'permissionLevel',
      width: 140,
      align: 'center',
      render: (level) => {
        const info = getPermissionInfo(level);
        return (
          <Tag color={info.color}>
            {info.label}
          </Tag>
        );
      }
    },
    {
      title: '📅 创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time) => formatDate(time)
    },
    {
      title: '⚙️ 操作',
      key: 'action',
      width: 180,
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Button
            size="small"
            onClick={() => openModal(record)}
            style={{ border: 'none', backgroundColor: 'transparent', padding: '4px 8px' }}
            title="编辑用户"
          >
            ✏️
          </Button>
          {record.permissionLevel !== 2 && record.permissionLevel !== 3 && (
            <Button
            size="small"
            onClick={() => handleBlock(record)}
            style={{ border: 'none', backgroundColor: 'transparent', padding: '4px 8px' }}
            title={record.permissionLevel === 0 ? '取消拉黑' : '拉黑用户'}
          >
              {record.permissionLevel === 0 ? '🔒' : '🔓'}
            </Button>
          )}
          <Button
            size="small"
            onClick={() => handleDelete(record.id)}
            style={{ border: 'none', backgroundColor: 'transparent', padding: '4px 8px' }}
            title="删除用户"
          >
            🗑️
          </Button>
        </div>
      )
    }
  ]

  return (
    <div>
      {!permissionChecked ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      ) : !hasPermission ? (
        <Result
          status="403"
          title="权限不足"
          subTitle="您没有权限访问用户管理页面"
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
              👥 用户管理 <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>· 共 {users.length} 位用户</span>
            </h2>
            <Button 
              type="primary" 
              onClick={() => openModal()}
              size="large"
              style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)' }}
            >
              ➕ 添加用户
            </Button>
          </div>
          
          <Card 
            className="card" 
            style={{ 
              marginBottom: 16, 
              padding: '12px 20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
            }} 
            size="small"
          >
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <Input
                placeholder="🔍 搜索用户名..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ width: 200, borderRadius: '8px' }}
                size="middle"
                onPressEnter={fetchUsers}
              />
              <Select
                placeholder="⚡ 选择权限"
                value={searchPermission}
                onChange={(value) => setSearchPermission(value)}
                style={{ width: 140, borderRadius: '8px' }}
                size="middle"
                allowClear
              >
                <Option value="3">👑 超级管理员</Option>
                <Option value="2">🛡️ 管理员</Option>
                <Option value="1">👤 普通用户</Option>
                <Option value="0">🔒 拉黑用户</Option>
              </Select>
              <Button
                type="primary"
                onClick={fetchUsers}
                loading={loading}
                size="middle"
                style={{ borderRadius: '8px' }}
              >
                🔎 搜索
              </Button>
            </div>
          </Card>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              <style>{`
                .row-super-admin td {
                  background-color: #f3e5f5 !important;
                }
                .row-admin td {
                  background-color: #e3f2fd !important;
                }
                .row-blocked td {
                  background-color: #ffebee !important;
                }
              `}</style>
              <Table columns={columns} dataSource={users} rowKey="id" rowClassName={(record) => {
                if (record.permissionLevel === 3) return 'row-super-admin';
                if (record.permissionLevel === 2) return 'row-admin';
                if (record.permissionLevel === 0) return 'row-blocked';
                return '';
              }} />
            </>
          )}

          <Modal
            title={editingUser ? '✏️ 编辑用户' : '➕ 添加用户'}
            open={modalVisible}
            onCancel={closeModal}
            footer={null}
            width={500}
            style={{ borderRadius: '12px' }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              style={{ padding: '16px 0' }}
            >
              <Form.Item
                name="username"
                label={<span>👤 用户名</span>}
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" style={{ borderRadius: '8px' }} />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span>🔑 密码</span>}
                rules={[{ required: !editingUser, message: '请输入密码' }]}
              >
                <Input.Password 
                  placeholder={editingUser ? '留空表示不修改密码' : '请输入密码'} 
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>

              <Form.Item
                name="type"
                label={<span>📁 类型</span>}
              >
                <Input 
                  placeholder="用户类型" 
                  disabled={!!editingUser} 
                  style={{ borderRadius: '8px', backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>

              <Form.Item
                name="fromId"
                label={<span>🏷️ 来源ID</span>}
              >
                <Input 
                  placeholder="来源ID" 
                  disabled={!!editingUser} 
                  style={{ borderRadius: '8px', backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>

              <Form.Item
                name="role"
                label={<span>🎭 角色</span>}
              >
                <Select 
                  placeholder="选择角色" 
                  disabled={!!editingUser}
                  style={{ borderRadius: '8px', backgroundColor: '#f5f5f5' }}
                >
                  <Option value="user">👤 user</Option>
                  <Option value="admin">🛡️ admin</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="permissionLevel"
                label={<span>⚡ 权限级别</span>}
                rules={[{ required: true, message: '请选择权限级别' }]}
              >
                <Select 
                  placeholder="选择权限级别" 
                  style={{ borderRadius: '8px' }}
                >
                  <Option value={1}>👤 普通用户</Option>
                  <Option value={2}>🛡️ 管理员</Option>
                  <Option value={3}>👑 超级管理员</Option>
                  <Option value={0}>🔒 拉黑用户</Option>
                </Select>
              </Form.Item>

              <Form.Item style={{ textAlign: 'right', marginTop: '20px' }}>
                <Button 
                  onClick={closeModal} 
                  style={{ marginRight: 8, borderRadius: '8px' }}
                >
                  ❌ 取消
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  style={{ borderRadius: '8px' }}
                >
                  {editingUser ? '✅ 更新' : '✅ 添加'}
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </div>
  )
}

export default Users