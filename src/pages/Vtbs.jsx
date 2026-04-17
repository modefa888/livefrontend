import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Spin, Card, Badge } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { Option } = Select

// 时间格式化函数
const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function Vtbs() {
  const [allVtbs, setAllVtbs] = useState([])
  const [vtbs, setVtbs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingVtb, setEditingVtb] = useState(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(undefined)
  const [allCategories, setAllCategories] = useState([])

  // 分类选项始终使用完整的分类列表
  const categoryOptions = allCategories

  // 加载主播列表
  useEffect(() => {
    fetchVtbs()
  }, [])

  const fetchVtbs = async () => {
    setLoading(true)
    try {
      // 获取用户信息，检查权限级别
      const userResponse = await api.get('/api/auth/me')
      
      const user = userResponse.data
      let filteredVtbs = []
      
      // 根据用户权限获取不同的主播列表
      if (user.permissionLevel === 2 || user.permissionLevel === 3) {
        // 管理员获取所有主播
        const response = await api.get('/api/vtbs')
        filteredVtbs = response.data
      } else {
        // 普通用户获取自己关注的主播
        const response = await api.get('/api/vtbs/user/followed')
        filteredVtbs = response.data
      }
      
      setAllVtbs(filteredVtbs)
      setVtbs(filteredVtbs)
      // 更新完整分类列表
      const categories = [...new Set(filteredVtbs.map(vtb => vtb.category).filter(Boolean))]
      setAllCategories(categories.sort())
    } catch (error) {
      message.error('获取主播列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 打开添加/编辑模态框
  const openModal = (vtb = null) => {
    setEditingVtb(vtb)
    form.setFieldsValue(vtb || {})
    setModalVisible(true)
  }

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false)
    setEditingVtb(null)
    form.resetFields()
  }

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (editingVtb) {
        // 更新主播
        await api.put(`/api/vtbs/${editingVtb.id}`, values)
        message.success('主播更新成功')
      } else {
        // 添加主播
        await api.post('/api/vtbs', values)
        message.success('主播添加成功')
      }
      closeModal()
      await fetchVtbs()
      // 清空搜索条件
      setSearchText('')
      setSelectedCategory('')
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 删除主播
  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个主播吗？',
      onOk: async () => {
        try {
          await api.delete(`/api/vtbs/${id}`)
          message.success('主播删除成功')
          await fetchVtbs()
          // 清空搜索条件
          setSearchText('')
          setSelectedCategory('')
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  // 搜索主播
  const handleSearch = async () => {
    setLoading(true)
    try {
      // 从完整数据中过滤
      let filteredVtbs = [...allVtbs]
      
      // 按搜索文本过滤
      if (searchText) {
        const keyword = searchText.toLowerCase()
        filteredVtbs = filteredVtbs.filter(vtb => 
          vtb.username?.toLowerCase().includes(keyword) || 
          vtb.roomid?.toLowerCase().includes(keyword)
        )
      }
      
      // 按分类过滤
      if (selectedCategory) {
        filteredVtbs = filteredVtbs.filter(vtb => vtb.category === selectedCategory)
      }
      
      setVtbs(filteredVtbs)
    } catch (error) {
      message.error('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理分类选择变化
  const handleCategoryChange = (value) => {
    setSelectedCategory(value)
  }

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id
    },
    {
      title: '名称',
      dataIndex: 'username',
      key: 'username',
      ellipsis: true,
      sorter: (a, b) => a.username.localeCompare(b.username)
    },
    {
      title: '房间号',
      dataIndex: 'roomid',
      key: 'roomid',
      ellipsis: true,
      sorter: (a, b) => a.roomid.localeCompare(b.roomid)
    },
    {
      title: '平台',
      dataIndex: 'site',
      key: 'site',
      ellipsis: true,
      sorter: (a, b) => a.site.localeCompare(b.site)
    },
    {
      title: '直播状态',
      dataIndex: 'liveStatus',
      key: 'liveStatus',
      sorter: (a, b) => (a.liveStatus === '1' ? 1 : 0) - (b.liveStatus === '1' ? 1 : 0),
      render: (status) => (
        <Badge status={status === '1' ? 'success' : 'default'} text={status === '1' ? '直播中' : '未直播'} />
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      ellipsis: true,
      sorter: (a, b) => (a.category || '').localeCompare(b.category || '')
    },
    {
      title: '直播链接',
      dataIndex: 'targetUrl',
      key: 'targetUrl',
      ellipsis: true,
      sorter: (a, b) => (a.targetUrl || '').localeCompare(b.targetUrl || ''),
      render: (url) => {
        if (!url) return '-'
        return (
          <a href={url} target="_blank" rel="noopener noreferrer">
            前往直播间
          </a>
        )
      }
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
      render: (time) => formatTime(time)
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>主播管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          添加主播
        </Button>
      </div>
      
      <Card className="card" style={{ marginBottom: 16, padding: '8px 16px' }} size="small">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="主播名称"
            prefix={<UserOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 180 }}
            size="small"
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="选择分类"
            value={selectedCategory}
            onChange={handleCategoryChange}
            style={{ width: 110 }}
            size="small"
            allowClear
          >
            {categoryOptions.map(category => (
              <Option key={category} value={category}>{category}</Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
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
        <Table columns={columns} dataSource={vtbs} rowKey="id" />
      )}

      <Modal
        title={editingVtb ? '编辑主播' : '添加主播'}
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
            label="名称"
            rules={[{ required: true, message: '请输入主播名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="roomid"
            label="房间号"
            rules={[{ required: true, message: '请输入房间号' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="site"
            label="平台"
            rules={[{ required: true, message: '请选择平台' }]}
          >
            <Select placeholder="选择平台">
              <Option value="live.douyin.com">抖音</Option>
              <Option value="bilibili.com">B站</Option>
              <Option value="huya.com">虎牙</Option>
              <Option value="youtube.com">YouTube</Option>
              <Option value="douyu.com">斗鱼</Option>
              <Option value="kuaishou.com">快手</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="targetUrl"
            label="直播链接"
          >
            <Input />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right' }}>
            <Button onClick={closeModal} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingVtb ? '更新' : '添加'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Vtbs