import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Spin, Alert, Tag, Tooltip, Badge } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import api from '../utils/api'

const VodAggregated = () => {
  const [aggregatedVodSources, setAggregatedVodSources] = useState([])
  const [domainGroups, setDomainGroups] = useState([])
  const [aggregatedLoading, setAggregatedLoading] = useState(false)
  const [vodViewType, setVodViewType] = useState('aggregated') // 'aggregated' 或 'domain'

  const fetchAggregatedVodSources = async (limit = 50) => {
    setAggregatedLoading(true)
    try {
      const response = await api.get(`/api/fabu-bot/vod-sources/aggregated?limit=${limit}`)
      setAggregatedVodSources(response.data.sources || [])
      setDomainGroups(response.data.domainGroups || [])
    } catch (error) {
      console.error('获取聚合资源失败:', error)
    } finally {
      setAggregatedLoading(false)
    }
  }

  const fetchDomainGroups = async () => {
    setAggregatedLoading(true)
    try {
      const response = await api.get('/api/fabu-bot/vod-sources/by-domain')
      setDomainGroups(response.data.domainGroups || [])
    } catch (error) {
      console.error('获取域名分组失败:', error)
    } finally {
      setAggregatedLoading(false)
    }
  }

  useEffect(() => {
    if (vodViewType === 'aggregated') {
      fetchAggregatedVodSources(50)
    } else {
      fetchDomainGroups()
    }
  }, [vodViewType])

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      width: 150,
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
      width: 80,
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
    }
  ]

  return (
    <div style={{ padding: '20px' }}>
      <Spin spinning={aggregatedLoading}>
        <Card 
          title="✨ 聚合资源（去重）" 
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
              >
                分组视图
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
                      <span>🌐 {group.domain}</span>
                      <Tag color="blue">{group.sources.length} 个源</Tag>
                    </div>
                  }
                  style={{ background: '#fafafa' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge status="success" text="最佳源" />
                      <strong>{group.bestSource.name}</strong>
                      <Tag color={group.bestSource.ping && group.bestSource.ping < 200 ? 'green' : group.bestSource.ping && group.bestSource.ping < 500 ? 'orange' : 'red'}>
                        {group.bestSource.ping ? `${group.bestSource.ping}ms` : '未测试'}
                      </Tag>
                      <a href={group.bestSource.url} target="_blank" rel="noopener noreferrer">
                        访问
                      </a>
                    </div>
                    {group.sources.length > 1 && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e8e8e8' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>其他源：</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {group.sources
                            .filter(s => s.id !== group.bestSource.id)
                            .map(s => (
                              <Tag key={s.id} color="default">
                                {s.name}
                                <span style={{ marginLeft: '4px', color: '#999' }}>
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
                description={`共 ${aggregatedVodSources.length} 个源，已按延迟排序`}
                type="success" 
                showIcon 
                style={{ marginBottom: '16px' }}
              />
              <Table
                rowKey="id"
                dataSource={aggregatedVodSources}
                pagination={false}
                columns={columns}
              />
            </div>
          )}
        </Card>
      </Spin>
    </div>
  )
}

export default VodAggregated
