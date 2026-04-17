import React, { useState, useEffect } from 'react'
import { Card, Tabs, Table, Select, Spin, message, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
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
          e.preventDefault()
          navigateToPrevMatch()
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          navigateToNextMatch()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigateToPrevMatch, navigateToNextMatch])

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
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