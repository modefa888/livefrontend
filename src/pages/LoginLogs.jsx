import React, { useState, useEffect } from 'react'
import { Table, Card, Input, Select, Button, Spin, message, Space } from 'antd'
import { SearchOutlined, UserOutlined, EnvironmentOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { Option } = Select

function LoginLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useState({
    username: '',
    status: undefined,
    page: 1,
    limit: 10
  })
  const [total, setTotal] = useState(0)

  // 加载登录日志
  useEffect(() => {
    fetchLoginLogs()
  }, [searchParams])

  const fetchLoginLogs = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/login-logs', {
        params: searchParams,
      })
      setLogs(response.data.logs)
      setTotal(response.data.pagination.total)
    } catch (error) {
      message.error('获取登录日志失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理搜索
  const handleSearch = () => {
    setSearchParams(prev => ({ ...prev, page: 1 }))
  }

  // 处理分页
  const handlePaginationChange = (page, pageSize) => {
    setSearchParams(prev => ({
      ...prev,
      page,
      limit: pageSize
    }))
  }

  // 格式化时间
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN')
  }

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
      key: 'username',
      render: (username) => (
        <span><UserOutlined /> {username}</span>
      )
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip) => (
        <span><EnvironmentOutlined /> {ip}</span>
      )
    },
    {
      title: '用户代理',
      dataIndex: 'userAgent',
      key: 'userAgent',
      ellipsis: true
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      render: (time) => (
        <span>{formatDate(time)}</span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        status === 1 ? 
          <span style={{ color: '#52c41a' }}><CheckCircleOutlined /> 成功</span> : 
          <span style={{ color: '#ff4d4f' }}><CloseCircleOutlined /> 失败</span>
      )
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>登录记录</h2>
      
      <Card className="card" style={{ marginBottom: 16, padding: '8px 16px' }} size="small">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="用户名"
            prefix={<UserOutlined />}
            value={searchParams.username}
            onChange={(e) => setSearchParams(prev => ({ ...prev, username: e.target.value }))}
            style={{ width: 180 }}
            size="small"
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="登录状态"
            style={{ width: 110 }}
            value={searchParams.status}
            onChange={(status) => setSearchParams(prev => ({ ...prev, status }))}
            size="small"
            allowClear
          >
            <Option value={1}>成功</Option>
            <Option value={0}>失败</Option>
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
          dataSource={logs}
          rowKey="id"
          pagination={{
            total,
            pageSize: searchParams.limit,
            current: searchParams.page,
            onChange: handlePaginationChange,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      )}
    </div>
  )
}

export default LoginLogs