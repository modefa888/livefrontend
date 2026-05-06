import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Table, Form, Input, Select, Modal, message, Spin, Alert, Switch, Dropdown, Menu, Tag, Tooltip, InputNumber, Pagination, Tabs } from 'antd'
import { EditOutlined, ExperimentOutlined, DeleteOutlined, ReloadOutlined, PlusOutlined, MoreOutlined, SearchOutlined, PlayCircleOutlined, LinkOutlined, CloseOutlined } from '@ant-design/icons'
import api, { BASE_URL } from '../utils/api'
import Hls from 'hls.js'

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
  
  const [searchModalVisible, setSearchModalVisible] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [allSearchResults, setAllSearchResults] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchPagination, setSearchPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [categories, setCategories] = useState(['all'])
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  const [spiderSearchModalVisible, setSpiderSearchModalVisible] = useState(false)
  const [spiderSearchKeyword, setSpiderSearchKeyword] = useState('')
  const [spiderSearchResults, setSpiderSearchResults] = useState([])
  const [spiderSearchLoading, setSpiderSearchLoading] = useState(false)
  const [spiderSearchPagination, setSpiderSearchPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [selectedVodSource, setSelectedVodSource] = useState(null)
  
  const [movieDetailModalVisible, setMovieDetailModalVisible] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState(null)
  
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [currentVideoUrl, setCurrentVideoUrl] = useState('')
  const [currentEpisodeName, setCurrentEpisodeName] = useState('')
  const videoRef = useRef(null)
  
  const [streamSearchModalVisible, setStreamSearchModalVisible] = useState(false)
  const [streamSearchKeyword, setStreamSearchKeyword] = useState('')
  const [streamSearchCategory, setStreamSearchCategory] = useState('all')
  const [streamSearchResults, setStreamSearchResults] = useState([])
  const [streamSearchLoading, setStreamSearchLoading] = useState(false)
  const [streamSearchLogs, setStreamSearchLogs] = useState([])
  const [streamSearchTotal, setStreamSearchTotal] = useState(0)
  const [streamSearchPagination, setStreamSearchPagination] = useState({ current: 1, pageSize: 10 })
  const streamSearchEventSourceRef = useRef(null)

  const fetchVodSources = async (page = 1, pageSize = 20) => {
    setVodSourcesLoading(true)
    try {
      const response = await api.get(`/api/vod-sources?page=${page}&pageSize=${pageSize}`)
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

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/vod-sources/categories')
      if (response.data.success) {
        setCategories(response.data.categories)
      }
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  useEffect(() => {
    fetchVodSources()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (videoPlaying && currentVideoUrl && videoRef.current) {
      const video = videoRef.current
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(currentVideoUrl)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(err => console.error('播放失败:', err))
        })
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('HLS 错误:', data)
            message.error('视频加载失败')
          }
        })
        return () => hls.destroy()
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentVideoUrl
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(err => console.error('播放失败:', err))
        })
      }
    }
  }, [videoPlaying, currentVideoUrl])

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

  const handleSaveVodSource = async (values) => {
    try {
      if (editingVodSource) {
        await api.put(`/api/vod-sources/${editingVodSource.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/api/vod-sources', values)
        message.success('添加成功')
      }
      setVodSourceModalVisible(false)
      fetchVodSources(vodSourcesPagination.current, vodSourcesPagination.pageSize)
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    }
  }

  const handleDeleteVodSource = async (record) => {
    try {
      await api.delete(`/api/vod-sources/${record.id}`)
      message.success('删除成功')
      fetchVodSources(vodSourcesPagination.current, vodSourcesPagination.pageSize)
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  const handleSearchMovies = async (keyword) => {
    if (!keyword.trim()) {
      message.warning('请输入搜索关键词')
      return
    }
    
    setSearchLoading(true)
    try {
      const response = await api.get('/api/vod-sources/search/aggregate', {
        params: {
          keyword: keyword.trim(),
          category: selectedCategory
        }
      })
      if (response.data.success) {
        // 保存所有结果
        setAllSearchResults(response.data.list || [])
        // 显示第一页
        const firstPageResults = (response.data.list || []).slice(0, 10)
        setSearchResults(firstPageResults)
        setSearchPagination({
          current: 1,
          pageSize: 10,
          total: response.data.total || 0
        })
      } else {
        message.error(response.data.message || '搜索失败')
        setAllSearchResults([])
        setSearchResults([])
        setSearchPagination({ current: 1, pageSize: 10, total: 0 })
      }
    } catch (error) {
      console.error('影视搜索失败:', error)
      message.error('搜索失败，请稍后重试')
    } finally {
      setSearchLoading(false)
    }
  }

  const handlePageChange = (page) => {
    const pageSize = 10
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedResults = allSearchResults.slice(startIndex, endIndex)
    setSearchResults(paginatedResults)
    setSearchPagination(prev => ({
      ...prev,
      current: page
    }))
  }

  const openSpiderSearchModal = (vodSource) => {
    setSelectedVodSource(vodSource)
    setSpiderSearchModalVisible(true)
    setSpiderSearchKeyword('')
    setSpiderSearchResults([])
    setSpiderSearchPagination({ current: 1, pageSize: 10, total: 0 })
  }

  const openMovieDetailModal = (movie) => {
    setSelectedMovie(null)
    setVideoPlaying(false)
    setCurrentVideoUrl('')
    setTimeout(() => {
      setSelectedMovie(movie)
      setMovieDetailModalVisible(true)
    }, 10)
  }

  const playVideo = (url, name) => {
    setCurrentVideoUrl(url)
    setCurrentEpisodeName(name || '播放')
    setVideoPlaying(true)
  }

  const closeVideo = () => {
    setVideoPlaying(false)
    setCurrentVideoUrl('')
    setCurrentEpisodeName('')
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.removeAttribute('src')
      videoRef.current.load()
    }
  }

  const addLog = (type, message) => {
    const time = new Date().toLocaleTimeString()
    setStreamSearchLogs(prev => [...prev, { time, type, message }])
  }

  const handleStreamSearch = async () => {
    if (!streamSearchKeyword.trim()) {
      message.warning('请输入搜索关键词')
      return
    }

    setStreamSearchLoading(true)
    setStreamSearchResults([])
    setStreamSearchLogs([])
    setStreamSearchTotal(0)

    addLog('info', '开始搜索...')

    try {
      const token = localStorage.getItem('token')
      const baseUrl = BASE_URL || window.location.origin
      const url = new URL('/api/vod-sources/search/aggregate/stream', baseUrl)
      url.searchParams.set('keyword', streamSearchKeyword)
      if (streamSearchCategory !== 'all') {
        url.searchParams.set('category', streamSearchCategory)
      }

      const eventSource = new EventSource(`${url.toString()}&token=${token}`)
      streamSearchEventSourceRef.current = eventSource
      let searchEnded = false

      eventSource.addEventListener('data', (event) => {
        const data = JSON.parse(event.data)
        addLog('success', `✅ ${data.source} 返回 ${data.count} 条结果`)
        setStreamSearchResults(prev => [...prev, ...data.list])
      })

      eventSource.addEventListener('error', (event) => {
        // 这是自定义error事件（单个源出错），不应该关闭连接
        try {
          const data = JSON.parse(event.data)
          addLog('error', `❌ ${data.source || '错误'}: ${data.message}`)
        } catch (e) {
          addLog('error', '连接出错')
        }
      })

      eventSource.addEventListener('end', (event) => {
        searchEnded = true
        const data = JSON.parse(event.data)
        setStreamSearchTotal(data.total)
        addLog('info', `搜索完成，共找到 ${data.total} 条结果，已搜索 ${data.searchedSources} 个资源站`)
        setStreamSearchLoading(false)
        eventSource.close()
      })

      eventSource.onerror = (err) => {
        // 只有真正的连接错误才处理
        if (!searchEnded) {
          addLog('error', '连接出现问题，但仍在尝试接收...')
          // 不自动关闭连接，让它继续尝试
        }
      }

    } catch (error) {
      console.error('流式搜索失败:', error)
      message.error('搜索失败')
      setStreamSearchLoading(false)
    }
  }

  const stopStreamSearch = () => {
    if (streamSearchEventSourceRef.current) {
      streamSearchEventSourceRef.current.close()
    }
    setStreamSearchLoading(false)
    addLog('info', '搜索已停止')
  }

  const openStreamSearchModal = () => {
    setStreamSearchKeyword('')
    setStreamSearchResults([])
    setStreamSearchLogs([])
    setStreamSearchTotal(0)
    setStreamSearchPagination({ current: 1, pageSize: 10 })
    setStreamSearchModalVisible(true)
  }

  const handleStreamSearchPageChange = (page, pageSize) => {
    setStreamSearchPagination({ current: page, pageSize })
  }

  const handleSpiderSearch = async (vodSourceId, keyword, page = 1, pageSize = 10) => {
    if (!keyword.trim()) {
      message.warning('请输入搜索关键词')
      return
    }
    
    setSpiderSearchLoading(true)
    try {
      const response = await api.get(`/api/vod-sources/${vodSourceId}/search`, {
        params: {
          keyword: keyword.trim(),
          page,
          pageSize
        }
      })
      if (response.data.success) {
        setSpiderSearchResults(response.data.list || [])
        setSpiderSearchPagination({
          current: response.data.page || page,
          pageSize: response.data.pageSize || pageSize,
          total: response.data.total || 0
        })
      } else {
        message.error(response.data.message || '搜索失败')
        setSpiderSearchResults([])
        setSpiderSearchPagination({ current: 1, pageSize: 10, total: 0 })
      }
    } catch (error) {
      console.error('爬虫搜索失败:', error)
      message.error('搜索失败，请稍后重试')
    } finally {
      setSpiderSearchLoading(false)
    }
  }

  const handlePingVodSource = async (record) => {
    try {
      const response = await api.post(`/api/vod-sources/${record.id}/ping`)
      if (response.data.success) {
        message.success(`延迟测试成功: ${response.data.ping}ms`)
      } else {
        message.warning(`延迟测试失败: ${response.data.message}`)
      }
      fetchVodSources(vodSourcesPagination.current, vodSourcesPagination.pageSize)
    } catch (error) {
      message.error('测试延迟失败')
    }
  }

  const handleBatchPing = async () => {
    if (selectedVodSources.length === 0) {
      message.warning('请选择要测试的影视资源')
      return
    }
    
    setBatchPingLoading(true)
    try {
      const response = await api.post('/api/vod-sources/ping/batch', {
        ids: selectedVodSources
      })
      if (response.data.success) {
        setBatchPingResult(response.data.results)
        message.success('批量测试完成')
      } else {
        message.error('批量测试失败')
      }
      fetchVodSources(vodSourcesPagination.current, vodSourcesPagination.pageSize)
    } catch (error) {
      message.error('批量测试失败')
    } finally {
      setBatchPingLoading(false)
    }
  }

  const handlePingAll = async () => {
    setBatchPingLoading(true)
    try {
      const response = await api.post('/api/vod-sources/ping/batch')
      if (response.data.success) {
        setBatchPingResult(response.data.results)
        const successCount = response.data.results.filter(r => r.success).length
        const totalCount = response.data.results.length
        message.success(`测试完成，成功 ${successCount}/${totalCount}`)
      } else {
        message.error('批量测试失败')
      }
      fetchVodSources(vodSourcesPagination.current, vodSourcesPagination.pageSize)
    } catch (error) {
      message.error('批量测试失败')
    } finally {
      setBatchPingLoading(false)
    }
  }

  const handleRowSelection = (selectedRowKeys) => {
    setSelectedVodSources(selectedRowKeys)
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      ellipsis: true
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      align: 'center',
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      align: 'center',
      render: (category) => <Tag color="purple">{category}</Tag>
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 60,
      align: 'center'
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
            key: 'search',
            label: (
              <span>
                <SearchOutlined style={{ marginRight: 8 }} />
                搜索影视
              </span>
            ),
            onClick: () => openSpiderSearchModal(record)
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
          title="影视资源管理"
          extra={
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showVodSourceModal}
                style={{ borderRadius: '8px' }}
              >
                添加资源
              </Button>
              <Button
                icon={<SearchOutlined />}
                onClick={() => {
                  setSearchModalVisible(true)
                  setSearchKeyword('')
                  setSearchResults([])
                }}
                style={{ borderRadius: '8px' }}
              >
                影视搜索
              </Button>
              <Button
                onClick={openStreamSearchModal}
                style={{ borderRadius: '8px' }}
              >
                ⚡ 流式搜索
              </Button>
              <Button
                type="default"
                loading={batchPingLoading}
                onClick={handlePingAll}
                style={{ borderRadius: '8px' }}
              >
                一键测试延迟
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchVodSources(vodSourcesPagination.current, vodSourcesPagination.pageSize)}
                style={{ borderRadius: '8px' }}
              >
                刷新
              </Button>
              {selectedVodSources.length > 0 && (
                <Button
                  type="primary"
                  loading={batchPingLoading}
                  onClick={handleBatchPing}
                  style={{ borderRadius: '8px' }}
                >
                  批量测试 ({selectedVodSources.length})
                </Button>
              )}
            </div>
          }
        >
          <Table
            rowKey="id"
            dataSource={vodSources}
            columns={columns}
            pagination={{
              current: vodSourcesPagination.current,
              pageSize: vodSourcesPagination.pageSize,
              total: vodSourcesPagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => fetchVodSources(page, pageSize),
              onShowSizeChange: (current, size) => fetchVodSources(1, size)
            }}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedVodSources,
              onChange: handleRowSelection
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Spin>

      <Modal
        title={editingVodSource ? '编辑影视资源' : '添加影视资源'}
        open={vodSourceModalVisible}
        onCancel={() => setVodSourceModalVisible(false)}
        footer={null}
      >
        <Form
          form={vodSourceForm}
          layout="vertical"
          onFinish={handleSaveVodSource}
        >
          <Form.Item
            name="id"
            label="资源ID"
            rules={[{ required: true, message: '请输入资源ID' }]}
          >
            <Input placeholder="请输入资源ID" />
          </Form.Item>
          <Form.Item
            name="name"
            label="资源名称"
            rules={[{ required: true, message: '请输入资源名称' }]}
          >
            <Input placeholder="请输入资源名称" />
          </Form.Item>
          <Form.Item
            name="url"
            label="资源URL"
            rules={[{ required: true, message: '请输入资源URL' }]}
          >
            <Input placeholder="请输入资源URL" />
          </Form.Item>
          <Form.Item
            name="type"
            label="类型"
            initialValue="vod"
          >
            <Select>
              <Option value="vod">VOD</Option>
              <Option value="live">直播</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            initialValue="normal"
          >
            <Select>
              <Option value="normal">普通</Option>
              <Option value="vip">VIP</Option>
              <Option value="special">特殊</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="enabled"
            label="状态"
            initialValue={true}
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item
            name="sort"
            label="排序"
            initialValue={0}
          >
            <InputNumber min={0} max={999} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setVodSourceModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <span style={{ fontWeight: 600 }}>影视搜索</span>
          </div>
        }
        open={searchModalVisible}
        onCancel={() => setSearchModalVisible(false)}
        footer={null}
        width={900}
        style={{ top: '8vh' }}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Select
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value)}
              style={{ width: 150 }}
              size="large"
            >
              {categories.map((category) => (
                <Option key={category} value={category}>
                  {category === 'all' ? '全部分类' : category}
                </Option>
              ))}
            </Select>
            <Input
              placeholder="输入影视名称开始搜索..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={() => handleSearchMovies(searchKeyword)}
              style={{ flex: 1 }}
              size="large"
              prefix={<SearchOutlined />}
            />
            <Button
              type="primary"
              onClick={() => handleSearchMovies(searchKeyword)}
              loading={searchLoading}
              size="large"
            >
              搜索
            </Button>
          </div>
        </div>

        <Spin spinning={searchLoading}>
          {searchResults.length > 0 ? (
            <div>
              <Table
                rowKey="uniqueId"
                dataSource={searchResults}
                pagination={false}
                scroll={{ y: 400 }}
                columns={[
                  {
                    title: '📺 名称',
                    dataIndex: 'title',
                    key: 'title',
                    ellipsis: true,
                    width: 200
                  },
                  {
                    title: '📅 年份',
                    dataIndex: 'year',
                    key: 'year',
                    width: 80,
                    align: 'center'
                  },
                  {
                    title: '🎬 类型',
                    dataIndex: 'type',
                    key: 'type',
                    width: 100,
                    align: 'center',
                    render: (type) => <Tag color="blue">{type}</Tag>
                  },
                  {
                    title: '🌟 评分',
                    dataIndex: 'rating',
                    key: 'rating',
                    width: 80,
                    align: 'center',
                    render: (rating) => <Tag color={rating >= 8 ? 'green' : rating >= 6 ? 'orange' : 'red'}>{rating}</Tag>
                  },
                  {
                    title: '📝 简介',
                    dataIndex: 'desc',
                    key: 'desc',
                    ellipsis: true,
                    render: (desc, record) => (
                      <span 
                        style={{ cursor: 'pointer', color: '#1890ff' }} 
                        onClick={() => openMovieDetailModal(record)}
                      >
                        {desc || '点击查看详情'}
                      </span>
                    )
                  },
                  {
                    title: '🔗 操作',
                    key: 'action',
                    width: 160,
                    align: 'center',
                    render: (_, record) => (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Button
                          type="default"
                          size="small"
                          onClick={() => openMovieDetailModal(record)}
                        >
                          详情
                        </Button>
                        {record.downloadUrl && (
                          <Button
                            type="default"
                            size="small"
                            icon={<LinkOutlined />}
                            onClick={() => window.open(record.downloadUrl, '_blank')}
                          >
                            下载
                          </Button>
                        )}
                      </div>
                    )
                  }
                ]}
              />
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <Pagination
                  current={searchPagination.current}
                  pageSize={searchPagination.pageSize}
                  total={searchPagination.total}
                  onChange={handlePageChange}
                  showQuickJumper
                  showTotal={(total) => `共 ${total} 条结果`}
                />
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              {searchKeyword ? (
                <Alert
                  message="未找到相关影视"
                  description="请尝试其他关键词"
                  type="info"
                  showIcon
                />
              ) : (
                <Alert
                  message="开始搜索"
                  description="输入影视名称开始搜索"
                  type="info"
                  showIcon
                />
              )}
            </div>
          )}
        </Spin>
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <span style={{ fontWeight: 600 }}>爬虫搜索 - {selectedVodSource?.name}</span>
          </div>
        }
        open={spiderSearchModalVisible}
        onCancel={() => setSpiderSearchModalVisible(false)}
        footer={null}
        width={900}
        style={{ top: '8vh' }}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Input
              placeholder={`在 ${selectedVodSource?.name} 中搜索影视...`}
              value={spiderSearchKeyword}
              onChange={(e) => setSpiderSearchKeyword(e.target.value)}
              onPressEnter={() => handleSpiderSearch(selectedVodSource?.id, spiderSearchKeyword)}
              style={{ flex: 1 }}
              size="large"
              prefix={<SearchOutlined />}
            />
            <Button
              type="primary"
              onClick={() => handleSpiderSearch(selectedVodSource?.id, spiderSearchKeyword)}
              loading={spiderSearchLoading}
              size="large"
            >
              搜索
            </Button>
          </div>
        </div>

        <Spin spinning={spiderSearchLoading}>
          {spiderSearchResults.length > 0 ? (
            <div>
              <Table
                rowKey="id"
                dataSource={spiderSearchResults}
                pagination={false}
                scroll={{ y: 400 }}
                columns={[
                  {
                    title: '📺 名称',
                    dataIndex: 'title',
                    key: 'title',
                    ellipsis: true,
                    width: 200
                  },
                  {
                    title: '📅 年份',
                    dataIndex: 'year',
                    key: 'year',
                    width: 80,
                    align: 'center'
                  },
                  {
                    title: '🎬 类型',
                    dataIndex: 'type',
                    key: 'type',
                    width: 100,
                    align: 'center',
                    render: (type) => <Tag color="blue">{type}</Tag>
                  },
                  {
                    title: '🌟 评分',
                    dataIndex: 'rating',
                    key: 'rating',
                    width: 80,
                    align: 'center',
                    render: (rating) => <Tag color={rating >= 8 ? 'green' : rating >= 6 ? 'orange' : 'red'}>{rating}</Tag>
                  },
                  {
                    title: '📝 简介',
                    dataIndex: 'desc',
                    key: 'desc',
                    ellipsis: true,
                    render: (desc, record) => (
                      <span 
                        style={{ cursor: 'pointer', color: '#1890ff' }} 
                        onClick={() => openMovieDetailModal(record)}
                      >
                        {desc || '点击查看详情'}
                      </span>
                    )
                  },
                  {
                    title: '🔗 操作',
                    key: 'action',
                    width: 160,
                    align: 'center',
                    render: (_, record) => (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Button
                          type="default"
                          size="small"
                          onClick={() => openMovieDetailModal(record)}
                        >
                          详情
                        </Button>
                        {record.downloadUrl && (
                          <Button
                            type="default"
                            size="small"
                            icon={<LinkOutlined />}
                            onClick={() => window.open(record.downloadUrl, '_blank')}
                          >
                            下载
                          </Button>
                        )}
                      </div>
                    )
                  }
                ]}
              />
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <Pagination
                  current={spiderSearchPagination.current}
                  pageSize={spiderSearchPagination.pageSize}
                  total={spiderSearchPagination.total}
                  onChange={(page, pageSize) => handleSpiderSearch(selectedVodSource?.id, spiderSearchKeyword, page, pageSize)}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total) => `共 ${total} 条结果`}
                />
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              {spiderSearchKeyword ? (
                <Alert
                  message="未找到相关影视"
                  description="请尝试其他关键词"
                  type="info"
                  showIcon
                />
              ) : (
                <Alert
                  message="开始搜索"
                  description={`输入影视名称在 ${selectedVodSource?.name} 中搜索`}
                  type="info"
                  showIcon
                />
              )}
            </div>
          )}
        </Spin>
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🎬</span>
            <span style={{ fontWeight: 600 }}>{selectedMovie?.title}</span>
          </div>
        }
        open={movieDetailModalVisible}
        onCancel={() => {
          closeVideo()
          setMovieDetailModalVisible(false)
        }}
        footer={null}
        width={videoPlaying ? 1000 : 800}
        style={{ top: '8vh' }}
      >
        {selectedMovie && (
          <div style={{ padding: '20px' }}>
            {videoPlaying && (
              <div style={{ marginBottom: '20px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, color: '#333' }}>
                    <PlayCircleOutlined style={{ marginRight: '8px' }} />
                    {currentEpisodeName}
                  </h3>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={closeVideo}
                  />
                </div>
                <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                  <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', display: 'block' }}
                    controls
                    playsInline
                  />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              {selectedMovie && selectedMovie.pic && (
                <div style={{ width: '200px', height: '280px', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <img 
                    key={selectedMovie.uniqueId || selectedMovie.id}
                    src={selectedMovie.pic} 
                    alt={selectedMovie.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#666' }}>年份：</span>
                  <span>{selectedMovie.year || '未知'}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#666' }}>类型：</span>
                  <Tag color="blue">{selectedMovie.type || '未知'}</Tag>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#666' }}>分类：</span>
                  {selectedMovie.vodClass ? (
                    <span>{selectedMovie.vodClass}</span>
                  ) : (
                    <span>未知</span>
                  )}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#666' }}>主演：</span>
                  <span>{selectedMovie.actor || '未知'}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#666' }}>导演：</span>
                  <span>{selectedMovie.director || '未知'}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#666' }}>语言：</span>
                  <span>{selectedMovie.lang || '未知'}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#666' }}>备注：</span>
                  <span>{selectedMovie.remarks || '无'}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#666' }}>评分：</span>
                  <Tag color={selectedMovie.rating >= 8 ? 'green' : selectedMovie.rating >= 6 ? 'orange' : 'red'}>
                    {selectedMovie.rating || '暂无'}
                  </Tag>
                </div>
                <div style={{ marginTop: '20px' }}>
                  {selectedMovie.downloadUrl && (
                    <Button
                      type="default"
                      size="large"
                      icon={<LinkOutlined />}
                      onClick={() => window.open(selectedMovie.downloadUrl, '_blank')}
                      style={{ width: '100%' }}
                    >
                      下载资源
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
              <h3 style={{ marginBottom: '12px', color: '#333' }}>📝 剧情简介</h3>
              <p style={{ color: '#666', lineHeight: '1.8' }}>
                {selectedMovie.desc || '暂无简介'}
              </p>
            </div>
            
            {selectedMovie.episodes && selectedMovie.episodes.length > 0 && (
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '20px', marginTop: '20px' }}>
                <h3 style={{ marginBottom: '12px', color: '#333' }}>🎬 剧集列表</h3>
                {selectedMovie.episodes.length <= 18 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedMovie.episodes.map((episode, index) => (
                      <button
                        key={index}
                        onClick={() => playVideo(episode.url, episode.name)}
                        style={{
                          padding: '8px 16px',
                          background: '#f5f5f5',
                          border: '1px solid #d9d9d9',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#333',
                          fontSize: '14px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#1890ff';
                          e.target.style.borderColor = '#1890ff';
                          e.target.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#f5f5f5';
                          e.target.style.borderColor = '#d9d9d9';
                          e.target.style.color = '#333';
                        }}
                      >
                        {episode.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Tabs defaultActiveKey="1">
                    {Array.from({ length: Math.ceil(selectedMovie.episodes.length / 18) }, (_, i) => {
                      const start = i * 18 + 1;
                      const end = Math.min((i + 1) * 18, selectedMovie.episodes.length);
                      return (
                        <Tabs.TabPane key={String(i + 1)} tab={`第${start}-${end}集`}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                            {selectedMovie.episodes.slice(i * 18, (i + 1) * 18).map((episode, index) => (
                              <button
                                key={index}
                                onClick={() => playVideo(episode.url, episode.name)}
                                style={{
                                  padding: '8px 16px',
                                  background: '#f5f5f5',
                                  border: '1px solid #d9d9d9',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#333',
                                  fontSize: '14px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#1890ff';
                                  e.target.style.borderColor = '#1890ff';
                                  e.target.style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#f5f5f5';
                                  e.target.style.borderColor = '#d9d9d9';
                                  e.target.style.color = '#333';
                                }}
                              >
                                {episode.name}
                              </button>
                            ))}
                          </div>
                        </Tabs.TabPane>
                      );
                    })}
                  </Tabs>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <span style={{ fontWeight: 600 }}>流式搜索</span>
          </div>
        }
        open={streamSearchModalVisible}
        onCancel={() => {
          if (streamSearchLoading) {
            stopStreamSearch()
          }
          closeVideo()
          setStreamSearchModalVisible(false)
        }}
        footer={null}
        width={1000}
        style={{ top: '5vh' }}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <Select
              value={streamSearchCategory}
              onChange={(value) => setStreamSearchCategory(value)}
              style={{ width: 150 }}
              size="large"
            >
              {categories.map((category) => (
                <Option key={category} value={category}>
                  {category === 'all' ? '全部分类' : category}
                </Option>
              ))}
            </Select>
            <Input
              placeholder="输入影视名称开始搜索..."
              value={streamSearchKeyword}
              onChange={(e) => setStreamSearchKeyword(e.target.value)}
              onPressEnter={handleStreamSearch}
              style={{ flex: 1 }}
              size="large"
              prefix={<SearchOutlined />}
              disabled={streamSearchLoading}
            />
            {streamSearchLoading ? (
              <Button
                type="primary"
                danger
                onClick={stopStreamSearch}
                loading={streamSearchLoading}
                size="large"
              >
                停止
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleStreamSearch}
                size="large"
              >
                搜索
              </Button>
            )}
          </div>
        </div>

        {streamSearchLogs.length > 0 && (
          <div
            style={{
              background: '#1e1e1e',
              color: '#d4d4d4',
              padding: '12px',
              borderRadius: '8px',
              maxHeight: '150px',
              overflowY: 'auto',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '13px',
              marginBottom: '16px'
            }}
          >
            {streamSearchLogs.map((log, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                <span style={{ color: '#808080', marginRight: '8px' }}>[{log.time}]</span>
                <span style={{
                  color: log.type === 'success' ? '#4ec9b0' : log.type === 'error' ? '#f44747' : '#569cd6'
                }}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {streamSearchResults.length > 0 && (
          <div>
            <div style={{ marginBottom: '12px', color: '#666' }}>
              已找到 <span style={{ color: '#1890ff', fontWeight: 600 }}>{streamSearchResults.length}</span> 条结果
            </div>
            <Table
              rowKey={(record, index) => record.title + index}
              dataSource={streamSearchResults}
              pagination={{
                current: streamSearchPagination.current,
                pageSize: streamSearchPagination.pageSize,
                total: streamSearchResults.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条结果`,
                onChange: handleStreamSearchPageChange,
                onShowSizeChange: handleStreamSearchPageChange
              }}
              scroll={{ y: 400 }}
              columns={[
                {
                  title: '📺 名称',
                  dataIndex: 'title',
                  key: 'title',
                  ellipsis: true,
                  width: 200
                },
                {
                  title: '📅 年份',
                  dataIndex: 'year',
                  key: 'year',
                  width: 80,
                  align: 'center'
                },
                {
                  title: '🎬 类型',
                  dataIndex: 'type',
                  key: 'type',
                  width: 100,
                  align: 'center',
                  render: (type) => type ? <Tag color="blue">{type}</Tag> : '-'
                },
                {
                  title: '🔗 来源',
                  dataIndex: 'sourceName',
                  key: 'sourceName',
                  width: 120,
                  ellipsis: true,
                  render: (name) => <Tag color="purple">{name}</Tag>
                },
                {
                  title: '📝 简介',
                  dataIndex: 'desc',
                  key: 'desc',
                  ellipsis: true,
                  render: (desc, record) => (
                    <span
                      style={{ cursor: 'pointer', color: '#1890ff' }}
                      onClick={() => {
                        setSelectedMovie(record)
                        setMovieDetailModalVisible(true)
                      }}
                    >
                      {desc || '点击查看详情'}
                    </span>
                  )
                },
                {
                  title: '🔗 操作',
                  key: 'action',
                  width: 100,
                  align: 'center',
                  render: (_, record) => (
                    <Button
                      type="default"
                      size="small"
                      onClick={() => {
                        setSelectedMovie(record)
                        setMovieDetailModalVisible(true)
                      }}
                    >
                      详情
                    </Button>
                  )
                }
              ]}
            />
          </div>
        )}

        {!streamSearchLoading && streamSearchResults.length === 0 && streamSearchLogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Alert
              message="开始搜索"
              description="输入关键词，点击搜索按钮开始流式搜索"
              type="info"
              showIcon
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default VodSources