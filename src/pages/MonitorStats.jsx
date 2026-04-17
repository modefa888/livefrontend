import React, { useState, useEffect } from 'react'
import { Card, Table, message, DatePicker, Button, Space, Input, Select, Statistic, Row, Col, Badge } from 'antd'
import { ReloadOutlined, FilterOutlined, DownloadOutlined } from '@ant-design/icons'
import api from '../utils/api'


const { RangePicker } = DatePicker
const { Option } = Select
const { Search } = Input

const MonitorStats = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    dateRange: null,
    keyword: ''
  })
  const [botStatus, setBotStatus] = useState(null) // 机器人状态
  const [botStatusLoading, setBotStatusLoading] = useState(false)

  // 列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (text) => {
        return new Date(parseInt(text)).toLocaleString('zh-CN')
      }
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (text) => {
        return new Date(parseInt(text)).toLocaleString('zh-CN')
      }
    },
    {
      title: '执行时间(秒)',
      dataIndex: 'elapsedTime',
      key: 'elapsedTime'
    },
    {
      title: '总扫描数',
      dataIndex: 'totalCount',
      key: 'totalCount'
    },
    {
      title: '成功数',
      dataIndex: 'successCount',
      key: 'successCount'
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (text) => {
        return `${text}%`
      }
    },
    {
      title: '在线主播',
      dataIndex: 'onlineCount',
      key: 'onlineCount'
    },
    {
      title: '离线主播',
      dataIndex: 'offlineCount',
      key: 'offlineCount'
    },
    {
      title: '非主播',
      dataIndex: 'nonStreamerCount',
      key: 'nonStreamerCount'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt'
    }
  ]

  // 获取监控统计数据
  const fetchMonitorStats = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/monitor/stats')
      setData(response.data)
    } catch (error) {
      message.error('获取监控统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取机器人状态
  const fetchBotStatus = async () => {
    setBotStatusLoading(true)
    try {
      // 调用新的API接口获取机器人状态
      const response = await api.get('/api/bot/status')
      // API返回的数据包含isRunning字段
      setBotStatus(response.data?.isRunning || false)
    } catch (error) {
      console.error('获取机器人状态失败:', error)
      // 发生错误时，默认设置为未监控
      setBotStatus(false)
    } finally {
      setBotStatusLoading(false)
    }
  }

  // 初始化数据
  useEffect(() => {
    fetchMonitorStats()
    fetchBotStatus()
  }, [])

  // 计算统计摘要
  const calculateSummary = () => {
    if (data.length === 0) {
      return {
        totalExecutions: 0,
        avgSuccessRate: 0,
        avgElapsedTime: 0,
        maxOnlineCount: 0
      }
    }

    const totalExecutions = data.length
    const totalSuccessRate = data.reduce((sum, item) => sum + parseFloat(item.successRate), 0)
    const totalElapsedTime = data.reduce((sum, item) => sum + parseFloat(item.elapsedTime), 0)
    const maxOnlineCount = Math.max(...data.map(item => item.onlineCount))

    return {
      totalExecutions,
      avgSuccessRate: (totalSuccessRate / totalExecutions).toFixed(2),
      avgElapsedTime: (totalElapsedTime / totalExecutions).toFixed(2),
      maxOnlineCount
    }
  }

  const summary = calculateSummary()

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>监控统计</h1>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <p style={{ color: '#666', marginBottom: 0, marginRight: '16px' }}>查看监控模块的执行统计数据</p>
          <span 
            className={`ant-tag ${botStatus ? 'ant-tag-green' : 'ant-tag-gray'}`} 
            style={{ 
              borderRadius: '4px',
              boxShadow: botStatus ? '0 0 10px rgba(82, 196, 26, 0.5)' : 'none',
              animation: botStatus ? 'pulse 2s infinite' : 'none',
              marginLeft: '8px'
            }}
          >
            {botStatus ? '🟢 监控中' : '🔴 未监控'}
          </span>
        </div>

        {/* 统计摘要 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic title="总执行次数" value={summary.totalExecutions} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="平均成功率" value={summary.avgSuccessRate} suffix="%" />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="平均执行时间" value={summary.avgElapsedTime} suffix="秒" />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="最高在线数" value={summary.maxOnlineCount} />
            </Card>
          </Col>
        </Row>

        {/* 筛选和操作栏 */}
        <Card style={{ marginBottom: '24px' }}>
          <Space style={{ marginBottom: '16px' }}>
            <RangePicker 
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              placeholder={['开始日期', '结束日期']}
            />
            <Search
              placeholder="搜索关键词"
              onSearch={(value) => setFilters({ ...filters, keyword: value })}
              style={{ width: 200 }}
            />
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={async () => {
                await fetchMonitorStats()
                await fetchBotStatus()
              }}
              loading={loading || botStatusLoading}
            >
              刷新
            </Button>
            <Button icon={<DownloadOutlined />}>
              导出
            </Button>
          </Space>
        </Card>
      </div>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>
    </div>
  )
}

export default MonitorStats