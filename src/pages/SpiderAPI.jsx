import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Form, Input, Select, Modal, message, Spin, Tabs, Switch, Row, Col, Tag, Space, Popconfirm, Divider, Alert, Statistic } from 'antd'
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ApiOutlined, FileTextOutlined, ThunderboltOutlined, CodeOutlined } from '@ant-design/icons'
import Editor from '@monaco-editor/react'
import api from '../utils/api'
import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'

const { Option } = Select
const { TabPane } = Tabs

const SpiderAPI = () => {
  const [configs, setConfigs] = useState([])
  const [files, setFiles] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [activeTabKey, setActiveTabKey] = useState('configs')
  const [formLoading, setFormLoading] = useState(false)
  const [reloadLoading, setReloadLoading] = useState(false)
  const [isCodeModalVisible, setIsCodeModalVisible] = useState(false)
  const [editingFile, setEditingFile] = useState(null)
  const [codeContent, setCodeContent] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeChanged, setCodeChanged] = useState(false)
  const [saveCodeLoading, setSaveCodeLoading] = useState(false)
  const [parsedEndpoints, setParsedEndpoints] = useState([])
  const [selectedLog, setSelectedLog] = useState(null)
  const [isLogModalVisible, setIsLogModalVisible] = useState(false)
  const [testLoading, setTestLoading] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [testModalVisible, setTestModalVisible] = useState(false)
  const [testEndpoint, setTestEndpoint] = useState(null)
  const [pathParams, setPathParams] = useState({})

  const [form] = Form.useForm()

  useEffect(() => {
    fetchConfigs()
    fetchFiles()
  }, [])

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/spider-api/configs')
      if (response.data.success) {
        setConfigs(response.data.data)
        setStats(response.data.stats)
      }
    } catch (error) {
      message.error('获取配置列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFiles = async () => {
    try {
      const response = await api.get('/api/spider-api/files')
      if (response.data.success) {
        setFiles(response.data.data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const fetchLogs = async () => {
    setLogsLoading(true)
    try {
      const response = await api.get('/api/spider-api/logs?limit=100')
      if (response.data.success) {
        setLogs(response.data.data)
      }
    } catch (error) {
      message.error('获取日志失败')
      console.error(error)
    } finally {
      setLogsLoading(false)
    }
  }

  const handleTabChange = (key) => {
    setActiveTabKey(key)
    if (key === 'logs') {
      fetchLogs()
    }
  }

  const handleAddConfig = () => {
    setEditingConfig(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEditConfig = (record) => {
    setEditingConfig(record)
    form.setFieldsValue({
      name: record.name,
      file_name: record.file_name,
      title: record.title,
      subtitle: record.subtitle,
      category: record.category,
      description: record.description,
      is_enabled: record.is_enabled === 1,
      require_auth: record.require_auth === 1,
      require_admin: record.require_admin === 1,
      cache_enabled: record.cache_enabled === 1,
      cache_ttl: record.cache_ttl,
      rate_limit_enabled: record.rate_limit_enabled === 1,
      rate_limit_count: record.rate_limit_count
    })
    setIsModalVisible(true)
  }

  const handleSaveConfig = async (values) => {
    setFormLoading(true)
    try {
      const payload = {
        ...values,
        is_enabled: values.is_enabled ? 1 : 0,
        require_auth: values.require_auth ? 1 : 0,
        require_admin: values.require_admin ? 1 : 0,
        cache_enabled: values.cache_enabled ? 1 : 0,
        rate_limit_enabled: values.rate_limit_enabled ? 1 : 0
      }

      if (editingConfig) {
        await api.put(`/api/spider-api/config/${editingConfig.id}`, payload)
        message.success('配置更新成功')
      } else {
        await api.post('/api/spider-api/config', payload)
        message.success('配置添加成功')
      }

      setIsModalVisible(false)
      form.resetFields()
      fetchConfigs()
    } catch (error) {
      message.error(editingConfig ? '更新配置失败' : '添加配置失败')
      console.error(error)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteConfig = async (id) => {
    try {
      await api.delete(`/api/spider-api/config/${id}`)
      message.success('配置删除成功')
      fetchConfigs()
    } catch (error) {
      message.error('删除配置失败')
      console.error(error)
    }
  }

  const handleToggleEnabled = async (record) => {
    try {
      await api.put(`/api/spider-api/config/${record.id}`, {
        is_enabled: record.is_enabled ? 0 : 1
      })
      message.success(`已${record.is_enabled ? '禁用' : '启用'}`)
      fetchConfigs()
    } catch (error) {
      message.error('更新状态失败')
      console.error(error)
    }
  }

  const handleReloadSpider = async (fileName) => {
    setReloadLoading(true)
    try {
      await api.post(`/api/spider-api/reload/${fileName}`)
      message.success('爬虫重载成功')
      fetchConfigs()
    } catch (error) {
      message.error('重载失败')
      console.error(error)
    } finally {
      setReloadLoading(false)
    }
  }

  const handleReloadAll = async () => {
    setReloadLoading(true)
    try {
      await api.post('/api/spider-api/reload-all')
      message.success('全部爬虫重载成功')
      fetchConfigs()
    } catch (error) {
      message.error('重载失败')
      console.error(error)
    } finally {
      setReloadLoading(false)
    }
  }

  const handleDiscoverSpiders = async () => {
    setReloadLoading(true)
    try {
      const response = await api.post('/api/spider-api/discover')
      if (response.data.success) {
        const { added, skipped, failed } = response.data
        let msg = ''
        if (added.length > 0) msg += `添加了 ${added.length} 个: ${added.join(', ')}`
        if (skipped.length > 0) msg += (msg ? '；' : '') + `跳过已存在的 ${skipped.length} 个`
        if (failed.length > 0) msg += (msg ? '；' : '') + `失败 ${failed.length} 个`
        message.success(msg || '没有发现新的爬虫文件')
        fetchConfigs()
        fetchFiles()
      }
    } catch (error) {
      message.error('发现爬虫失败')
      console.error(error)
    } finally {
      setReloadLoading(false)
    }
  }

  const handleClearLogs = async (days) => {
    try {
      await api.delete('/api/spider-api/logs', { data: { days } })
      message.success(`已删除 ${days} 天前的日志`)
      fetchLogs()
    } catch (error) {
      message.error('删除日志失败')
      console.error(error)
    }
  }

  const handleEditCode = async (fileName) => {
    setCodeLoading(true)
    handleOpenCodeModal(fileName)
    try {
      const response = await api.get(`/api/spider-api/code/${fileName}`)
      if (response.data.success) {
        handleCodeLoaded(response.data.data.content)
      }
    } catch (error) {
      message.error('读取代码失败')
      console.error(error)
      setIsCodeModalVisible(false)
    } finally {
      setCodeLoading(false)
    }
  }

  const parseEndpoints = (code) => {
    const endpoints = []
    const methodRegex = /router\.(get|post|put|delete|patch|head|options)\s*\(\s*['"]([^'"]+)['"]/gi
    let match
    while ((match = methodRegex.exec(code)) !== null) {
      const method = match[1].toUpperCase()
      const path = match[2]
      endpoints.push({ method, path })
    }
    return endpoints
  }

  const handleSaveCode = async () => {
    if (!codeChanged) {
      setIsCodeModalVisible(false)
      return
    }
    setSaveCodeLoading(true)
    try {
      await api.put(`/api/spider-api/code/${editingFile}`, { content: codeContent })
      message.success('代码保存成功')
      setIsCodeModalVisible(false)
      setCodeChanged(false)
      fetchConfigs()
    } catch (error) {
      message.error('保存代码失败')
      console.error(error)
    } finally {
      setSaveCodeLoading(false)
    }
  }

  const extractPathParams = (path) => {
    const params = []
    const paramRegex = /:([a-zA-Z_]+)/g
    let match
    while ((match = paramRegex.exec(path)) !== null) {
      params.push(match[1])
    }
    return params
  }

  const handleTestEndpoint = (endpoint) => {
    const params = extractPathParams(endpoint.path)
    setPathParams(params.reduce((acc, p) => ({ ...acc, [p]: '' }), {}))
    setTestResult(null)
    setTestEndpoint(endpoint)
    setTestModalVisible(true)
  }

  const executeTest = async () => {
    if (!testEndpoint) return

    let path = testEndpoint.path
    Object.keys(pathParams).forEach(key => {
      path = path.replace(`:${key}`, pathParams[key] || 'test')
    })

    const fileName = editingFile?.replace('.js', '')
    const url = `${apiBaseUrl}/spider-api/${fileName}${path}`
    setTestLoading(true)
    try {
      const response = await axios.get(url)
      setTestResult({ success: true, data: response.data })
    } catch (error) {
      setTestResult({ success: false, error: error.response?.data || error.message })
    } finally {
      setTestLoading(false)
    }
  }

  const handleOpenCodeModal = (fileName) => {
    setEditingFile(fileName)
    setIsCodeModalVisible(true)
    setCodeChanged(false)
    setParsedEndpoints([])
  }

  const handleCodeLoaded = (content) => {
    setCodeContent(content)
    const endpoints = parseEndpoints(content)
    setParsedEndpoints(endpoints)
  }

  const configColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { 
      title: '名称', 
      dataIndex: 'name', 
      key: 'name',
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          {record.loaded ? (
            <Tag color="green" icon={<ThunderboltOutlined />}>已加载</Tag>
          ) : (
            <Tag color="orange">未加载</Tag>
          )}
        </Space>
      )
    },
    { title: '文件', dataIndex: 'file_name', key: 'file_name' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    {
      title: '权限',
      key: 'permissions',
      render: (_, record) => (
        <Space>
          {record.require_auth === 1 && <Tag color="blue">需登录</Tag>}
          {record.require_admin === 1 && <Tag color="purple">需管理员</Tag>}
          {record.require_auth === 0 && record.require_admin === 0 && <Tag>公开</Tag>}
        </Space>
      )
    },
    {
      title: '限流',
      key: 'rate_limit',
      render: (_, record) => (
        record.rate_limit_enabled ? `${record.rate_limit_count}/分钟` : '-'
      )
    },
    {
      title: '缓存',
      key: 'cache',
      render: (_, record) => (
        record.cache_enabled ? `${record.cache_ttl}秒` : '-'
      )
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (value, record) => (
        <Switch 
          checked={value === 1} 
          onChange={() => handleToggleEnabled(record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<ReloadOutlined />} 
            onClick={() => handleReloadSpider(record.file_name)}
            loading={reloadLoading}
          >
            重载
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEditConfig(record)}
          />
          <Popconfirm
            title="确认删除"
            description="确定要删除此配置吗？"
            onConfirm={() => handleDeleteConfig(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  const fileColumns = [
    { title: '文件名', dataIndex: 'fileName', key: 'fileName' },
    { title: '模块名', dataIndex: 'name', key: 'moduleName', render: (text, record) => record.moduleInfo?.name || '-' },
    { title: '标题', dataIndex: 'title', key: 'moduleTitle', render: (text, record) => record.moduleInfo?.title || '-' },
    { title: '分类', dataIndex: 'category', key: 'moduleCategory', render: (text, record) => record.moduleInfo?.category || '-' },
    { title: '大小', dataIndex: 'size', key: 'size', render: (size) => size ? `${(size / 1024).toFixed(2)} KB` : '-' },
    { 
      title: '状态', 
      key: 'status',
      render: (_, record) => (
        record.config ? (
          record.config.is_enabled ? (
            <Tag color="green">已配置-启用</Tag>
          ) : (
            <Tag color="orange">已配置-禁用</Tag>
          )
        ) : (
          <Tag color="red">未配置</Tag>
        )
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<CodeOutlined />} 
            onClick={() => handleEditCode(record.fileName)}
          >
            编辑代码
          </Button>
          {record.config ? (
            <Button type="link" onClick={() => handleEditConfig(record.config)}>编辑</Button>
          ) : (
            <Button type="link" onClick={() => {
              form.setFieldsValue({
                name: record.moduleInfo?.name || record.name,
                file_name: record.name,
                title: record.moduleInfo?.title || '',
                subtitle: record.moduleInfo?.subtitle || '',
                category: record.moduleInfo?.category || ''
              })
              setIsModalVisible(true)
            }}>添加</Button>
          )}
        </Space>
      )
    }
  ]

  const logColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '爬虫ID', dataIndex: 'spider_id', key: 'spider_id', width: 80 },
    { title: '接口', dataIndex: 'endpoint', key: 'endpoint' },
    { title: '结果码', dataIndex: 'result_code', key: 'result_code', width: 80, render: (text) => (
      <Tag color={text === 200 ? 'green' : text === 404 ? 'orange' : 'red'}>
        {text}
      </Tag>
    )},
    { 
      title: '消息', 
      dataIndex: 'result_message', 
      key: 'result_message',
      render: (text, record) => (
        <span 
          onClick={() => {
            setSelectedLog(record)
            setIsLogModalVisible(true)
          }}
          style={{ 
            cursor: 'pointer', 
            color: record.result_code !== 200 ? '#1890ff' : '#666',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
            maxWidth: '200px'
          }}
        >
          {text.length > 50 ? text.substring(0, 50) + '...' : text}
        </span>
      )
    },
    { title: 'IP', dataIndex: 'ip_address', key: 'ip_address', width: 120 },
    { title: '耗时', dataIndex: 'execution_time', key: 'execution_time', width: 80, render: (text) => `${text}ms` },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 180 }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总数" value={stats.total || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已启用" value={stats.enabled || 0} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已加载" value={stats.loaded || 0} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="未配置" value={stats.missingInDB?.length || 0} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {stats.missingInDB?.length > 0 && (
        <Alert
          message="发现未配置的爬虫文件"
          description={`以下文件存在于但未添加到数据库：${stats.missingInDB.join(', ')}`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title="爬虫接口管理"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleReloadAll}
              loading={reloadLoading}
            >
              重载全部
            </Button>
            <Button 
              icon={<FileTextOutlined />} 
              onClick={handleDiscoverSpiders}
              loading={reloadLoading}
            >
              发现爬虫
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddConfig}>
              添加配置
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTabKey} onChange={handleTabChange}>
          <TabPane tab={<span><ApiOutlined />接口配置</span>} key="configs">
            <Table 
              columns={configColumns} 
              dataSource={configs} 
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab={<span><FileTextOutlined />文件列表</span>} key="files">
            <Table 
              columns={fileColumns} 
              dataSource={files} 
              rowKey="fileName"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab={<span><FileTextOutlined />调用日志</span>} key="logs">
            <Space style={{ marginBottom: 16 }}>
              <Button onClick={() => fetchLogs()}>刷新</Button>
              <Popconfirm
                title="确认清理"
                description="确定要清理旧日志吗？"
                onConfirm={() => handleClearLogs(7)}
              >
                <Button>清理7天前</Button>
              </Popconfirm>
              <Popconfirm
                title="确认清理"
                description="确定要清理所有日志吗？"
                onConfirm={() => handleClearLogs(0)}
              >
                <Button danger>清理全部</Button>
              </Popconfirm>
            </Space>
            <Table 
              columns={logColumns} 
              dataSource={logs} 
              rowKey="id"
              loading={logsLoading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingConfig ? '编辑配置' : '添加配置'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveConfig}
          initialValues={{
            is_enabled: true,
            require_auth: false,
            require_admin: false,
            cache_enabled: true,
            cache_ttl: 300,
            rate_limit_enabled: false,
            rate_limit_count: 60
          }}
        >
          <Divider>基本信息</Divider>
          
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="如：91影视" />
          </Form.Item>

          <Form.Item
            name="file_name"
            label="文件名"
            rules={[{ required: true, message: '请输入文件名' }]}
            extra="对应 spiders 目录下的 .js 文件名（不含扩展名）"
          >
            <Input placeholder="如：91porn" disabled={!!editingConfig} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label="标题">
                <Input placeholder="显示标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="subtitle" label="副标题">
                <Input placeholder="副标题" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="category" label="分类">
            <Input placeholder="如：视频、直播、图片" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="接口描述" />
          </Form.Item>

          <Divider>访问控制</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="is_enabled" label="启用状态" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="require_auth" label="需要登录" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="require_admin" label="需要管理员" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Divider>性能设置</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cache_enabled" label="启用缓存" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cache_ttl" label="缓存时间（秒）">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="rate_limit_enabled" label="启用限流" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="rate_limit_count" label="限流次数（次/分钟）">
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={formLoading}>
                {editingConfig ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`编辑代码 - ${editingFile}`}
        open={isCodeModalVisible}
        onCancel={() => {
          if (codeChanged) {
            Modal.confirm({
              title: '确认离开',
              content: '有未保存的更改，确定要离开吗？',
              onOk: () => {
                setIsCodeModalVisible(false)
                setCodeChanged(false)
              }
            })
          } else {
            setIsCodeModalVisible(false)
          }
        }}
        footer={
          <Space>
            <Button onClick={() => setIsCodeModalVisible(false)}>取消</Button>
            <Button type="primary" loading={saveCodeLoading} onClick={handleSaveCode}>
              保存
            </Button>
          </Space>
        }
        width={1200}
      >
        {codeLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin tip="加载中..." />
          </div>
        ) : (
          <Tabs defaultActiveKey="endpoints">
            <TabPane tab={<span><ApiOutlined />接口列表</span>} key="endpoints">
              <div style={{ padding: 16, overflowX: 'auto' }}>
                {parsedEndpoints.length > 0 ? (
                  <>
                    <p style={{ marginBottom: 16 }}>访问地址：<code>{apiBaseUrl}/spider-api/{editingFile?.replace('.js', '')}/路由路径</code></p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
                      <thead>
                        <tr style={{ background: '#f0f0f0' }}>
                          <th style={{ padding: '8px 12px', border: '1px solid #ddd', textAlign: 'left', width: 80 }}>方法</th>
                          <th style={{ padding: '8px 12px', border: '1px solid #ddd', textAlign: 'left', width: 180 }}>路径</th>
                          <th style={{ padding: '8px 12px', border: '1px solid #ddd', textAlign: 'left' }}>完整URL</th>
                          <th style={{ padding: '8px 12px', border: '1px solid #ddd', textAlign: 'center', width: 80 }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedEndpoints.map((ep, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>
                              <Tag color={ep.method === 'GET' ? 'blue' : ep.method === 'POST' ? 'green' : 'orange'}>
                                {ep.method}
                              </Tag>
                            </td>
                            <td style={{ padding: '8px 12px', border: '1px solid #ddd', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.path}</td>
                            <td style={{ padding: '8px 12px', border: '1px solid #ddd', fontFamily: 'monospace', color: '#1890ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {apiBaseUrl}/spider-api/{editingFile?.replace('.js', '')}{ep.path}
                            </td>
                            <td style={{ padding: '8px 12px', border: '1px solid #ddd', textAlign: 'center' }}>
                              <Button size="small" type="link" onClick={() => handleTestEndpoint(ep)}>测试</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <Alert message="未解析到接口" description="当前文件中未找到 router.get/post 等路由定义" type="info" showIcon />
                )}
              </div>
            </TabPane>
            <TabPane tab={<span><CodeOutlined />代码编辑</span>} key="code">
              <Editor
                height="500px"
                defaultLanguage="javascript"
                value={codeContent}
                onChange={(value) => {
                  setCodeContent(value || '')
                  setCodeChanged(true)
                }}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  fontLigatures: true,
                  automaticLayout: true,
                }}
              />
            </TabPane>
          </Tabs>
        )}
      </Modal>

      <Modal
        title="测试接口"
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        footer={null}
        width={700}
      >
        {testEndpoint && (
          <div style={{ padding: 16 }}>
            <Alert
              message={`${testEndpoint.method} ${apiBaseUrl}/spider-api/${editingFile?.replace('.js', '')}${testEndpoint.path}`}
              type="info"
              style={{ marginBottom: 16, fontFamily: 'monospace' }}
            />
            
            {extractPathParams(testEndpoint.path).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4>路径参数：</h4>
                <Row gutter={16}>
                  {extractPathParams(testEndpoint.path).map(param => (
                    <Col span={12} key={param}>
                      <Form.Item label={param}>
                        <Input
                          value={pathParams[param]}
                          onChange={(e) => setPathParams({ ...pathParams, [param]: e.target.value })}
                          placeholder={`请输入 ${param}`}
                        />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
            
            <Button type="primary" onClick={executeTest} loading={testLoading} style={{ marginBottom: 16 }}>
              发送请求
            </Button>
            
            {testResult && (
              <div>
                <h4>响应结果：</h4>
                <pre style={{
                  background: testResult.success ? '#f6ffed' : '#fff2f0',
                  padding: 16,
                  borderRadius: 4,
                  maxHeight: 300,
                  overflow: 'auto',
                  fontSize: 12,
                  border: `1px solid ${testResult.success ? '#b7eb8f' : '#ffccc7'}`
                }}>
                  {JSON.stringify(testResult.success ? testResult.data : testResult.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="日志详情"
        open={isLogModalVisible}
        onCancel={() => setIsLogModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedLog && (
          <div style={{ padding: '16px' }}>
            <div className="log-detail">
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 'bold', marginRight: 8 }}>ID:</span>
                <span>{selectedLog.id}</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 'bold', marginRight: 8 }}>爬虫ID:</span>
                <span>{selectedLog.spider_id}</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 'bold', marginRight: 8 }}>接口:</span>
                <span style={{ fontFamily: 'monospace', color: '#1890ff' }}>{selectedLog.endpoint}</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 'bold', marginRight: 8 }}>结果码:</span>
                <Tag color={selectedLog.result_code === 200 ? 'green' : selectedLog.result_code === 404 ? 'orange' : 'red'}>
                  {selectedLog.result_code}
                </Tag>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 'bold', marginRight: 8 }}>消息:</span>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, color: selectedLog.result_code !== 200 ? '#ff4d4f' : '#666' }}>
                  {selectedLog.result_message}
                </pre>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 'bold', marginRight: 8 }}>参数:</span>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, fontFamily: 'monospace' }}>
                  {selectedLog.params ? JSON.stringify(JSON.parse(selectedLog.params), null, 2) : '{}'}
                </pre>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 'bold', marginRight: 8 }}>IP:</span>
                <span>{selectedLog.ip_address}</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 'bold', marginRight: 8 }}>用户ID:</span>
                <span>{selectedLog.user_id || '未登录'}</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 'bold', marginRight: 8 }}>耗时:</span>
                <span>{selectedLog.execution_time}ms</span>
              </div>
              <div>
                <span style={{ fontWeight: 'bold', marginRight: 8 }}>时间:</span>
                <span>{selectedLog.created_at}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SpiderAPI