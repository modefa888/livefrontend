import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, message, Descriptions, Tag } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import api from '../utils/api'

const Profile = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [passwordForm] = Form.useForm()

  // 获取当前用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await api.get('/api/auth/me')
        setUser(response.data)
      } catch (error) {
        message.error('获取用户信息失败')
      }
    }

    fetchUserInfo()
  }, [])

  // 修改密码
  const handleChangePassword = async (values) => {
    setLoading(true)
    try {
      await api.put('/api/users/me/password', values)
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error) {
      message.error(error.response?.data?.message || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取权限级别标签
  const getPermissionLevelTag = (level) => {
    switch (level) {
      case 3:
        return <Tag color="purple">超级管理员</Tag>
      case 2:
        return <Tag color="red">管理员</Tag>
      case 1:
        return <Tag color="green">普通用户</Tag>
      case 0:
        return <Tag color="default">游客</Tag>
      default:
        return <Tag>未知</Tag>
    }
  }

  if (!user) {
    return <div>加载中...</div>
  }

  return (
    <div>
      <h2>个人信息</h2>
      
      <Card title="基本信息" style={{ marginBottom: 24 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="用户ID">{user.userId}</Descriptions.Item>
          <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
          <Descriptions.Item label="权限级别">
            {getPermissionLevelTag(user.permissionLevel)}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {user.createTime ? new Date(user.createTime).toLocaleString() : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="修改密码">
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          style={{ maxWidth: 400 }}
        >
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="当前密码" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                }
              })
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Profile