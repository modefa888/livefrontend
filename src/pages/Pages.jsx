import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Switch, message, Space, Tag, Tooltip, Tabs, Spin, List, Checkbox, Card, Row, Col, Statistic } from 'antd'
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ScanOutlined, ImportOutlined,
  FileTextOutlined, EyeFilled, GlobalOutlined, SafetyCertificateOutlined, ClockCircleOutlined
} from '@ant-design/icons'
import api from '../utils/api'
import Editor from '@monaco-editor/react'

const { TabPane } = Tabs

function Pages() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(null)
  const [fetchingPage, setFetchingPage] = useState(false)
  const [form] = Form.useForm()
  const [scanModalVisible, setScanModalVisible] = useState(false)
  const [unsavedFiles, setUnsavedFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [scanning, setScanning] = useState(false)
  const [importing, setImporting] = useState(false)
  const [scanStats, setScanStats] = useState(null)

  const fetchPages = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/pages')
      setPages(response.data)
    } catch (error) {
      message.error(error.response?.data?.error || '获取页面列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const openModal = async (page = null) => {
    setCurrentPage(page)
    if (page) {
      setFetchingPage(true)
      try {
        const response = await api.get(`/api/pages/${page.id}`)
        form.setFieldsValue({
          title: response.data.page.title,
          path: response.data.page.path,
          content: response.data.page.content,
          require_login: response.data.page.require_login,
          status: response.data.page.status
        })
      } catch (error) {
        message.error('获取页面详情失败')
      } finally {
        setFetchingPage(false)
      }
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setCurrentPage(null)
    form.resetFields()
  }

  const handleSubmit = async (values) => {
    setConfirmLoading(true)
    try {
      if (currentPage) {
        await api.put(`/api/pages/${currentPage.id}`, values)
        message.success('页面更新成功')
      } else {
        await api.post('/api/pages', values)
        message.success('页面创建成功')
      }
      closeModal()
      fetchPages()
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败')
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleDelete = (id, title) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除页面 "${title}" 吗？`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`/api/pages/${id}`)
          message.success('页面删除成功')
          fetchPages()
        } catch (error) {
          message.error(error.response?.data?.error || '删除失败')
        }
      }
    })
  }

  const scanLocalFiles = async () => {
    setScanning(true)
    try {
      const response = await api.get('/api/pages/scan-local-files')
      setUnsavedFiles(response.data.unsavedFiles)
      setScanStats({
        totalFiles: response.data.totalFiles,
        savedCount: response.data.savedCount,
        unsavedCount: response.data.unsavedCount
      })
      setSelectedFiles(response.data.unsavedFiles.map(f => f.filename))
      setScanModalVisible(true)
      if (response.data.unsavedCount === 0) {
        message.info('没有发现未保存的文件')
      }
    } catch (error) {
      message.error(error.response?.data?.error || '扫描失败')
    } finally {
      setScanning(false)
    }
  }

  const importSelectedFiles = async () => {
    if (selectedFiles.length === 0) {
      message.warning('请选择要导入的文件')
      return
    }
    
    setImporting(true)
    try {
      const filesToImport = unsavedFiles.filter(f => selectedFiles.includes(f.filename))
      const response = await api.post('/api/pages/import-local-files', {
        files: filesToImport.map(f => ({
          filename: f.filename,
          title: f.title,
          path: f.path,
          content: f.content,
          require_login: false,
          status: true
        }))
      })
      
      message.success(response.data.message)
      setScanModalVisible(false)
      fetchPages()
    } catch (error) {
      message.error(error.response?.data?.error || '导入失败')
    } finally {
      setImporting(false)
    }
  }

  const toggleFileSelection = (filename, checked) => {
    if (checked) {
      setSelectedFiles([...selectedFiles, filename])
    } else {
      setSelectedFiles(selectedFiles.filter(f => f !== filename))
    }
  }

  const toggleAllFiles = (checked) => {
    if (checked) {
      setSelectedFiles(unsavedFiles.map(f => f.filename))
    } else {
      setSelectedFiles([])
    }
  }

  const stats = {
    total: pages.length,
    enabled: pages.filter(p => p.status).length,
    requireLogin: pages.filter(p => p.require_login).length,
    totalVisits: pages.reduce((sum, p) => sum + (p.visit_count || 0), 0)
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      fixed: 'left',
      render: (id) => <Tag color="blue">#{id}</Tag>
    },
    {
      title: '页面信息',
      key: 'info',
      width: 280,
      fixed: 'left',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
            <FileTextOutlined style={{ marginRight: 8, color: '#667eea' }} />
            {record.title}
          </div>
          <div style={{ fontSize: 12, color: '#888' }}>
            <GlobalOutlined style={{ marginRight: 4 }} />
            <a href={`/v/${record.path}`} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
              /v/{record.path}
            </a>
          </div>
        </div>
      )
    },
    {
      title: '文件',
      dataIndex: 'content',
      key: 'content',
      width: 180,
      render: (text) => (
        <Tag color="cyan" style={{ borderRadius: 8 }}>
          📄 {text}
        </Tag>
      )
    },
    {
      title: '权限',
      dataIndex: 'require_login',
      key: 'require_login',
      width: 110,
      render: (text) => (
        <Tag color={text ? 'red' : 'green'} style={{ borderRadius: 8 }}>
          {text ? <><SafetyCertificateOutlined /> 需要登录</> : '公开'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => (
        <Tag color={text ? 'green' : 'red'} style={{ borderRadius: 8 }}>
          {text ? '✅ 启用' : '❌ 禁用'}
        </Tag>
      )
    },
    {
      title: '访问',
      dataIndex: 'visit_count',
      key: 'visit_count',
      width: 100,
      render: (count) => (
        <span style={{ fontWeight: 600, color: '#667eea' }}>
          👁️ {count || 0}
        </span>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (text) => {
        if (!text) return '-'
        const date = new Date(text)
        return (
          <span style={{ color: '#666', fontSize: 13 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {date.toLocaleString()}
          </span>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="预览">
            <Button 
              type="primary"
              ghost
              size="small"
              icon={<EyeFilled />} 
              onClick={() => window.open(`/v/${record.path}`, '_blank')}
              style={{ borderRadius: 6 }}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="default" 
              size="small"
              icon={<EditOutlined />} 
              onClick={() => openModal(record)}
              style={{ borderRadius: 6 }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button 
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id, record.title)}
              style={{ borderRadius: 6 }}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div style={{ 
      padding: '24px', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* 页面标题区域 */}
      <div style={{ 
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            margin: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            📑 页面管理
          </h1>
          <p style={{ color: '#666', margin: '8px 0 0 0' }}>
            管理您的HTML页面，支持创建、编辑、导入等功能
          </p>
        </div>
        <Space>
          <Button 
            type="default" 
            size="large"
            icon={<ScanOutlined />} 
            onClick={scanLocalFiles}
            loading={scanning}
            style={{ 
              borderRadius: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              background: '#fff'
            }}
          >
            扫描本地文件
          </Button>
          <Button 
            type="primary" 
            size="large"
            icon={<PlusOutlined />} 
            onClick={() => openModal()}
            style={{ 
              borderRadius: 10,
              boxShadow: '0 2px 12px rgba(102, 126, 234, 0.4)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            创建页面
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            borderRadius: 16, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: '#fff'
          }}>
            <Statistic 
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>总页面数</span>}
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#fff', fontWeight: 700, fontSize: 30 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            borderRadius: 16, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            border: 'none',
            color: '#fff'
          }}>
            <Statistic 
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>已启用</span>}
              value={stats.enabled}
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#fff', fontWeight: 700, fontSize: 30 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            borderRadius: 16, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            border: 'none',
            color: '#fff'
          }}>
            <Statistic 
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>需要登录</span>}
              value={stats.requireLogin}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#fff', fontWeight: 700, fontSize: 30 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            borderRadius: 16, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            border: 'none',
            color: '#fff'
          }}>
            <Statistic 
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>总访问量</span>}
              value={stats.totalVisits}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#fff', fontWeight: 700, fontSize: 30 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      <Card style={{ 
        borderRadius: 16, 
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: 'none',
        overflow: 'hidden'
      }}>
        <Table
          columns={columns}
          dataSource={pages}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            style: { padding: '16px 0' }
          }}
          style={{
            borderRadius: 12
          }}
        />
      </Card>

      {/* 编辑/创建弹窗 */}
      <Modal
        title={
          <div style={{ 
            fontSize: 20, 
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {currentPage ? '✏️ 编辑页面' : '➕ 创建页面'}
          </div>
        }
        open={modalVisible}
        onOk={() => form.submit()}
        confirmLoading={confirmLoading}
        onCancel={closeModal}
        width={1100}
        style={{ top: 20 }}
        okText="保存"
        cancelText="取消"
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 8,
            border: 'none'
          }
        }}
      >
        {fetchingPage ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '60px',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#666' }}>正在加载...</div>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Tabs defaultActiveKey="basic" style={{ marginTop: 8 }}>
              <TabPane tab="📋 基础信息" key="basic">
                <Form.Item
                  name="title"
                  label="页面标题"
                  rules={[{ required: true, message: '请输入页面标题' }]}
                >
                  <Input placeholder="请输入页面标题" size="large" />
                </Form.Item>

                <Form.Item
                  name="path"
                  label="页面路径"
                  rules={[{ required: true, message: '请输入页面路径' }]}
                >
                  <Input placeholder="请输入页面路径，例如：about" size="large" />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="require_login"
                      label="是否需要登录"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="需要" unCheckedChildren="不需要" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="status"
                      label="页面状态"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="启用" unCheckedChildren="禁用" defaultChecked />
                    </Form.Item>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="💻 页面内容" key="content">
                <Form.Item
                  name="content"
                  label="HTML 代码"
                  rules={[{ required: true, message: '请输入页面内容' }]}
                  valuePropName="value"
                  getValueFromEvent={(value) => value}
                >
                  <Editor
                    height="500px"
                    language="html"
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: true },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      wordWrap: 'on'
                    }}
                  />
                </Form.Item>
              </TabPane>
            </Tabs>
          </Form>
        )}
      </Modal>

      {/* 扫描本地文件结果弹窗 */}
      <Modal
        title={
          <div style={{ 
            fontSize: 20, 
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            📁 扫描本地HTML文件
          </div>
        }
        open={scanModalVisible}
        onCancel={() => setScanModalVisible(false)}
        width={1000}
        style={{ top: 30 }}
        footer={[
          <Button key="cancel" onClick={() => setScanModalVisible(false)} style={{ borderRadius: 8 }}>
            取消
          </Button>,
          <Button 
            key="import" 
            type="primary" 
            icon={<ImportOutlined />}
            onClick={importSelectedFiles}
            loading={importing}
            disabled={selectedFiles.length === 0}
            style={{ 
              borderRadius: 8,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            导入选中文件 ({selectedFiles.length})
          </Button>
        ]}
      >
        {scanStats && (
          <Row gutter={[12, 12]} style={{ marginBottom: 24, marginTop: 16 }}>
            <Col span={8}>
              <Card style={{ 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                textAlign: 'center',
                color: '#fff'
              }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{scanStats.totalFiles}</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>总文件数</div>
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                border: 'none',
                textAlign: 'center',
                color: '#fff'
              }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{scanStats.savedCount}</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>已保存</div>
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                border: 'none',
                textAlign: 'center',
                color: '#fff'
              }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{scanStats.unsavedCount}</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>未保存</div>
              </Card>
            </Col>
          </Row>
        )}

        {unsavedFiles.length > 0 && (
          <div>
            <div style={{ 
              marginBottom: 16, 
              padding: '12px 16px',
              background: '#f0f2f5',
              borderRadius: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Checkbox 
                checked={selectedFiles.length === unsavedFiles.length && unsavedFiles.length > 0}
                indeterminate={selectedFiles.length > 0 && selectedFiles.length < unsavedFiles.length}
                onChange={(e) => toggleAllFiles(e.target.checked)}
                style={{ fontSize: 14, fontWeight: 500 }}
              >
                全选 ({selectedFiles.length}/{unsavedFiles.length})
              </Checkbox>
            </div>
            
            <List
              dataSource={unsavedFiles}
              renderItem={(file) => (
                <List.Item style={{ padding: 0, marginBottom: 12 }}>
                  <Card
                    style={{ 
                      width: '100%', 
                      borderRadius: 12,
                      border: selectedFiles.includes(file.filename) 
                        ? '2px solid #667eea' 
                        : '1px solid #e8e8e8',
                      background: selectedFiles.includes(file.filename) 
                        ? 'rgba(102, 126, 234, 0.05)' 
                        : '#fff',
                      transition: 'all 0.3s ease'
                    }}
                    hoverable
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <Checkbox 
                        checked={selectedFiles.includes(file.filename)}
                        onChange={(e) => toggleFileSelection(file.filename, e.target.checked)}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: 16, 
                          fontWeight: 600,
                          color: '#333',
                          marginBottom: 6
                        }}>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            fontSize: 12,
                            marginRight: 8
                          }}>
                            📄
                          </span>
                          {file.title}
                        </div>
                        <div style={{ fontSize: 13, color: '#666' }}>
                          <Space wrap>
                            <span>文件名: <code style={{ background: '#f0f2f5', padding: '2px 6px', borderRadius: 4 }}>{file.filename}</code></span>
                            <span>•</span>
                            <span>路径: <code style={{ background: '#f0f2f5', padding: '2px 6px', borderRadius: 4 }}>/v/{file.path}</code></span>
                            <span>•</span>
                            <span>大小: {Math.round(file.size / 1024)} KB</span>
                            <span>•</span>
                            <span>最后修改: {new Date(file.lastModified).toLocaleString()}</span>
                          </Space>
                        </div>
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Pages
