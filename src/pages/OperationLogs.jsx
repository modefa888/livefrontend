import React, { useState, useEffect } from 'react'
import { Table, Card, Input, Select, Button, Spin, message } from 'antd'
import { SearchOutlined, UserOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { Option } = Select

function OperationLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useState({
    username: '',
    operationType: undefined,
    targetType: undefined,
    page: 1,
    limit: 10
  })
  const [total, setTotal] = useState(0)

  // 加载操作日志
  useEffect(() => {
    fetchOperationLogs()
  }, [searchParams])

  const fetchOperationLogs = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/operation-logs', {
        params: searchParams})
      setLogs(response.data.logs)
      setTotal(response.data.pagination.total)
    } catch (error) {
      message.error('获取操作日志失败')
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

  // 获取操作类型图标
  const getOperationIcon = (operationType) => {
    switch (operationType) {
      case 'add':
        return <PlusOutlined style={{ color: '#52c41a' }} />
      case 'update':
        return <EditOutlined style={{ color: '#1890ff' }} />
      case 'delete':
        return <DeleteOutlined style={{ color: '#ff4d4f' }} />
      case 'login':
        return <CheckCircleOutlined style={{ color: '#1890ff' }} />
      case 'logout':
        return <CloseCircleOutlined style={{ color: '#faad14' }} />
      default:
        return null
    }
  }

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: '操作人',
      dataIndex: 'username',
      key: 'username',
      render: (username) => (
        <span><UserOutlined /> {username}</span>
      )
    },
    {
      title: '操作类型',
      dataIndex: 'operationType',
      key: 'operationType',
      render: (type) => (
        <span>
          {getOperationIcon(type)} {type === 'add' ? '添加' : type === 'update' ? '更新' : type === 'delete' ? '删除' : type === 'login' ? '登录' : type === 'logout' ? '登出' : type}
        </span>
      )
    },
    {
      title: '目标类型',
      dataIndex: 'targetType',
      key: 'targetType',
      render: (type) => (
        <span>{type === 'vtb' ? '主播' : type === 'user' ? '用户' : type === 'setting' ? '设置' : type}</span>
      )
    },
    {
      title: '目标ID',
      dataIndex: 'targetId',
      key: 'targetId'
    },
    {
      title: '目标名称',
      dataIndex: 'targetName',
      key: 'targetName'
    },
    {
      title: '操作时间',
      dataIndex: 'operationTime',
      key: 'operationTime',
      render: (time) => formatDate(time)
    },
    {
      title: '操作详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>操作记录</h2>
      
      <Card className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Input
            placeholder="用户名"
            prefix={<UserOutlined />}
            value={searchParams.username}
            onChange={(e) => setSearchParams(prev => ({ ...prev, username: e.target.value }))}
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="操作类型"
            style={{ width: 120 }}
            value={searchParams.operationType}
            onChange={(type) => setSearchParams(prev => ({ ...prev, operationType: type }))}
            allowClear
          >
            <Option value="add">添加</Option>
            <Option value="update">更新</Option>
            <Option value="delete">删除</Option>
            <Option value="login">登录</Option>
            <Option value="logout">登出</Option>
          </Select>
          <Select
            placeholder="目标类型"
            style={{ width: 120 }}
            value={searchParams.targetType}
            onChange={(type) => setSearchParams(prev => ({ ...prev, targetType: type }))}
            allowClear
          >
            <Option value="vtb">主播</Option>
            <Option value="user">用户</Option>
            <Option value="setting">设置</Option>
          </Select>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
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

export default OperationLogs