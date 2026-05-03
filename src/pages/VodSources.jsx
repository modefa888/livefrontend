import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Form, Input, Select, Modal, message, Spin, Alert, Switch, Dropdown, Menu, Tag, Tooltip, InputNumber } from 'antd'
import { EditOutlined, ExperimentOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined, MoreOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { Option } = Select

const VodSources = () => {
  const [vodSources, setVodSources] = useState([])
  const [vodSourcesLoading, setVodSourcesLoading] = useState(false)
  const [vodSourcesPagination, setVodSourcesPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  
  const [vodSourceModalVisible, setVodSourceModalVisible] = useState(false)
  const [editingVodSource, setEditingVodSource] = useState(null)
  const [vodSourceForm] = Form.useForm()
  
  const [selectedVodSources, setSelectedVodSources] = useState([])
  const [batchPingLoading, setBatchPingLoading] = useState(false)
  const [batchPingResult, setBatchPingResult] = useState(null)

  // 获取影视资源列表
  const fetchVodSources = async (page = 1, pageSize = 20) => {
    setVodSourcesLoading(true)
    try {
      const response = await api.get(`/api/fabu-bot/vod-sources?page=${page}&pageSize=${pageSize}`)
      setVodSources(response.data.sources || [])
      setVodSourcesPagination({
        current: page,
        pageSize: pageSize,
        total: response.data.total || 0
      })
    } catch (error) {
      console.error('获取影视资源失败:', error)
      message.error('获取影视资源失败')
    } finally {
      setVodSourcesLoading(false)
    }
  }

  useEffect(() => {
    fetchVodSources()
  }, [])

  // 显示编辑/添加模态框
  const showVodSourceModal = (record = null) => {
    setEditingVodSource(record)
    if (record) {
      vodSourceForm.setFieldsValue({
        ...record
      })
    } else {
      vodSourceForm.resetFields()
    }
    setVodSourceModalVisible(true)
  }

  // 保存影视资源
  const handleSaveVodSource = async (values) => {
    try {
      if (editingVodSource) {
        await api.put(`/api/fabu-bot/vod-sources/${editingVodSource.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/api/fabu-bot/vod-sources', values)
        message.success('添加成功')
      }
      setVodSourceModalVisible(false)
      fetchVodSources(vodSourcesPagination.current, vodSourcesPagination.pageSize)
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    }
  }

  // 删除影视资源
  const handleDeleteVodSource = async (record) => {
    try {
      await api.delete(`/api/fabu-bot/vod-sources/${record.id}`)
      message.success('删除成功')
      fetchVodSources(vodSourcesPagination.current, vodSourcesPagination.pageSize)
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  // 测试单个资源延迟
  const handlePingVodSource = async (record) => {
    try {
      const response = await api.post(`/api/fabu-bot/vod-sources/${record.id}/ping`)
      if (response.data.success) {
        message.success(`测试完成，延迟: ${response.data.ping}ms`)
      } else {
        message.error(`测试失败: ${response.data.message}`)
      }
      fetchVodSources(vodSourcesPagination.current, vodSourcesPagination.pageSize)
    } catch (error) {
      message.error('测试延迟失败')
      console.error(error)
    }
  }

  // 批量测试延迟
  const handleBatchPing = async () => {
    if (vodSources.length === 0) {
      message.warning('没有可测试的影视资源')
      return
    }
    setBatchPingLoading(true)
    setBatchPingResult(null)
    try {
      const response = await api.post('/api/fabu-bot/vod-sources/ping/batch', {
        ids: vodSources.map(v => v.id)
      })
      const successCount = response.data.results.filter(r => r.success).length
      setBatchPingResult({
        success: successCount,
        total: response.data.results.length
      })
      message.success(`批量测试完成，成功 ${successCount}/${response.data.results.length}`)
      fetchVodSources(vodSourcesPagination.current, vodSourcesPagination.pageSize)
    } catch (error) {
      message.error('批量测试延迟失败')
      console.error(error)
    } finally {
      setBatchPingLoading(false)
    }
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      width: 150,
      render: (url) => {
        let domain = url
        try {
          const urlObj = new URL(url)
          domain = urlObj.hostname
        } catch (e) {
          const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/i)
          if (match) domain = match[1]
        }
        return (
          <Tooltip title={url}>
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
              {domain}
            </a>
          </Tooltip>
        )
      }
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 80,
      render: (category) => (
        <Tag color={category === 'adult' ? 'orange' : 'green'}>
          {category}
        </Tag>
      )
    },
    {
      title: '延迟',
      dataIndex: 'ping',
      key: 'ping',
      width: 100,
      render: (ping) => {
        if (ping === null) return <Tag color="default">未测试</Tag>
        let color = 'green'
        if (ping > 500) color = 'red'
        else if (ping > 200) color = 'orange'
        return <Tag color={color}>{ping}ms</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (createdAt) => createdAt ? new Date(createdAt).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => {
        const menuItems = [
          {
            key: 'edit',
            label: (
              <span>
                <EditOutlined style={{ marginRight: 8 }} />
                编辑
              </span>
            ),
            onClick: () => showVodSourceModal(record)
          },
          {
            key: 'test',
            label: (
              <span>
                <ExperimentOutlined style={{ marginRight: 8 }} />
                测试
              </span>
            ),
            onClick: () => handlePingVodSource(record)
          },
          {
            key: 'divider',
            type: 'divider'
          },
          {
            key: 'delete',
            label: (
              <span style={{ color: '#ff4d4f' }}>
                <DeleteOutlined style={{ marginRight: 8 }} />
                删除
              </span>
            ),
            onClick: () => {
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除"${record.name}"吗？`,
                onOk: () => handleDeleteVodSource(record),
                okText: '确定',
                cancelText: '取消'
              })
            }
          }
        ]
        
        return (
          <Dropdown menu={{ items: menuItems }} placement="bottomRight">
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        )
      }
    }
  ]

  return (
    <div style={{ padding: '20px' }}>
      <Spin spinning={vodSourcesLoading}>
        <Card 
          title="🎬 影视资源管理" 
          extra={
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                type="default"
                onClick={handleBatchPing}
                loading={batchPingLoading}
                disabled={vodSources.length === 0}
              >
                {batchPingLoading ? '测试中' : (batchPingResult ? `全部测试 (${batchPingResult.success}/${batchPingResult.total})` : '全部测试')}
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => showVodSourceModal()}>
                添加资源
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => fetchVodSources(vodSourcesPagination.current, vodSourcesPagination.pageSize)}>
                刷新列表
              </Button>
            </div>
          }
        >
          <Table
            rowKey="id"
            dataSource={vodSources}
            pagination={{
              ...vodSourcesPagination,
              onChange: (page, pageSize) => fetchVodSources(page, pageSize)
            }}
            columns={columns}
          />
        </Card>
      </Spin>

      {/* 影视资源编辑模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🎬</span>
            <span style={{ fontWeight: 600 }}>{editingVodSource ? '编辑影视资源' : '添加影视资源'}</span>
          </div>
        }
        open={vodSourceModalVisible}
        onCancel={() => setVodSourceModalVisible(false)}
        footer={null}
        width={700}
        style={{ top: '8vh' }}
      >
        <Form
          form={vodSourceForm}
          layout="vertical"
          onFinish={handleSaveVodSource}
        >
          <Card size="small" style={{ marginBottom: '16px', background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px' }}>📝</span>
              <span style={{ fontWeight: 500, color: '#1890ff' }}>基本信息</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Form.Item
                name="id"
                label="ID"
                rules={[{ required: true, message: '请输入ID' }]}
                style={{ marginBottom: '8px' }}
              >
                <Input
                  placeholder="请输入资源ID"
                  disabled={!!editingVodSource}
                />
              </Form.Item>
              <Form.Item
                name="name"
                label="名称"
                rules={[{ required: true, message: '请输入名称' }]}
                style={{ marginBottom: '8px' }}
              >
                <Input placeholder="请输入资源名称" />
              </Form.Item>
            </div>
            <Form.Item
              name="url"
              label="URL"
              rules={[
                { required: true, message: '请输入URL' },
                { type: 'url', message: '请输入有效的URL' }
              ]}
              style={{ marginBottom: '8px' }}
            >
              <Input placeholder="请输入资源URL" />
            </Form.Item>
          </Card>

          <Card size="small" style={{ marginBottom: '16px', background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px' }}>⚙️</span>
              <span style={{ fontWeight: 500, color: '#1890ff' }}>配置信息</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Form.Item
                name="type"
                label="类型"
                initialValue="vod"
                style={{ marginBottom: '8px' }}
              >
                <Select>
                  <Option value="vod">vod</Option>
                  <Option value="api">api</Option>
                  <Option value="other">other</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="category"
                label="分类"
                initialValue="normal"
                style={{ marginBottom: '8px' }}
              >
                <Select>
                  <Option value="normal">normal</Option>
                  <Option value="adult">adult</Option>
                  <Option value="other">other</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="enabled"
                label="状态"
                valuePropName="checked"
                initialValue={true}
                style={{ marginBottom: '8px' }}
              >
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
              <Form.Item
                name="sort"
                label="排序"
                initialValue={0}
                style={{ marginBottom: '8px' }}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
            <Button onClick={() => setVodSourceModalVisible(false)} size="large">
              取消
            </Button>
            <Button type="primary" htmlType="submit" size="large">
              <span style={{ marginRight: '6px' }}>💾</span>
              保存
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default VodSources
