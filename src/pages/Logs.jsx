import React, { useState, useEffect } from 'react'
import { Card, Tabs, Table, Select, Spin, message, Input, Switch, Button, Badge, Tag } from 'antd'
import { SearchOutlined, PauseCircleOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { Option } = Select
const { TabPane } = Tabs

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
  const logContentRef = React.useRef(null)
  const searchInputRef = React.useRef(null)
  
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
  }, [logType])

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
      const response = await api.get(`/api/logs/files?type=${logType}`)
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
      const response = await api.get(`/api/logs/files/${filename}?type=${logType}`)
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
      const highlightedElements = logContentRef.current.querySelectorAll('span[style*="background-color: orange"]')
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
                      return newLogs.slice(-200); // 只保留最新的200条
                    });
                    setNewLogCount(prev => prev + 1);
                  } else {
                    setNewLogCount(prev => prev + 1);
                  }
                } catch (e) {
                  // 忽略解析失败的行
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
      
      // 保存reader引用
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
    return '#000';
  };

  const liveHistoryColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: '主播',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '日期',
      dataIndex: 'day',
      key: 'day'
    },
    {
      title: '开始时间',
      dataIndex: 'startLive',
      key: 'startLive',
      render: (timestamp) => {
        if (!timestamp) return '-';
        return new Date(parseInt(timestamp)).toLocaleString();
      }
    },
    {
      title: '结束时间',
      dataIndex: 'endLive',
      key: 'endLive',
      render: (timestamp) => {
        if (!timestamp) return '-';
        return new Date(parseInt(timestamp)).toLocaleString();
      }
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (time) => formatDate(time)
    }
  ]

  const sendsColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: '目标',
      dataIndex: 'target',
      key: 'target'
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time) => formatDate(time)
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>监控日志</h2>
      </div>
      
      <Tabs defaultActiveKey="live-history">
        <TabPane tab="直播历史" key="live-history">
          {loading.liveHistory ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table columns={liveHistoryColumns} dataSource={liveHistory} rowKey="id" />
          )}
        </TabPane>
        
        <TabPane tab="发送记录" key="sends">
          {loading.sends ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table columns={sendsColumns} dataSource={sends} rowKey="id" />
          )}
        </TabPane>
        
        <TabPane tab={
          <span>
            实时日志
            {newLogCount > 0 && <Badge count={newLogCount} style={{ marginLeft: 8 }} />}
          </span>
        } key="realtime-logs">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* 连接状态 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge 
                  status={isRealtimeConnected ? 'success' : 'default'} 
                  text={isRealtimeConnected ? '已连接' : '已断开'} 
                />
              </div>
              
              {/* 连接/断开按钮 */}
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
              
              {/* 暂停/恢复按钮 */}
              {isRealtimeConnected && (
                <Button 
                  onClick={() => setIsRealtimePaused(!isRealtimePaused)}
                  icon={isRealtimePaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                >
                  {isRealtimePaused ? '继续' : '暂停'}
                </Button>
              )}
              
              {/* 清除按钮 */}
              <Button 
                icon={<DeleteOutlined />} 
                onClick={clearRealtimeLogs}
                disabled={realtimeLogs.length === 0}
              >
                清除
              </Button>
              
              {/* 日志类型筛选 */}
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
              
              {/* 显示时间戳切换 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>时间戳</span>
                <Switch 
                  checked={showTimestamps} 
                  onChange={setShowTimestamps}
                />
              </div>
            </div>
            
            {/* 日志显示区域 */}
            <div 
              ref={realtimeLogRef}
              style={{ 
                height: '60vh', 
                overflow: 'auto', 
                backgroundColor: '#1e1e1e', 
                color: '#d4d4d4',
                padding: 16, 
                borderRadius: 4,
                fontFamily: 'Consolas, Monaco, Courier New, monospace',
                fontSize: 13
              }}
            >
              {!isRealtimeConnected && realtimeLogs.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
                  点击「连接」开始接收实时日志
                </div>
              ) : (
                realtimeLogs
                  .filter(log => {
                    if (realtimeLogType === 'all') return true;
                    return log.type === realtimeLogType;
                  })
                  .map((log, index) => (
                    <div key={index} style={{ marginBottom: 4, lineHeight: 1.6 }}>
                      <span style={{ display: 'inline-flex', gap: 8 }}>
                        {showTimestamps && (
                          <span style={{ color: '#6a9955', fontSize: 12 }}>
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>
                        )}
                        <Tag 
                          color={log.type === 'backend' ? 'blue' : 'purple'} 
                          style={{ marginRight: 8, fontSize: 11 }}
                        >
                          {log.type === 'backend' ? '后端' : '机器人'}
                        </Tag>
                        <span style={{ color: getLogColor(log.content) }}>
                          {log.content}
                        </span>
                      </span>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </TabPane>
        
        <TabPane tab="日志文件" key="log-files">
          <Card className="card">
            <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
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
                  <span>{currentMatchIndex + 1}/{matches.length}</span>
                  <button
                    onClick={navigateToPrevMatch}
                    style={{ padding: '4px 8px', cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={navigateToNextMatch}
                    style={{ padding: '4px 8px', cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                  >
                    ↓
                  </button>
                </div>
              )}
            </div>
            
            {loading.logContent ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Spin size="large" />
              </div>
            ) : (
              <div ref={logContentRef} style={{ height: '60vh', overflow: 'auto', backgroundColor: '#f5f5f5', padding: 16, borderRadius: 4 }}>
                {logContent ? (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {searchKeyword ? (
                      <span dangerouslySetInnerHTML={{
                        __html: logContent.split(new RegExp(`(${searchKeyword})`, 'gi')).map((part, index) => {
                          if (index % 2 === 1) {
                            const matchIndex = Math.floor(index / 2)
                            if (matchIndex === currentMatchIndex) {
                              return `<span style="background-color: orange; font-weight: bold;">${part}</span>`
                            } else {
                              return `<span style="background-color: yellow;">${part}</span>`
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
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>请选择一个日志文件</pre>
                )}
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default Logs