import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Spin, message, List, Avatar, Tag, Progress, Badge, Tooltip, Image } from 'antd'
import { UserOutlined, VideoCameraOutlined, SettingOutlined, FileTextOutlined, CheckCircleOutlined, EditOutlined, DeleteOutlined, PlusOutlined, RobotOutlined, MessageOutlined, TeamOutlined, LogoutOutlined, DatabaseOutlined, BarChartOutlined, BellOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import packageData from '../../package.json'

function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentOperations, setRecentOperations] = useState([])
  const [botStatus, setBotStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [todayLiveRecords, setTodayLiveRecords] = useState([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 获取用户信息，检查权限级别
        const userResponse = await api.get('/api/auth/me')
        
        const userData = userResponse.data
        setUser(userData)
        const user = userData
        
        if (user.permissionLevel === 2 || user.permissionLevel === 3) {
          // 管理员和超级管理员获取所有统计数据
          const response = await api.get('/api/logs/stats')
          setStats(response.data)
          setBackendVersion(response.data.version || '')
        } else {
          // 普通用户获取自己的数据
          const [vtbsResponse, groupsResponse, statsResponse] = await Promise.all([
            api.get('/api/vtbs'),
            api.get('/api/bot/groups'),
            api.get('/api/logs/stats')
          ])
          
          // 过滤出用户自己的主播和群组
          const userVtbs = vtbsResponse.data.filter(vtb => vtb.createdBy === user.id)
          const userGroups = groupsResponse.data.filter(group => group.userId === user.id.toString())
          
          // 构建普通用户的统计数据
          setStats({
            vtbsCount: userVtbs.length,
            todayLiveCount: userVtbs.filter(vtb => vtb.liveStatus === '1').length,
            groupsCount: userGroups.length,
            usersCount: 1,
            settingsCount: 0,
            todayMessageCount: 0,
            systemLogsCount: 0,
            monitorLogsCount: 0,
            operationLogsCount: 0,
            mysqlStatus: '正常',
            requestCount: 0,
            timestamp: new Date().toISOString()
          })
          setBackendVersion(statsResponse.data.version || '')
        }
      } catch (error) {
        message.error('获取统计数据失败')
        console.error('获取统计数据失败:', error)
      }
    }

    const fetchRecentOperations = async () => {
      try {
        const response = await api.get('/api/operation-logs/me', {
          params: {
            page: 1,
            limit: 10
          }
        })
        setRecentOperations(response.data.logs)
      } catch (error) {
        console.error('获取最近操作记录失败:', error)
      }
    }

    const fetchBotStatus = async () => {
      try {
        const response = await api.get('/api/bot/status')
        setBotStatus(response.data)
      } catch (error) {
        console.error('获取机器人状态失败:', error)
      }
    }

    const fetchTodayLiveRecords = async () => {
      try {
        const response = await api.get('/api/logs/live-history')
        
        // 确保response.data.data是一个数组
        const liveHistory = Array.isArray(response.data.data) ? response.data.data : []
        
        // 过滤出今天的直播记录
        const today = new Date()
        const todayYear = today.getFullYear()
        const todayMonth = today.getMonth() + 1
        const todayDay = today.getDate()
        
        const todayRecords = liveHistory.filter(record => {
          // 解析记录中的日期
          const recordDate = new Date(record.day)
          return recordDate.getFullYear() === todayYear &&
                 recordDate.getMonth() + 1 === todayMonth &&
                 recordDate.getDate() === todayDay
        })
        
        setTodayLiveRecords(todayRecords)
      } catch (error) {
        console.error('获取今天直播记录失败:', error)
      }
    }

    const fetchSystemStatus = async () => {
      try {
        const response = await api.get('/api/tools/system/status')
        setSystemStatus(response.data)
      } catch (error) {
        console.error('获取系统状态失败:', error)
      }
    }

    const fetchData = async () => {
      try {
        await Promise.all([fetchStats(), fetchRecentOperations(), fetchBotStatus(), fetchTodayLiveRecords(), fetchSystemStatus()])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 状态管理：后端版本号
  const [backendVersion, setBackendVersion] = useState('')
  // 状态管理：系统状态
  const [systemStatus, setSystemStatus] = useState(null)

  // 计算内存使用率
  const calculateMemoryUsage = () => {
    if (!systemStatus?.systemInfo?.memory) return 30
    
    const total = parseFloat(systemStatus.systemInfo.memory.total.replace(/[^0-9.]/g, ''))
    const free = parseFloat(systemStatus.systemInfo.memory.free.replace(/[^0-9.]/g, ''))
    
    if (total === 0) return 30
    
    return Math.round(((total - free) / total) * 100)
  }

  // 格式化时间
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    // 检查是否是时间戳字符串，如果是则转换为数字
    const timestamp = typeof dateString === 'string' && !isNaN(dateString) ? parseInt(dateString) : dateString
    const date = new Date(timestamp)
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
      default:
        return null
    }
  }

  // 获取操作类型标签
  const getOperationTag = (operationType) => {
    switch (operationType) {
      case 'add':
        return <Tag color="green">添加</Tag>
      case 'update':
        return <Tag color="blue">更新</Tag>
      case 'delete':
        return <Tag color="red">删除</Tag>
      default:
        return <Tag>{operationType}</Tag>
    }
  }

  // 获取目标类型文本
  const getTargetTypeText = (targetType) => {
    switch (targetType) {
      case 'vtb':
        return '主播'
      case 'user':
        return '用户'
      case 'setting':
        return '设置'
      default:
        return targetType
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin size="large" /></div>
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 版本号显示 */}
      <div style={{ 
        marginBottom: '24px', 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{ 
          fontSize: '14px', 
          color: '#666',
          display: 'flex',
          gap: '16px'
        }}>
          <span>前端版本: {packageData.version}</span>
          <span>后端版本: {backendVersion || '加载中...'}</span>
        </div>
      </div>
      {/* 顶部统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* 主播数量 - 所有用户都显示 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable onClick={() => navigate('/vtbs')} style={{ cursor: 'pointer' }}>
            <Statistic 
              title="主播数量" 
              value={stats?.vtbsCount || 0} 
              prefix={<VideoCameraOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        {/* 今日直播 - 所有用户都显示 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable onClick={() => navigate('/today-live')} style={{ cursor: 'pointer' }}>
            <Statistic 
              title="今日直播" 
              value={stats?.todayLiveCount || 0} 
              prefix={<VideoCameraOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        
        {/* 机器人群组 - 所有用户都显示 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable onClick={() => navigate('/bot-groups')} style={{ cursor: 'pointer' }}>
            <Statistic 
              title="机器人群组" 
              value={stats?.groupsCount || 0} 
              prefix={<TeamOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        
        {/* 以下卡片只对管理员和超级管理员显示 */}
        {(user?.permissionLevel === 2 || user?.permissionLevel === 3) && (
          <>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card hoverable onClick={() => navigate('/settings')} style={{ cursor: 'pointer' }}>
                <Statistic 
                  title="系统设置" 
                  value={stats?.settingsCount || 0} 
                  prefix={<SettingOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card hoverable onClick={() => navigate('/users')} style={{ cursor: 'pointer' }}>
                <Statistic 
                  title="用户数量" 
                  value={stats?.usersCount || 0} 
                  prefix={<UserOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card hoverable onClick={() => navigate('/logs')} style={{ cursor: 'pointer' }}>
                <Statistic 
                  title="今日消息" 
                  value={stats?.todayMessageCount || 0} 
                  prefix={<MessageOutlined style={{ color: '#eb2f96' }} />}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card hoverable onClick={() => navigate('/logs')} style={{ cursor: 'pointer' }}>
                <Statistic 
                  title="系统日志" 
                  value={stats?.systemLogsCount || 0} 
                  prefix={<FileTextOutlined style={{ color: '#fa541c' }} />}
                  valueStyle={{ color: '#fa541c' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card hoverable onClick={() => navigate('/monitor')} style={{ cursor: 'pointer' }}>
                <Statistic 
                  title="监控日志" 
                  value={stats?.monitorLogsCount || 0} 
                  prefix={<BellOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* 系统概览 - 只对管理员和超级管理员显示 */}
      {(user?.permissionLevel === 2 || user?.permissionLevel === 3) && (
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Card title="系统概览" extra={<BarChartOutlined />}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h4 style={{ marginBottom: '16px', color: '#666' }}>系统状态</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ marginRight: '8px' }}>🗃️ MySQL 连接:</span>
                    {stats?.mysqlStatus === '正常' ? 
                      <Badge status="success" text="正常" /> : 
                      <Badge status="error" text="异常" />
                    }
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ marginRight: '8px' }}>🤖 机器人状态:</span>
                    {botStatus?.isRunning ? 
                      <Badge status="success" text="运行中" /> : 
                      <Badge status="error" text="已停止" />
                    }
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ marginRight: '8px' }}>🚀 API 服务:</span>
                    <Badge status="success" text="运行正常" />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ marginRight: '8px' }}>📈 内存使用率:</span>
                    <Progress 
                      percent={calculateMemoryUsage()} 
                      size="small" 
                      status="normal" 
                    />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h4 style={{ marginBottom: '16px', color: '#666' }}>数据概览</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ marginRight: '8px' }}>主播总数:</span>
                    <strong>{stats?.vtbsCount || 0}</strong>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ marginRight: '8px' }}>今日直播:</span>
                    <strong>{stats?.todayLiveCount || 0}</strong>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ marginRight: '8px' }}>用户数量:</span>
                    <strong>{stats?.usersCount || 0}</strong>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ marginRight: '8px' }}>群组数量:</span>
                    <strong>{stats?.groupsCount || 0}</strong>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h4 style={{ marginBottom: '16px', color: '#666' }}>今日活动</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ marginRight: '8px' }}>消息发送:</span>
                    <strong>{stats?.todayMessageCount || 0}</strong>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ marginRight: '8px' }}>系统日志:</span>
                    <strong>{stats?.systemLogsCount || 0}</strong>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ marginRight: '8px' }}>监控日志:</span>
                    <strong>{stats?.monitorLogsCount || 0}</strong>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ marginRight: '8px' }}>操作日志:</span>
                    <strong>{stats?.operationLogsCount || 0}</strong>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* 今天直播记录 - 所有用户都显示 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="今天直播记录" extra={<VideoCameraOutlined />}>
            {todayLiveRecords.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
                <Row gutter={[16, 16]}>
                  {todayLiveRecords.map((record, index) => (
                    <Col key={record.id || index} span={12}>
                      <Card hoverable style={{ height: '100%' }}>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {/* 左侧信息 */}
                          <div style={{ flex: 1, minWidth: '0' }}>
                            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 'bold', flex: 1, minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.username}</span>
                              <Tag color="green" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: '8px' }}>{record.title}</Tag>
                            </div>
                            <div style={{ marginBottom: '8px', wordBreak: 'break-all' }}>
                              <p style={{ margin: '4px 0', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                <span>平台: {record.site}</span>
                                {record.targetUrl && (
                                  <span>
                                    <a href={record.targetUrl} target="_blank" rel="noopener noreferrer" style={{ whiteSpace: 'nowrap' }}>前往直播间</a>
                                  </span>
                                )}
                              </p>
                              <p style={{ margin: '4px 0' }}>日期: {record.day}</p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', flexWrap: 'wrap', gap: '8px' }}>
                              <span>开始: {formatDate(record.startLive)}</span>
                              <span>结束: <span style={{ color: '#ff4d4f' }}>{formatDate(record.endLive)}</span></span>
                            </div>
                          </div>
                          {/* 右侧图片 */}
                          {record.pic && (
                            <div style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                              <Image 
                                src={record.pic} 
                                alt={record.username} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                                preview={{
                                  mask: '点击放大'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <VideoCameraOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                <p style={{ marginTop: '16px', color: '#999' }}>今天没有直播记录</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>



      {/* 最近操作和系统状态 - 只对管理员和超级管理员显示 */}
      {(user?.permissionLevel === 2 || user?.permissionLevel === 3) && (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="最近操作" extra={<Tooltip title="最近10条操作记录"><FileTextOutlined /></Tooltip>}>
              {recentOperations.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={recentOperations}
                  style={{ maxHeight: '400px', overflowY: 'auto' }}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={getOperationIcon(item.operationType)} />}
                        title={
                          <div>
                            {getOperationTag(item.operationType)}
                            <span style={{ marginLeft: 8 }}>
                              {item.details || `${item.operationType}${getTargetTypeText(item.targetType)}: ${item.targetName}`}
                            </span>
                          </div>
                        }
                        description={formatDate(item.operationTime)}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <FileTextOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                  <p style={{ marginTop: '16px', color: '#999' }}>最近没有操作记录</p>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="系统状态" extra={<DatabaseOutlined />}>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '12px', color: '#666' }}>服务状态</h4>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ width: '120px', display: 'inline-block' }}>后端服务:</span>
                  <Badge status="success" text="运行中" />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ width: '120px', display: 'inline-block' }}>前端服务:</span>
                  <Badge status="success" text="运行中" />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ width: '120px', display: 'inline-block' }}>数据库服务:</span>
                  {stats?.mysqlStatus === '正常' ? 
                    <Badge status="success" text="正常" /> : 
                    <Badge status="error" text="异常" />
                  }
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ width: '120px', display: 'inline-block' }}>机器人服务:</span>
                  {botStatus?.isRunning ? 
                    <Badge status="success" text="运行中" /> : 
                    <Badge status="error" text="已停止" />
                  }
                </div>
              </div>
              
              {botStatus?.error && (
                <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '4px' }}>
                  <p style={{ margin: 0, color: '#cf1322' }}>⚠️ 机器人错误: {botStatus.error}</p>
                </div>
              )}
              
              <div>
                <h4 style={{ marginBottom: '12px', color: '#666' }}>系统信息</h4>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ width: '120px', display: 'inline-block' }}>请求次数:</span>
                  <strong>{stats?.requestCount || 0}</strong>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ width: '120px', display: 'inline-block' }}>更新时间:</span>
                  <span>{formatDate(stats?.timestamp)}</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}

export default Dashboard