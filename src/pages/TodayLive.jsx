import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Spin, message, Tag, Tooltip, Tabs, Button, Image } from 'antd'
import { VideoCameraOutlined, LinkOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { TabPane } = Tabs

// 添加CSS动画样式
const styles = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(82, 196, 26, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
    }
  }
`

// 注入样式
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}

function TodayLive() {
  const [activeTab, setActiveTab] = useState('live') // 'live' or 'offline'
  const [liveStatus, setLiveStatus] = useState([]) // 直播中
  const [offlineStatus, setOfflineStatus] = useState([]) // 今日下播
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false) // 是否为管理员
  const [isViewingAll, setIsViewingAll] = useState(false) // 是否查看所有主播

  useEffect(() => {
    const fetchLiveHistory = async () => {
      try {
        setLoading(true)
        const response = await api.get('/api/logs/live-history')
        
        // 更新用户权限信息
        if (response.data.isAdmin !== undefined) {
          setIsAdmin(response.data.isAdmin)
        }
        
        // 过滤出今天的直播记录
        const today = new Date()
        const todayYear = today.getFullYear()
        const todayMonth = today.getMonth() + 1
        const todayDay = today.getDate()
        
        const todayRecords = (response.data.data || []).filter(record => {
          const recordDate = new Date(record.day)
          return recordDate.getFullYear() === todayYear &&
                 recordDate.getMonth() + 1 === todayMonth &&
                 recordDate.getDate() === todayDay
        })
        
        // 分离直播中和已结束的直播
        const live = todayRecords.filter(record => !record.endLive || record.endLive === '-')
        const offline = todayRecords.filter(record => record.endLive && record.endLive !== '-')
        
        setLiveStatus(live)
        setOfflineStatus(offline)
      } catch (error) {
        console.error('获取直播历史失败:', error)
        message.error('获取直播历史失败')
      } finally {
        setLoading(false)
      }
    }

    fetchLiveHistory()
  }, [])

  // 格式化时间
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    // 检查是否是时间戳字符串，如果是则转换为数字
    const timestamp = typeof dateString === 'string' && !isNaN(dateString) ? parseInt(dateString) : dateString
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  }

  // 提取URL的域名
  const getDomain = (url) => {
    if (!url) return ''
    try {
      const domain = new URL(url).hostname
      return domain
    } catch (error) {
      return url
    }
  }

  // 计算下播时间差
  const getOfflineTime = (endTime) => {
    console.log('endTime:', endTime)
    if (!endTime || endTime === '-') return ''
    
    try {
      // 直接使用时间戳计算
      const endTimestamp = typeof endTime === 'string' ? parseInt(endTime) : endTime
      console.log('endTimestamp:', endTimestamp)
      
      const nowTimestamp = Date.now()
      console.log('nowTimestamp:', nowTimestamp)
      
      const diffMs = nowTimestamp - endTimestamp
      console.log('时间差(毫秒):', diffMs)
      
      const diffMins = Math.floor(diffMs / 60000)
      console.log('时间差(分钟):', diffMins)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)
      
      if (diffDays > 0) {
        return `${diffDays}天前`
      } else if (diffHours > 0) {
        return `${diffHours}小时前`
      } else if (diffMins > 0) {
        return `${diffMins}分钟前`
      } else {
        return '刚刚'
      }
    } catch (error) {
      console.error('时间计算错误:', error)
      return ''
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin size="large" /></div>
  }

  // 切换查看所有主播或自己关注的主播
  const handleToggleView = async () => {
    try {
      setLoading(true)
      let url, messageText
      
      if (isViewingAll) {
        // 切换回查看自己关注的主播
        url = '/api/logs/live-history'
        messageText = '已切换到关注主播模式'
      } else {
        // 切换到查看所有主播
        url = '/api/logs/live-history/all'
        messageText = '已切换到所有主播模式'
      }
      
      const response = await api.get(url)
      
      // 过滤出今天的直播记录
      const today = new Date()
      const todayYear = today.getFullYear()
      const todayMonth = today.getMonth() + 1
      const todayDay = today.getDate()
      
      const todayRecords = (response.data.data || []).filter(record => {
        const recordDate = new Date(record.day)
        return recordDate.getFullYear() === todayYear &&
               recordDate.getMonth() + 1 === todayMonth &&
               recordDate.getDate() === todayDay
      })
      
      // 分离直播中和已结束的直播
      const live = todayRecords.filter(record => !record.endLive || record.endLive === '-')
      const offline = todayRecords.filter(record => record.endLive && record.endLive !== '-')
      
      setLiveStatus(live)
      setOfflineStatus(offline)
      setIsViewingAll(!isViewingAll)
      message.success(messageText)
    } catch (error) {
      console.error('获取直播历史失败:', error)
      message.error('获取直播历史失败')
    } finally {
      setLoading(false)
    }
  }

  // 渲染卡片内容
  const renderCard = (record) => (
    <Col key={record.id || Math.random()} span={12}>
      <Card hoverable style={{ height: '100%', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', gap: '12px', height: '100%', flexWrap: 'wrap' }}>
          {/* 左侧图片 */}
          {record.pic && (
            <div style={{ flex: 1, flexShrink: 0, maxWidth: '120px', display: 'flex', alignItems: 'center' }}>
              <Image 
                src={record.pic} 
                alt={record.username} 
                style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                preview={{
                  mask: '点击放大'
                }}
              />
            </div>
          )}
          {/* 右侧信息 */}
          <div style={{ flex: 1, minWidth: '0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px', flex: 1, minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.username}</span>
              <Tag 
                color={!record.endLive || record.endLive === '-' ? 'green' : 'orange'} 
                style={{
                  animation: (!record.endLive || record.endLive === '-') ? 'pulse 2s infinite' : 'none',
                  boxShadow: (!record.endLive || record.endLive === '-') ? '0 0 10px rgba(82, 196, 26, 0.5)' : 'none',
                  marginLeft: '8px'
                }}
              >
                {!record.endLive || record.endLive === '-' ? '🟢 直播中' : `✅ 下播 ${getOfflineTime(record.endLive)}`}
              </Tag>
            </div>
            {record.title && (
              <div style={{ marginBottom: '8px' }}>
                <Tag color="blue" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {record.title}
                </Tag>
              </div>
            )}
            <div style={{ marginBottom: '8px', wordBreak: 'break-all' }}>
              <p style={{ margin: '4px 0', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <span>平台: {record.site}</span>
                {record.targetUrl && (
                  <>
                    <span>{getDomain(record.targetUrl)}</span>
                    <span>
                      <a href={record.targetUrl} target="_blank" rel="noopener noreferrer" style={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="前往直播间">
                          <LinkOutlined style={{ marginRight: '4px' }} /> 直播间
                        </Tooltip>
                      </a>
                    </span>
                  </>
                )}
              </p>
              <p style={{ margin: '4px 0' }}>日期: {record.day}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', flexWrap: 'wrap', gap: '8px' }}>
              <span>开始: {formatDate(record.startLive)}</span>
              <span>结束: <span style={{ color: '#ff4d4f' }}>{formatDate(record.endLive)}</span></span>
            </div>
          </div>
        </div>
      </Card>
    </Col>
  )

  // 计算今日直播统计数据
  const calculateStats = () => {
    // 直播中数量
    const liveCount = liveStatus.length
    // 今日下播数量
    const offlineCount = offlineStatus.length
    // 今日总直播次数
    const totalCount = liveCount + offlineCount
    
    return {
      liveCount,
      offlineCount,
      totalCount
    }
  }

  const stats = calculateStats()

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>📺 今日直播管理</h1>
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} style={{ textAlign: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>{stats.liveCount}</div>
            <div style={{ marginTop: '8px', color: '#666' }}>直播中</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} style={{ textAlign: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>{stats.offlineCount}</div>
            <div style={{ marginTop: '8px', color: '#666' }}>今日下播</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} style={{ textAlign: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>{stats.totalCount}</div>
            <div style={{ marginTop: '8px', color: '#666' }}>主播直播数</div>
          </Card>
        </Col>
      </Row>
      
      {/* 今日直播状态 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card 
            title="今日直播状态" 
            extra={
              isAdmin && (
                <Button 
                  type={isViewingAll ? "default" : "primary"}
                  onClick={() => handleToggleView()}
                >
                  {isViewingAll ? "查看关注主播" : "查看所有主播"}
                </Button>
              )
            }
          >
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab} 
              style={{ marginBottom: '16px' }}
            >
              <TabPane tab="直播中" key="live" />
              <TabPane tab="今日下播" key="offline" />
            </Tabs>
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <Spin size="large" />
              </div>
            ) : activeTab === 'live' ? (
              liveStatus.length > 0 ? (
                <div style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'hidden' }}>
                  <Row gutter={[16, 16]}>
                    {liveStatus.map(renderCard)}
                  </Row>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <VideoCameraOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                  <p style={{ marginTop: '16px', color: '#999' }}>😴 当前没有直播中的主播</p>
                </div>
              )
            ) : (
              offlineStatus.length > 0 ? (
                <div style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'hidden' }}>
                  <Row gutter={[16, 16]}>
                    {offlineStatus.map(renderCard)}
                  </Row>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <VideoCameraOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                  <p style={{ marginTop: '16px', color: '#999' }}>📅 今日没有下播的主播</p>
                </div>
              )
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default TodayLive