import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Switch, message, Space, Tag, Tooltip, Tabs } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import api from '../utils/api'
import Editor from '@monaco-editor/react'

const { TabPane } = Tabs

function Pages() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(null)
  const [form] = Form.useForm()

  // 获取页面列表
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

  // 打开创建/编辑模态框
  const openModal = (page = null) => {
    setCurrentPage(page)
    if (page) {
      form.setFieldsValue({
        title: page.title,
        path: page.path,
        content: page.content,
        require_login: page.require_login,
        status: page.status
      })
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false)
    setCurrentPage(null)
    form.resetFields()
  }

  // 提交表单
  const handleSubmit = async (values) => {
    setConfirmLoading(true)
    try {
      if (currentPage) {
        // 更新页面
        await api.put(`/api/pages/${currentPage.id}`, values)
        message.success('页面更新成功')
      } else {
        // 创建页面
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

  // 删除页面
  const handleDelete = (id, title) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除页面 "${title}" 吗？`,
      okText: '确定',
      cancelText: '取消',
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

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '页面标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '页面路径',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      render: (text) => (
        <a href={`/v/${text}`} target="_blank" rel="noopener noreferrer">
          /v/{text}
        </a>
      )
    },
    {
      title: '是否需要登录',
      dataIndex: 'require_login',
      key: 'require_login',
      width: 120,
      render: (text) => (
        <Tag color={text ? 'red' : 'green'}>
          {text ? '需要' : '不需要'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => (
        <Tag color={text ? 'green' : 'red'}>
          {text ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '独立访客数',
      dataIndex: 'visit_count',
      key: 'visit_count',
      width: 120
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => {
        if (!text) return '-'
        const date = new Date(text)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="预览">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => window.open(`/v/${record.path}`, '_blank')}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => openModal(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id, record.title)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div className="pages-container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>页面管理</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => openModal()}
        >
          创建页面
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={pages}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true
        }}
      />

      <Modal
        title={currentPage ? '编辑页面' : '创建页面'}
        open={modalVisible}
        onOk={() => form.submit()}
        confirmLoading={confirmLoading}
        onCancel={closeModal}
        width={1000}
        height={600}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基础信息" key="basic">
              <Form.Item
                name="title"
                label="页面标题"
                rules={[{ required: true, message: '请输入页面标题' }]}
              >
                <Input placeholder="请输入页面标题" />
              </Form.Item>

              <Form.Item
                name="path"
                label="页面路径"
                rules={[{ required: true, message: '请输入页面路径' }]}
              >
                <Input placeholder="请输入页面路径，例如：about" />
              </Form.Item>

              <Form.Item
                name="require_login"
                label="是否需要登录"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="status"
                label="页面状态"
                valuePropName="checked"
              >
                <Switch defaultChecked />
              </Form.Item>
            </TabPane>
            <TabPane tab="页面内容" key="content">
              <Form.Item
                name="content"
                label="页面内容"
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
                    automaticLayout: true
                  }}
                />
              </Form.Item>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>
    </div>
  )
}

export default Pages