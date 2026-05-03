import React, { useState, useEffect } from 'react'
import { Card, Tabs, Table, Select, Spin, message, Input, Switch, Button, Badge, Tag, Tooltip, Modal, Descriptions } from 'antd'
import { SearchOutlined, PauseCircleOutlined, PlayCircleOutlined, DeleteOutlined, ClockCircleOutlined, VideoCameraOutlined, SendOutlined, ThunderboltOutlined, FileTextOutlined, UpOutlined, DownOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { Option } = Select

function Logs() {
  const [liveHistory, setLiveHistory] = useState([])
  const [sends, setSends] = useState([])
  const [logFiles, setLogFiles] = useState([])
  const [selectedLogFile, setSelectedLogFile] = useState('')
  const [logContent, setLogContent] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [matches, setMatches] = useState([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1)
  const [logType, setLogType] = useState('backend')
  const [botType, setBotType] = useState('livebot')
  const logContentRef = React.useRef(null)
  const searchInputRef = React.useRef(null)
  
  // 查看详情模态框状态
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [viewModalTitle, setViewModalTitle] = useState('')
  const [viewModalData, setViewModalData] = useState(null)
  
  // 实时日志相关状态
  const [realtimeLogs, setRealtimeLogs] = useState([])
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [isRealtimePaused, setIsRealtimePaused] = useState(false)
  const [realtimeLogType, setRealtimeLogType] = useState('all')
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [newLogCount, setNewLogCount] = useState(0)
  const realtimeLogRef = React.useRef(null)
  const eventSourceRef = React.useRef(null)
  
  const [loading, setLoading] = useState({
    liveHistory: true,
    sends: true,
    logFiles: true,
    logContent: false
  })

  useEffect(() => {
    fetchLiveHistory()
  }, [])

  useEffect(() => {
    fetchSends()
  }, [])

  useEffect(() => {
    fetchLogFiles()
  }, [logType, botType])

  const fetchLiveHistory = async () => {
    setLoading(prev => ({ ...prev, liveHistory: true }))
    try {
      const response = await api.get('/api/logs/live-history')
      setLiveHistory(Array.isArray(response.data.data) ? response.data.data : [])
    } catch (error) {
      message.error('获取直播历史记录失败')
    } finally {
      setLoading(prev => ({ ...prev, liveHistory: false }))
    }
  }

  const fetchSends = async () => {
    setLoading(prev => ({ ...prev, sends: true }))
    try {
      const response = await api.get('/api/logs/sends')
      setSends(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      message.error('获取发送记录失败')
    } finally {
      setLoading(prev => ({ ...prev, sends: false }))
    }
  }

  const fetchLogFiles = async () => {
    setLoading(prev => ({ ...prev, logFiles: true }))
    try {
      let url = `/api/logs/files?type=${logType}`
      if (logType === 'bot') {
        url += `&bot=${botType}`
      }
      const response = await api.get(url)
      setLogFiles(response.data)
    } catch (error) {
      message.error('获取日志文件列表失败')
    } finally {
      setLoading(prev => ({ ...prev, logFiles: false }))
    }
  }

  const fetchLogContent = async (filename) => {
    setLoading(prev => ({ ...prev, logContent: true }))
    try {
      let url = `/api/logs/files/${filename}?type=${logType}`
      if (logType === 'bot') {
        url += `&bot=${botType}`
      }
      const response = await api.get(url)
      setLogContent(response.data.content)
    } catch (error) {
      message.error('获取日志文件内容失败')
    } finally {
      setLoading(prev => ({ ...prev, logContent: false }))
    }
  }

  const handleLogFileChange = (filename) => {
    setSelectedLogFile(filename)
    if (filename) {
      fetchLogContent(filename)
    }
  }

  useEffect(() => {
    if (!searchKeyword || !logContent) {
      setMatches([])
      setCurrentMatchIndex(-1)
      return
    }

    const regex = new RegExp(`(${searchKeyword})`, 'gi')
    const newMatches = []
    let match
    
    while ((match = regex.exec(logContent)) !== null) {
      newMatches.push({
        start: match.index,
        end: match.index + match[0].length
      })
    }

    setMatches(newMatches)
    setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1)
  }, [searchKeyword, logContent])

  const navigateToNextMatch = () => {
    if (matches.length === 0) return
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length)
  }

  const navigateToPrevMatch = () => {
    if (matches.length === 0) return
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length)
  }

  useEffect(() => {
    if (currentMatchIndex === -1 || !logContentRef.current) return

    setTimeout(() => {
      const highlightedElements = logContentRef.current.querySelectorAll('span[style*="background-color: #faad14"]')
      if (highlightedElements.length > 0) {
        highlightedElements[0].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        })
      }
    }, 100)
  }, [currentMatchIndex, searchKeyword])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (searchInputRef.current && (document.activeElement === searchInputRef.current || document.activeElement === logContentRef.current)) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          navigateToPrevMatch();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          navigateToNextMatch();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, [navigateToPrevMatch, navigateToNextMatch])
  
  // 实时日志自动滚动
  useEffect(() => {
    if (realtimeLogRef.current && !isRealtimePaused) {
      const container = realtimeLogRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [realtimeLogs, isRealtimePaused])
  
  // 组件卸载时清理连接
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    }
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 连接实时日志（使用fetch + ReadableStream）
  const connectRealtimeLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/logs/realtime', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`连接失败: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      // 标记连接成功
      setIsRealtimeConnected(true);
      message.success('实时日志连接成功');

      // 读取数据流
      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'connected') {
                    console.log('连接成功消息:', data.message);
                    continue;
                  }
                  
                  if (!isRealtimePaused) {
                    setRealtimeLogs(prev => {
                      const newLogs = [...prev, data];
                      return newLogs.slice(-200);
                    });
                    setNewLogCount(prev => prev + 1);
                  } else {
                    setNewLogCount(prev => prev + 1);
                  }
                } catch (e) {
                }
              }
            }
          }
        } catch (e) {
          console.error('读取实时日志失败:', e);
        } finally {
          setIsRealtimeConnected(false);
        }
      };
      
      eventSourceRef.current = { close: () => reader.cancel() };
      
      readStream();
      
    } catch (error) {
      console.error('连接实时日志失败:', error);
      message.error('连接实时日志失败');
      setIsRealtimeConnected(false);
    }
  };

  // 断开实时日志连接
  const disconnectRealtimeLogs = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsRealtimeConnected(false);
      message.info('实时日志连接已断开');
    }
  };

  // 清除实时日志
  const clearRealtimeLogs = () => {
    setRealtimeLogs([]);
    setNewLogCount(0);
  };

  // 获取日志颜色
  const getLogColor = (content) => {
    if (content.toLowerCase().includes('error') || content.includes('❌')) {
      return '#ff4d4f';
    }
    if (content.toLowerCase().includes('warn') || content.includes('⚠️')) {
      return '#faad14';
    }
    if (content.toLowerCase().includes('success') || content.includes('✅')) {
      return '#52c41a';
    }
    if (content.toLowerCase().includes('info') || content.includes('ℹ️')) {
      return '#1890ff';
    }
    return '#d4d4d4';
  };

  const liveHistoryColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '主播',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (username) => (
        <Tag color="blue">{username}</Tag>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
          <Button 
            type="link" 
            size="small" 
            icon={<SearchOutlined />}
            style={{ padding: '0 4px', minWidth: 'auto', flexShrink: 0 }}
            onClick={() => {
              setViewModalTitle('直播历史详情')
              setViewModalData(record)
              setViewModalVisible(true)
            }}
          />
        </div>
      )
    },
    {
      title: '开始时间',
      dataIndex: 'startLive',
      key: 'startLive',
      width: 180,
      render: (timestamp) => {
        if (!timestamp) return '-';
        return <Tag color="green">{new Date(parseInt(timestamp)).toLocaleString()}</Tag>;
      }
    },
    {
      title: '结束时间',
      dataIndex: 'endLive',
      key: 'endLive',
      width: 180,
      render: (timestamp) => {
        if (!timestamp) return '-';
        return <Tag color="red">{new Date(parseInt(timestamp)).toLocaleString()}</Tag>;
      }
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (time) => formatDate(time)
    }
  ]

  const sendsColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
          <Button 
            type="link" 
            size="small" 
            icon={<SearchOutlined />}
            style={{ padding: '0 4px', minWidth: 'auto', flexShrink: 0 }}
            onClick={() => {
              setViewModalTitle('发送记录详情')
              setViewModalData(record)
              setViewModalVisible(true)
            }}
          />
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const typeMap = {
          'text': <Tag color="blue">文本</Tag>,
          'image': <Tag color="green">图片</Tag>,
          'video': <Tag color="purple">视频</Tag>,
          'document': <Tag color="orange">文档</Tag>
        }
        return typeMap[type] || <Tag>{type}</Tag>
      }
    },
    {
      title: '目标',
      dataIndex: 'target',
      key: 'target',
      width: 150
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (time) => <Tag color="cyan">{formatDate(time)}</Tag>
    }
  ]

  const tabItems = [
    {
      key: 'live-history',
      label: <span><VideoCameraOutlined style={{ marginRight: 8 }} />直播历史</span>,
      children: (
        <Card>
          {loading.liveHistory ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table 
              columns={liveHistoryColumns} 
              dataSource={liveHistory} 
              rowKey="id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          )}
        </Card>
      )
    },
    {
      key: 'sends',
      label: <span><SendOutlined style={{ marginRight: 8 }} />发送记录</span>,
      children: (
        <Card>
          {loading.sends ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table 
              columns={sendsColumns} 
              dataSource={sends} 
              rowKey="id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          )}
        </Card>
      )
    },
    {
      key: 'realtime-logs',
      label: <span><ThunderboltOutlined style={{ marginRight: 8 }} />实时日志{newLogCount > 0 && <Badge count={newLogCount} style={{ marginLeft: 8 }} />}</span>,
      children: (
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge 
                status={isRealtimeConnected ? 'success' : 'default'} 
                text={isRealtimeConnected ? '已连接' : '已断开'} 
              />
            </div>
            
            {!isRealtimeConnected ? (
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />} 
                onClick={connectRealtimeLogs}
              >
                连接
              </Button>
            ) : (
              <Button 
                danger
                icon={<PauseCircleOutlined />} 
                onClick={disconnectRealtimeLogs}
              >
                断开
              </Button>
            )}
            
            {isRealtimeConnected && (
              <Button 
                onClick={() => setIsRealtimePaused(!isRealtimePaused)}
                icon={isRealtimePaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
              >
                {isRealtimePaused ? '继续' : '暂停'}
              </Button>
            )}
            
            <Button 
              icon={<DeleteOutlined />} 
              onClick={clearRealtimeLogs}
              disabled={realtimeLogs.length === 0}
            >
              清除
            </Button>
            
            <Select
              style={{ width: 150 }}
              value={realtimeLogType}
              onChange={setRealtimeLogType}
              options={[
                { value: 'all', label: '全部日志' },
                { value: 'backend', label: '后端日志' },
                { value: 'bot', label: '机器人日志' }
              ]}
            />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span><ClockCircleOutlined style={{ marginRight: 4 }} />时间戳</span>
              <Switch 
                checked={showTimestamps} 
                onChange={setShowTimestamps}
              />
            </div>
          </div>
          
          <div 
            ref={realtimeLogRef}
            style={{ 
              height: '60vh', 
              overflow: 'auto', 
              backgroundColor: '#1e1e1e', 
              color: '#d4d4d4',
              padding: 16, 
              borderRadius: 8,
              fontFamily: 'Consolas, Monaco, Courier New, monospace',
              fontSize: 13,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15) inset'
            }}
          >
            {!isRealtimeConnected && realtimeLogs.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888', flexDirection: 'column' }}>
                <ThunderboltOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
                <div>点击「连接」开始接收实时日志</div>
              </div>
            ) : (
              realtimeLogs
                .filter(log => {
                  if (realtimeLogType === 'all') return true;
                  return log.type === realtimeLogType;
                })
                .map((log, index) => (
                  <div key={index} style={{ marginBottom: 6, lineHeight: 1.8, borderBottom: '1px solid #333', paddingBottom: 6 }}>
                    <span style={{ display: 'inline-flex', gap: 12, alignItems: 'flex-start' }}>
                      {showTimestamps && (
                        <span style={{ color: '#6a9955', fontSize: 12, minWidth: 80 }}>
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                      )}
                      <Tag 
                        color={log.type === 'backend' ? 'blue' : 'purple'} 
                        style={{ marginRight: 8, fontSize: 11 }}
                      >
                        {log.type === 'backend' ? '后端' : '机器人'}
                      </Tag>
                      <span style={{ color: getLogColor(log.content), wordBreak: 'break-all' }}>
                        {log.content}
                      </span>
                    </span>
                  </div>
                ))
            )}
          </div>
        </Card>
      )
    },
    {
      key: 'log-files',
      label: <span><FileTextOutlined style={{ marginRight: 8 }} />日志文件</span>,
      children: (
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              placeholder="选择日志类型"
              style={{ width: 150 }}
              value={logType}
              onChange={(value) => {
                setLogType(value)
                setSelectedLogFile('')
                setLogContent('')
              }}
              options={[
                { value: 'backend', label: '后端日志' },
                { value: 'bot', label: '机器人日志' }
              ]}
            />
            {logType === 'bot' && (
              <Select
                placeholder="选择机器人"
                style={{ width: 150 }}
                value={botType}
                onChange={(value) => {
                  setBotType(value)
                  setSelectedLogFile('')
                  setLogContent('')
                }}
                options={[
                  { value: 'livebot', label: 'LiveBot' },
                  { value: 'fabuBot', label: 'FaBuBot' }
                ]}
              />
            )}
            <Select
              placeholder="选择日志文件"
              style={{ width: 300 }}
              value={selectedLogFile}
              onChange={handleLogFileChange}
              options={logFiles.map(file => ({
                value: file,
                label: file
              }))}
            />
            <Input
              ref={searchInputRef}
              placeholder="搜索关键字"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 300 }}
              onPressEnter={navigateToNextMatch}
            />
            {matches.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color="blue">{currentMatchIndex + 1}/{matches.length}</Tag>
                <Tooltip title="上一个">
                  <Button 
                    type="text" 
                    icon={<UpOutlined />} 
                    onClick={navigateToPrevMatch}
                  />
                </Tooltip>
                <Tooltip title="下一个">
                  <Button 
                    type="text" 
                    icon={<DownOutlined />} 
                    onClick={navigateToNextMatch}
                  />
                </Tooltip>
              </div>
            )}
          </div>
          
          {loading.logContent ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
              <Spin size="large" />
            </div>
          ) : (
            <div 
              ref={logContentRef} 
              style={{ 
                height: '60vh', 
                overflow: 'auto', 
                backgroundColor: '#1e1e1e', 
                color: '#d4d4d4',
                padding: 16, 
                borderRadius: 8,
                fontFamily: 'Consolas, Monaco, Courier New, monospace',
                fontSize: 13,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15) inset'
              }}
            >
              {logContent ? (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {searchKeyword ? (
                    <span dangerouslySetInnerHTML={{
                      __html: logContent.split(new RegExp(`(${searchKeyword})`, 'gi')).map((part, index) => {
                        if (index % 2 === 1) {
                          const matchIndex = Math.floor(index / 2)
                          if (matchIndex === currentMatchIndex) {
                            return `<span style="background-color: #faad14; color: #000; font-weight: bold; padding: 0 4px; border-radius: 2px;">${part}</span>`
                          } else {
                            return `<span style="background-color: #ffec3d; color: #000; padding: 0 4px; border-radius: 2px;">${part}</span>`
                          }
                        }
                        return part
                      }).join('')
                    }} />
                  ) : (
                    logContent
                  )}
                </pre>
              ) : (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#888', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
                  <FileTextOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
                  <div>请选择一个日志文件</div>
                </pre>
              )}
            </div>
          )}
        </Card>
      )
    }
  ]

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: '#1890ff', fontSize: 24, fontWeight: 600 }}>📊 监控日志</h2>
      </div>
      
      <Tabs 
        defaultActiveKey="live-history" 
        items={tabItems}
        type="card"
      />

      {/* 查看详情模态框 */}
      <Modal
        title={viewModalTitle}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          {viewModalData && (
            <Descriptions bordered column={1} size="small">
              {Object.entries(viewModalData).map(([key, value]) => {
                if (value === null || value === undefined) return null;
                
                let displayValue = value;
                let displayKey = key;
                
                // 格式化字段名
                const keyMap = {
                  id: 'ID',
                  mid: '主播ID',
                  day: '日期',
                  username: '主播名',
                  title: '标题',
                  startLive: '开始时间',
                  endLive: '结束时间',
                  updatedAt: '更新时间',
                  targetUrl: '直播链接',
                  pic: '封面图',
                  content: '内容',
                  type: '类型',
                  target: '目标',
                  timestamp: '时间'
                };
                
                displayKey = keyMap[key] || key;
                
                // 格式化时间戳
                if ((key === 'startLive' || key === 'endLive') && value && !isNaN(value)) {
                  displayValue = new Date(parseInt(value)).toLocaleString('zh-CN');
                }
                if ((key === 'updatedAt' || key === 'timestamp') && value) {
                  displayValue = new Date(value).toLocaleString('zh-CN');
                }
                
                // 获取类型标签
                const getTypeTag = (typeValue) => {
                  if (!typeValue) return '-';
                  switch(typeValue) {
                    case 'text': return <Tag color="blue">文本</Tag>;
                    case 'photo': return <Tag color="green">图片</Tag>;
                    case 'video': return <Tag color="purple">视频</Tag>;
                    case 'document': return <Tag color="orange">文档</Tag>;
                    default: return <Tag>{typeValue}</Tag>;
                  }
                };
                
                return (
                  <Descriptions.Item key={key} label={displayKey}>
                  {key === 'pic' && value ? (
                    <img 
                      src={value} 
                      alt="封面" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: 200, 
                        borderRadius: 4,
                        border: '1px solid #d9d9d9'
                      }} 
                    />
                  ) : key === 'targetUrl' && value ? (
                    <a 
                      href={value} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#1890ff', 
                        wordBreak: 'break-all',
                        textDecoration: 'none'
                      }}
                    >
                      {value}
                    </a>
                  ) : key === 'type' ? (
                    getTypeTag(value)
                  ) : (
                    <span style={{ wordBreak: 'break-all' }}>
                      {String(displayValue) || '-'}
                    </span>
                  )}
                </Descriptions.Item>
                );
              })}
            </Descriptions>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Logs
