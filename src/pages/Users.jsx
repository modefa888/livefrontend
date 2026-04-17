import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Spin, Result, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined, LockOutlined } from '@ant-design/icons'
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

  // 根据权限级别获取行的样式
  const getRowStyle = (record) => {
    if (record.permissionLevel === 3) {
      return { backgroundColor: '#f3e5f5' }; // 淡紫色 - 超级管理员
    } else if (record.permissionLevel === 2) {
      return { backgroundColor: '#e3f2fd' }; // 淡蓝色 - 管理员
    } else if (record.permissionLevel === 0) {
      return { backgroundColor: '#ffebee' }; // 淡红色 - 拉黑用户
    }
    return {}; // 普通用户 - 无背景色
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId'
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: '来源ID',
      dataIndex: 'fromId',
      key: 'fromId'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role'
    },
    {
      title: '权限级别',
      dataIndex: 'permissionLevel',
      key: 'permissionLevel',
      render: (level) => (
        <span title={level === 3 ? '超级管理员 - 拥有所有权限' : level === 2 ? '管理员 - 拥有所有权限' : level === 1 ? '普通用户 - 拥有基本权限' : '拉黑用户 - 无权限'}>
          {level === 3 ? '超级管理员' : level === 2 ? '管理员' : level === 1 ? '普通用户' : '拉黑用户'}
        </span>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (time) => formatDate(time)
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
            style={{ marginRight: 8 }}
          >
            编辑
          </Button>
          {record.permissionLevel !== 2 && record.permissionLevel !== 3 && (
            <Button
              type={record.permissionLevel === 0 ? 'link' : 'link'}
              danger={record.permissionLevel !== 0}
              onClick={() => handleBlock(record)}
              style={{ marginRight: 8 }}
            >
              {record.permissionLevel === 0 ? '取消拉黑' : '拉黑'}
            </Button>
          )}
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2>用户管理</h2>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              添加用户
            </Button>
          </div>
          
          <Card className="card" style={{ marginBottom: 16, padding: '8px 16px' }} size="small">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <Input
                placeholder="用户名"
                prefix={<UserOutlined />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ width: 180 }}
                size="small"
                onPressEnter={fetchUsers}
              />
              <Select
                placeholder="权限级别"
                value={searchPermission}
                onChange={(value) => setSearchPermission(value)}
                style={{ width: 110 }}
                size="small"
                allowClear
              >
                <Option value="3">超级管理员</Option>
                <Option value="2">管理员</Option>
                <Option value="1">普通用户</Option>
                <Option value="0">拉黑用户</Option>
              </Select>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={fetchUsers}
                loading={loading}
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
            title={editingUser ? '编辑用户' : '添加用户'}
            open={modalVisible}
            onCancel={closeModal}
            footer={null}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: !editingUser, message: '请输入密码' }]}
              >
                <Input.Password placeholder={editingUser ? '留空表示不修改密码' : '请输入密码'} />
              </Form.Item>

              <Form.Item
                name="type"
                label="类型"
              >
                <Input placeholder="用户类型" disabled={!!editingUser} />
              </Form.Item>

              <Form.Item
                name="fromId"
                label="来源ID"
              >
                <Input placeholder="来源ID" disabled={!!editingUser} />
              </Form.Item>

              <Form.Item
                name="role"
                label="角色"
              >
                <Input placeholder="角色" disabled={!!editingUser} />
              </Form.Item>

              <Form.Item
                name="permissionLevel"
                label="权限级别"
                rules={[{ required: true, message: '请选择权限级别' }]}
              >
                <Select placeholder="选择权限级别">
                  <Option value={1}>普通用户</Option>
                  <Option value={2}>管理员</Option>
                  <Option value={3}>超级管理员</Option>
                  <Option value={0}>拉黑用户</Option>
                </Select>
              </Form.Item>

              <Form.Item style={{ textAlign: 'right' }}>
                <Button onClick={closeModal} style={{ marginRight: 8 }}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingUser ? '更新' : '添加'}
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