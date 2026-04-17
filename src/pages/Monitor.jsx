import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Badge, message, Spin, Input, Tabs } from 'antd'
import api from '../utils/api'

const { TabPane } = Tabs

const Monitor = () => {
  const [liveStatus, setLiveStatus] = useState(null)
  const [systemStatus, setSystemStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('live')
  const [intervalMinutes, setIntervalMinutes] = useState(5) // 默认5分钟
  const [intervalLoading, setIntervalLoading] = useState(false)
  const [startLoading, setStartLoading] = useState(false)
  const [stopLoading, setStopLoading] = useState(false)

  // 获取监控状态
  const fetchMonitorStatus = async (type) => {
    setLoading(true)
    try {
      
      const response = await api.get(`/api/monitor/${type}`)
      
      switch (type) {
        case 'live':
          setLiveStatus(response.data)
          break
        case 'system':
          setSystemStatus(response.data)
          break
        default:
          break
      }
    } catch (error) {
      message.error('获取监控状态失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 启动监控
  const startMonitor = async (type) => {
    setStartLoading(true)
    try {
      
      await api.post('/api/monitor/start', { type })
      message.success('监控启动成功')
      fetchMonitorStatus(type)
    } catch (error) {
      message.error('启动监控失败')
      console.error(error)
    } finally {
      setStartLoading(false)
    }
  }

  // 停止监控
  const stopMonitor = async (type) => {
    setStopLoading(true)
    try {
      
      await api.post('/api/monitor/stop', { type })
      message.success('监控停止成功')
      fetchMonitorStatus(type)
    } catch (error) {
      message.error('停止监控失败')
      console.error(error)
    } finally {
      setStopLoading(false)
    }
  }

  // 设置监控频率
  const setMonitorInterval = async (type) => {
    setIntervalLoading(true)
    try {
      
      await api.post('/api/monitor/interval', { type, minutes: intervalMinutes })
      message.success(`监控频率已设置为 ${intervalMinutes} 分钟`)
    } catch (error) {
      message.error('设置监控频率失败')
      console.error(error)
    } finally {
      setIntervalLoading(false)
    }
  }

  // 获取监控频率设置
  const fetchMonitorInterval = async () => {
    if (selectedType === 'live') {
      try {
        
        const response = await api.get(`/api/monitor/interval?type=${selectedType}`)
        if (response.data.success) {
          setIntervalMinutes(response.data.interval)
        }
      } catch (error) {
        console.error('获取监控频率失败:', error)
      }
    }
  }

  // 初始化时获取监控状态和频率设置
  useEffect(() => {
    fetchMonitorStatus(selectedType)
    fetchMonitorInterval()
  }, [selectedType])

  // 直播监控表格列
  const liveColumns = [
    {
      title: '主播名称',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username)
    },
    {
      title: '平台',
      dataIndex: 'site',
      key: 'site',
      sorter: (a, b) => a.site.localeCompare(b.site)
    },
    {
      title: '直播状态',
      dataIndex: 'isLive',
      key: 'isLive',
      sorter: (a, b) => (a.isLive ? 1 : 0) - (b.isLive ? 1 : 0),
      render: (isLive) => (
        <Badge status={isLive ? 'success' : 'default'} text={isLive ? '直播中' : '未直播'} />
      )
    },
    {
      title: '直播间地址',
      dataIndex: 'targetUrl',
      key: 'targetUrl',
      render: (targetUrl) => targetUrl ? (
        <a href={targetUrl} target="_blank" rel="noopener noreferrer">
          前往直播间
        </a>
      ) : '-'
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
      render: (updatedAt) => new Date(updatedAt).toLocaleString()
    }
  ]



  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>监控管理</h1>
      
      <Tabs 
        defaultActiveKey="live" 
        onChange={setSelectedType}
        style={{ marginBottom: '20px' }}
      >
        <TabPane tab="直播监控" key="live" />
        <TabPane tab="系统监控" key="system" />
      </Tabs>

      <Spin spinning={loading}>
        {selectedType === 'live' && liveStatus && (
          <Card 
            title={`直播监控 (${liveStatus.liveCount}/${liveStatus.totalCount})`}
            extra={
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Button 
                  type="primary" 
                  onClick={() => startMonitor(selectedType)}
                  disabled={liveStatus?.isRunning}
                  loading={startLoading}
                >
                  {liveStatus?.isRunning ? (
                    <span style={{ color: '#1890ff' }}>
                      <span style={{ animation: 'blink 1s infinite' }}>🟢</span> 监控中
                    </span>
                  ) : '启动监控'}
                </Button>
                <Button 
                  onClick={() => stopMonitor(selectedType)}
                  disabled={!liveStatus?.isRunning}
                  loading={stopLoading}
                >
                  停止监控
                </Button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Input
                    type="number"
                    placeholder="频率(分钟)"
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(e.target.value)}
                    style={{ width: 100 }}
                    min={1}
                    max={60}
                  />
                  <Button 
                    onClick={() => setMonitorInterval(selectedType)}
                    loading={intervalLoading}
                  >
                    设置
                  </Button>
                </div>
              </div>
            }
          >
            <Table 
              columns={liveColumns} 
              dataSource={liveStatus.statusList} 
              rowKey="id"
            />
          </Card>
        )}

        {selectedType === 'system' && systemStatus && (
          <Card 
            title="系统监控"
            extra={
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Button 
                  type="primary" 
                  onClick={() => startMonitor(selectedType)}
                  disabled={systemStatus?.isRunning}
                  loading={startLoading}
                >
                  {systemStatus?.isRunning ? (
                    <span style={{ color: '#1890ff' }}>
                      <span style={{ animation: 'blink 1s infinite' }}>🟢</span> 监控中
                    </span>
                  ) : '启动监控'}
                </Button>
                <Button 
                  onClick={() => stopMonitor(selectedType)}
                  disabled={!systemStatus?.isRunning}
                  loading={stopLoading}
                >
                  停止监控
                </Button>
              </div>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <h3>系统信息</h3>
                <p>平台: {systemStatus.systemInfo.platform}</p>
                <p>架构: {systemStatus.systemInfo.arch}</p>
                <p>版本: {systemStatus.systemInfo.release}</p>
                <p>主机名: {systemStatus.systemInfo.hostname}</p>
                <p>运行时间: {Math.floor(systemStatus.systemInfo.uptime / 3600)} 小时</p>
              </div>
              <div>
                <h3>资源使用</h3>
                <p>CPU: {systemStatus.systemInfo.cpu.count} 核心</p>
                <p>内存: {systemStatus.systemInfo.memory?.used || 'N/A'} / {systemStatus.systemInfo.memory?.total || 'N/A'}</p>
                <p>磁盘: {systemStatus.diskInfo?.used || 'N/A'} / {systemStatus.diskInfo?.total || 'N/A'}</p>
                <p>数据库状态: {systemStatus.dbStatus}</p>
              </div>
            </div>
          </Card>
        )}


      </Spin>
    </div>
  )
}

export default Monitor