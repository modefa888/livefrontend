import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  Button,
  Table,
  Spin,
  Alert,
  Tag,
  Badge,
  Input,
  Select,
  Row,
  Col,
  Modal,
  Image,
  Space,
  message,
  Progress,
  Pagination,
  Tabs,
  Tooltip
} from 'antd'
import {
  ReloadOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  GlobalOutlined,
  CloseOutlined,
  LinkOutlined,
  AppstoreOutlined,
  TableOutlined
} from '@ant-design/icons'
import api from '../utils/api'
import Hls from 'hls.js'

const { Search } = Input
const { Option } = Select

const VodAggregated = () => {
  // 状态管理
  const [aggregatedVodSources, setAggregatedVodSources] = useState([])
  const [domainGroups, setDomainGroups] = useState([])
  const [aggregatedLoading, setAggregatedLoading] = useState(false)
  const [vodViewType, setVodViewType] = useState('aggregated')
  const [pinging, setPinging] = useState(false)
  const [pingProgress, setPingProgress] = useState(0)
  const [pingResults, setPingResults] = useState([])
  
  // 搜索相关状态
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchCategory, setSearchCategory] = useState('all')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchModalVisible, setSearchModalVisible] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [movieDetailModalVisible, setMovieDetailModalVisible] = useState(false)
  
  // 视频播放相关状态
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [currentVideoUrl, setCurrentVideoUrl] = useState('')
  const [currentEpisodeName, setCurrentEpisodeName] = useState('')
  const videoRef = useRef(null)
  
  // 流式搜索相关状态
  const [streamSearchModalVisible, setStreamSearchModalVisible] = useState(false)
  const [streamSearchKeyword, setStreamSearchKeyword] = useState('')
  const [streamSearchCategory, setStreamSearchCategory] = useState('all')
  const [streamSearchResults, setStreamSearchResults] = useState([])
  const [streamSearchLoading, setStreamSearchLoading] = useState(false)
  const [streamSearchLogs, setStreamSearchLogs] = useState([])
  const [streamSearchTotal, setStreamSearchTotal] = useState(0)
  const [streamSearchPagination, setStreamSearchPagination] = useState({ current: 1, pageSize: 10 })
  const [streamSearchViewType, setStreamSearchViewType] = useState('table')
  const streamSearchEventSourceRef = useRef(null)
  
  // 分类列表
  const categories = ['all', 'normal', 'adult']

  // hls.js 视频播放处理
  useEffect(() => {
    if (videoPlaying && currentVideoUrl && videoRef.current) {
      const video = videoRef.current
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          startLevel: 0
        })
        hls.loadSource(currentVideoUrl)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(err => {
            console.error('播放失败:', err)
            message.warning('视频可能需要手动点击播放按钮或源已失效')
          })
        })
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('HLS 错误:', data)
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              message.error('网络错误或跨域限制，可能需要使用代理或更换源')
            } else {
              message.error('视频加载失败，可能源已失效')
            }
          }
        })
        return () => hls.destroy()
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentVideoUrl
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(err => {
            console.error('播放失败:', err)
            message.warning('视频可能需要手动点击播放按钮或源已失效')
          })
        })
      }
    }
  }, [videoPlaying, currentVideoUrl])

  // 获取聚合影视资源
  const fetchAggregatedVodSources = async (limit = 50) => {
    setAggregatedLoading(true)
    try {
      const response = await api.get(`/api/vod-aggregated/aggregated?limit=${limit}`)
      setAggregatedVodSources(response.data.sources || [])
    } catch (error) {
      console.error('获取聚合资源失败:', error)
      message.error('获取聚合资源失败')
    } finally {
      setAggregatedLoading(false)
    }
  }

  // 获取域名分组
  const fetchDomainGroups = async () => {
    setAggregatedLoading(true)
    try {
      const response = await api.get('/api/vod-aggregated/by-domain')
      setDomainGroups(response.data.domainGroups || [])
    } catch (error) {
      console.error('获取域名分组失败:', error)
      message.error('获取域名分组失败')
    } finally {
      setAggregatedLoading(false)
    }
  }

  // 初始化
  useEffect(() => {
    if (vodViewType === 'aggregated') {
      fetchAggregatedVodSources(50)
    } else {
      fetchDomainGroups()
    }
  }, [vodViewType])

  // 测试单个资源延迟
  const testSinglePing = async (source) => {
    try {
      message.loading({ content: '测试延迟中...', key: `ping-${source.id}` })
      const response = await api.post(`/api/vod-aggregated/ping/${source.id}`)
      if (response.data.success) {
        message.success({ content: `延迟: ${response.data.ping}ms`, key: `ping-${source.id}` })
        if (vodViewType === 'aggregated') {
          fetchAggregatedVodSources(50)
        } else {
          fetchDomainGroups()
        }
      } else {
        message.error({ content: '测试失败', key: `ping-${source.id}` })
      }
    } catch (error) {
      console.error('测试延迟失败:', error)
      message.error('测试延迟失败')
    }
  }

  // 批量测试延迟
  const testAllPings = async () => {
    setPinging(true)
    setPingProgress(0)
    setPingResults([])
    
    try {
      const response = await api.post('/api/vod-aggregated/ping/batch')
      if (response.data.success) {
        const successCount = response.data.results.filter(r => r.success).length
        const totalCount = response.data.results.length
        setPingResults(response.data.results)
        message.success(`测试完成! 成功: ${successCount}/${totalCount}`)
        
        // 刷新数据
        if (vodViewType === 'aggregated') {
          fetchAggregatedVodSources(50)
        } else {
          fetchDomainGroups()
        }
      }
    } catch (error) {
      console.error('批量测试失败:', error)
      message.error('批量测试失败')
    } finally {
      setPinging(false)
      setPingProgress(100)
    }
  }

  // 聚合搜索
  const handleAggregateSearch = async () => {
    if (!searchKeyword.trim()) {
      message.warning('请输入搜索关键词')
      return
    }

    setSearching(true)
    try {
      const response = await api.get('/api/vod-aggregated/search/aggregate', {
        params: {
          keyword: searchKeyword,
          category: searchCategory
        }
      })

      if (response.data.success) {
        setSearchResults(response.data.list || [])
        setSearchModalVisible(true)
        message.success(`找到 ${response.data.total} 个结果`)
      }
    } catch (error) {
      console.error('聚合搜索失败:', error)
      message.error('聚合搜索失败')
    } finally {
      setSearching(false)
    }
  }

  // 打开电影详情
  const openMovieDetail = (movie) => {
    setSelectedEpisode(null)
    setSelectedMovie(movie)
    setTimeout(() => {
      setMovieDetailModalVisible(true)
    }, 0)
  }

  // 流式搜索相关函数
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
      const url = new URL('/api/vod-aggregated/search/aggregate/stream', window.location.origin)
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

  // 选择剧集播放
  const handleEpisodeSelect = (episode) => {
    setCurrentVideoUrl(episode.url)
    setCurrentEpisodeName(episode.name)
    setVideoPlaying(true)
  }

  // 关闭视频
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

  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      width: 200,
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
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
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
      width: 120,
      render: (ping, record) => {
        if (ping === null) return (
          <Tag color="default">未测试</Tag>
        )
        let color = 'green'
        if (ping > 500) color = 'red'
        else if (ping > 200) color = 'orange'
        return (
          <Tag color={color}>
            <Space size={4}>
              <ThunderboltOutlined />
              {ping}ms
            </Space>
          </Tag>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => testSinglePing(record)}
          >
            测试延迟
          </Button>
          <a href={record.url} target="_blank" rel="noopener noreferrer">
            <Button size="small">访问</Button>
          </a>
        </Space>
      )
    }
  ]

  // 搜索结果表格列
  const searchColumns = [
    {
      title: '封面',
      dataIndex: 'pic',
      key: 'pic',
      width: 100,
      render: (pic) => (
        <Image
          width={60}
          height={80}
          src={pic || 'https://via.placeholder.com/60x80?text=No+Image'}
          style={{ objectFit: 'cover', borderRadius: '4px' }}
          preview={false}
        />
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true
    },
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
      width: 80
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100
    },
    {
      title: '来源',
      dataIndex: 'sourceName',
      key: 'sourceName',
      width: 120,
      render: (name) => <Tag color="blue">{name}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => openMovieDetail(record)}
        >
          查看详情
        </Button>
      )
    }
  ]

  return (
    <div style={{ padding: '20px' }}>


      <Spin spinning={aggregatedLoading}>
        <Card
          title={
            <Space>
              <GlobalOutlined />
              <span>聚合资源管理</span>
            </Space>
          }
          extra={
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                type={vodViewType === 'aggregated' ? 'primary' : 'default'}
                onClick={() => {
                  setVodViewType('aggregated')
                  if (aggregatedVodSources.length === 0) {
                    fetchAggregatedVodSources(50)
                  }
                }}
                icon={<ThunderboltOutlined />}
              >
                聚合视图
              </Button>
              <Button
                type={vodViewType === 'domain' ? 'primary' : 'default'}
                onClick={() => {
                  setVodViewType('domain')
                  if (domainGroups.length === 0) {
                    fetchDomainGroups()
                  }
                }}
                icon={<GlobalOutlined />}
              >
                分组视图
              </Button>
              <Button
                onClick={openStreamSearchModal}
              >
                ⚡ 流式搜索
              </Button>
              <Button
                icon={<ThunderboltOutlined />}
                type="primary"
                onClick={testAllPings}
                loading={pinging}
              >
                测试全部延迟
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  if (vodViewType === 'aggregated') {
                    fetchAggregatedVodSources(50)
                  } else {
                    fetchDomainGroups()
                  }
                }}
              >
                刷新
              </Button>
            </div>
          }
        >
          {pinging && (
            <Alert
              message="正在测试延迟..."
              description={<Progress percent={pingProgress} status="active" />}
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {vodViewType === 'domain' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Alert
                message="域名分组概览"
                description={`共 ${domainGroups.length} 个域名，保留延迟最低的源`}
                type="info"
                showIcon
              />
              {domainGroups.map(group => (
                <Card
                  key={group.domain}
                  size="small"
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <GlobalOutlined />
                        <span style={{ fontWeight: 500 }}>{group.domain}</span>
                      </Space>
                      <Tag color="blue">{group.sources.length} 个源</Tag>
                    </div>
                  }
                  style={{ background: '#fafafa' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <Badge status="success" text="最佳源" />
                      <strong>{group.bestSource.name}</strong>
                      <Tag color={group.bestSource.ping && group.bestSource.ping < 200 ? 'green' : group.bestSource.ping && group.bestSource.ping < 500 ? 'orange' : 'red'}>
                        {group.bestSource.ping ? `${group.bestSource.ping}ms` : '未测试'}
                      </Tag>
                      <a href={group.bestSource.url} target="_blank" rel="noopener noreferrer">
                        <Button size="small">访问</Button>
                      </a>
                      <Button
                        size="small"
                        icon={<ThunderboltOutlined />}
                        onClick={() => testSinglePing(group.bestSource)}
                      >
                        测试延迟
                      </Button>
                    </div>
                    {group.sources.length > 1 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e8e8e8' }}>
                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>其他源：</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {group.sources
                            .filter(s => s.id !== group.bestSource.id)
                            .map(s => (
                              <Tag key={s.id} color="default" style={{ padding: '4px 12px' }}>
                                {s.name}
                                <span style={{ marginLeft: '6px', color: '#999' }}>
                                  {s.ping ? `${s.ping}ms` : '-'}
                                </span>
                              </Tag>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div>
              <Alert
                message="去重后的优质源"
                description={`共 ${aggregatedVodSources.length} 个源，已按延迟排序，延迟越低的源越靠前`}
                type="success"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              <Table
                rowKey="id"
                dataSource={aggregatedVodSources}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 个源`
                }}
                columns={columns}
              />
            </div>
          )}
        </Card>
      </Spin>

      {/* 搜索结果模态框 */}
      <Modal
        title={
          <Space>
            <SearchOutlined />
            <span>聚合搜索结果</span>
            <Tag color="blue">{searchResults.length} 个结果</Tag>
          </Space>
        }
        open={searchModalVisible}
        onCancel={() => setSearchModalVisible(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setSearchModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <Table
          rowKey="uniqueId"
          dataSource={searchResults}
          columns={searchColumns}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个结果`
          }}
        />
      </Modal>

      {/* 电影详情模态框 */}
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
                        onClick={() => handleEpisodeSelect(episode)}
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
                                onClick={() => handleEpisodeSelect(episode)}
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

      {/* 流式搜索模态框 */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ color: '#666' }}>
                已找到 <span style={{ color: '#1890ff', fontWeight: 600 }}>{streamSearchResults.length}</span> 条结果
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  type={streamSearchViewType === 'table' ? 'primary' : 'default'}
                  icon={<TableOutlined />}
                  onClick={() => setStreamSearchViewType('table')}
                  size="small"
                >
                  表格视图
                </Button>
                <Button
                  type={streamSearchViewType === 'card' ? 'primary' : 'default'}
                  icon={<AppstoreOutlined />}
                  onClick={() => setStreamSearchViewType('card')}
                  size="small"
                >
                  卡片视图
                </Button>
              </div>
            </div>
            
            {streamSearchViewType === 'table' ? (
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
            ) : (
              <div>
                <Row gutter={[16, 16]}>
                  {(() => {
                    const start = (streamSearchPagination.current - 1) * streamSearchPagination.pageSize
                    const end = start + streamSearchPagination.pageSize
                    const paginatedData = streamSearchResults.slice(start, end)
                    
                    return paginatedData.map((record, index) => (
                      <Col xs={24} sm={12} md={8} lg={6} key={record.title + index}>
                        <Card
                          hoverable
                          style={{ height: '100%' }}
                          onClick={() => {
                            setSelectedMovie(record)
                            setMovieDetailModalVisible(true)
                          }}
                        >
                          <div style={{ margin: '-16px -16px 16px -16px' }}>
                            <div style={{ height: '200px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                              {record.pic ? (
                                <img
                                  alt={record.title}
                                  src={record.pic}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{ fontSize: '48px', color: '#999' }}>
                                  🎬
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div style={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '14px',
                            fontWeight: 500,
                            marginBottom: '8px'
                          }}>
                            {record.title}
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                            <span style={{ color: '#666', fontSize: '12px' }}>
                              {record.year || '未知'}
                            </span>
                            <Tag color="purple" size="small" style={{ margin: 0 }}>
                              {record.sourceName}
                            </Tag>
                          </div>
                          
                          {record.type && (
                            <div style={{ marginBottom: '8px' }}>
                              <Tag color="blue" size="small">
                                {record.type}
                              </Tag>
                            </div>
                          )}
                          
                          <div style={{
                            color: '#999',
                            fontSize: '12px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.4',
                            marginBottom: '12px'
                          }}>
                            {record.desc || '暂无简介'}
                          </div>
                          
                          <Button type="primary" size="small" block icon={<PlayCircleOutlined />}>
                            查看详情
                          </Button>
                        </Card>
                      </Col>
                    ))
                  })()}
                </Row>
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <Pagination
                    current={streamSearchPagination.current}
                    pageSize={streamSearchPagination.pageSize}
                    total={streamSearchResults.length}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total) => `共 ${total} 条结果`}
                    onChange={handleStreamSearchPageChange}
                    onShowSizeChange={handleStreamSearchPageChange}
                  />
                </div>
              </div>
            )}
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

export default VodAggregated
