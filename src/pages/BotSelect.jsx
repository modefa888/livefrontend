import React, { useState, useEffect } from 'react'
import { Card, Button, Row, Col, Typography, Spin, message } from 'antd'
import { RobotOutlined, PlayCircleOutlined, PauseCircleOutlined, UserOutlined } from '@ant-design/icons'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'
import { useBotLoading } from '../contexts/BotLoadingContext'

const { Title, Text } = Typography

function BotSelect() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [livebotStatus, setLivebotStatus] = useState(null)
  const [fabuBotStatus, setFabuBotStatus] = useState(null)
  const { 
    livebotLoading, 
    setLivebotLoading, 
    fabuBotLoading, 
    setFabuBotLoading 
  } = useBotLoading()

  // 获取机器人状态
  const fetchStatus = async () => {
    try {
      setLoading(true)
      
      // 获取 livebot 状态
      try {
        const livebotResponse = await api.get('/api/bot/status')
        setLivebotStatus(livebotResponse.data)
      } catch (error) {
        console.error('获取 livebot 状态失败:', error)
      }
      
      // 获取 faBuBot 状态
      try {
        const fabuBotResponse = await api.get('/api/fabu-bot/status')
        setFabuBotStatus(fabuBotResponse.data)
      } catch (error) {
        console.error('获取 faBuBot 状态失败:', error)
      }
    } catch (error) {
      message.error('获取机器人状态失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 跳转到机器人管理页面
  const goToBotManager = (botType) => {
    navigate(`/bot/${botType}`)
  }

  // 启动机器人
  const startBot = async (botType) => {
    if (botType === 'livebot') {
      setLivebotLoading(true)
    } else {
      setFabuBotLoading(true)
    }
    try {
      if (botType === 'livebot') {
        await api.post('/api/bot/start')
        message.success('LiveBot 启动成功')
      } else {
        await api.post('/api/fabu-bot/start')
        message.success('FaBuBot 启动成功')
      }
      fetchStatus()
    } catch (error) {
      message.error('启动机器人失败')
      console.error(error)
    } finally {
      if (botType === 'livebot') {
        setLivebotLoading(false)
      } else {
        setFabuBotLoading(false)
      }
    }
  }

  // 停止机器人
  const stopBot = async (botType) => {
    if (botType === 'livebot') {
      setLivebotLoading(true)
    } else {
      setFabuBotLoading(true)
    }
    try {
      if (botType === 'livebot') {
        await api.post('/api/bot/stop')
        message.success('LiveBot 停止成功')
      } else {
        await api.post('/api/fabu-bot/stop')
        message.success('FaBuBot 停止成功')
      }
      fetchStatus()
    } catch (error) {
      message.error('停止机器人失败')
      console.error(error)
    } finally {
      if (botType === 'livebot') {
        setLivebotLoading(false)
      } else {
        setFabuBotLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh' 
      }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2} style={{ marginBottom: '30px' }}>机器人管理</Title>
      
      <Row gutter={[32, 32]}>
        {/* LiveBot */}
        <Col xs={24} md={12}>
          <Card 
            hoverable
            style={{ 
              cursor: 'pointer',
              border: '2px solid #1890ff',
              borderRadius: '8px'
            }}
            onClick={() => goToBotManager('livebot')}
            actions={[
              livebotStatus?.isRunning ? (
                <Button 
                  danger 
                  icon={<PauseCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    stopBot('livebot')
                  }}
                  loading={livebotLoading}
                  disabled={livebotLoading}
                >
                  停止
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    startBot('livebot')
                  }}
                  loading={livebotLoading}
                  disabled={livebotLoading}
                >
                  启动
                </Button>
              )
            ]}
          >
            <div style={{ textAlign: 'center' }}>
              <RobotOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={3} style={{ marginBottom: '8px' }}>LiveBot</Title>
              <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '16px' }}>
                直播监控机器人
              </Text>
              <div style={{ 
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '12px',
                backgroundColor: livebotStatus?.isRunning ? '#f6ffed' : '#fff2f0',
                color: livebotStatus?.isRunning ? '#52c41a' : '#ff4d4f',
                fontSize: '12px'
              }}>
                {livebotStatus?.isRunning ? '✅ 运行中' : '❌ 已停止'}
              </div>
            </div>
          </Card>
        </Col>

        {/* FaBuBot */}
        <Col xs={24} md={12}>
          <Card 
            hoverable
            style={{ 
              cursor: 'pointer',
              border: '2px solid #faad14',
              borderRadius: '8px'
            }}
            onClick={() => goToBotManager('fabu')}
            actions={[
              fabuBotStatus?.isRunning ? (
                <Button 
                  danger 
                  icon={<PauseCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    stopBot('fabu')
                  }}
                  loading={fabuBotLoading}
                  disabled={fabuBotLoading}
                >
                  停止
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    startBot('fabu')
                  }}
                  loading={fabuBotLoading}
                  disabled={fabuBotLoading}
                >
                  启动
                </Button>
              )
            ]}
          >
            <div style={{ textAlign: 'center' }}>
              <RobotOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
              <Title level={3} style={{ marginBottom: '8px' }}>FaBuBot</Title>
              <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '16px' }}>
                媒体管理机器人
              </Text>
              <div style={{ 
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '12px',
                backgroundColor: fabuBotStatus?.isRunning ? '#f6ffed' : '#fff2f0',
                color: fabuBotStatus?.isRunning ? '#52c41a' : '#ff4d4f',
                fontSize: '12px'
              }}>
                {fabuBotStatus?.isRunning ? '✅ 运行中' : '❌ 已停止'}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default BotSelect
