import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, message, Modal, Button, Tag } from 'antd';
import { EyeOutlined, CopyOutlined } from '@ant-design/icons';
import api from '../utils/api';

function ParseRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success('已复制到剪贴板');
      })
      .catch(err => {
        message.error('复制失败');
        console.error('复制失败:', err);
      });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getParseStatusTag = (status) => {
    switch (status) {
      case 1:
        return <Tag color="green">解析成功</Tag>;
      case 0:
        return <Tag color="yellow">解析中</Tag>;
      default:
        return <Tag color="red">解析失败</Tag>;
    }
  };

  const getContentTypeTag = (type) => {
    switch (type) {
      case 'video':
        return <Tag color="blue">视频</Tag>;
      case 'image':
        return <Tag color="purple">图片</Tag>;
      default:
        return <Tag color="gray">{type || '-'}</Tag>;
    }
  };

  const getSendStatusTag = (status) => {
    switch (status) {
      case 1:
        return <Tag color="green">发送成功</Tag>;
      case 0:
        return <Tag color="yellow">发送中</Tag>;
      default:
        return <Tag color="red">发送失败</Tag>;
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/parse-records', {
        params: {
          page: pagination.page,
          pageSize: pagination.pageSize
        }
      });
      if (response.data && response.data.data) {
        setRecords(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0
        }));
      }
    } catch (error) {
      message.error('获取解析记录失败');
      console.error('获取解析记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [pagination.page, pagination.pageSize]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '分享链接',
      dataIndex: 'share_url',
      key: 'share_url',
      ellipsis: true,
      render: (text) => (
        <span 
          style={{ cursor: 'pointer', color: '#1890ff' }}
          onClick={() => copyToClipboard(text)}
          title="点击复制"
        >
          {text}
          <CopyOutlined style={{ marginLeft: 4 }} />
        </span>
      )
    },
    {
      title: '解析状态',
      dataIndex: 'parse_status',
      key: 'parse_status',
      width: 100,
      render: (status) => getParseStatusTag(status)
    },
    {
      title: '内容类型',
      dataIndex: 'content_type',
      key: 'content_type',
      width: 100,
      render: (type) => getContentTypeTag(type)
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '图片数量',
      dataIndex: 'image_count',
      key: 'image_count',
      width: 80,
      render: (count) => count || 0
    },
    {
      title: '聊天ID',
      dataIndex: 'chat_id',
      key: 'chat_id',
      width: 100
    },
    {
      title: '发送状态',
      dataIndex: 'send_status',
      key: 'send_status',
      width: 100,
      render: (status) => getSendStatusTag(status)
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (time) => formatDate(time)
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setCurrentRecord(record)
            setViewModalVisible(true)
          }}
        />
      )
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>解析管理</h2>
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table 
          columns={columns} 
          dataSource={records} 
          rowKey="id"
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                page,
                pageSize
              }))
            }
          }}
        />
      )}

      <Modal
        title="解析记录详情"
        visible={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {currentRecord && (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <h4 style={{ marginBottom: '8px', color: '#8c8c8c' }}>基本信息</h4>
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#8c8c8c' }}>ID：</span>
                    <span>{currentRecord.id}</span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#8c8c8c' }}>解析状态：</span>
                    {getParseStatusTag(currentRecord.parse_status)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#8c8c8c' }}>内容类型：</span>
                    {getContentTypeTag(currentRecord.content_type)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#8c8c8c' }}>发送状态：</span>
                    {getSendStatusTag(currentRecord.send_status)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#8c8c8c' }}>聊天ID：</span>
                    <span>{currentRecord.chat_id}</span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#8c8c8c' }}>图片数量：</span>
                    <span>{currentRecord.image_count || 0}</span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#8c8c8c' }}>创建时间：</span>
                    <span>{formatDate(currentRecord.created_at)}</span>
                  </div>
                  <div>
                    <span style={{ color: '#8c8c8c' }}>更新时间：</span>
                    <span>{formatDate(currentRecord.updated_at)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 style={{ marginBottom: '8px', color: '#8c8c8c' }}>标题</h4>
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px', marginBottom: '16px' }}>
                  <p style={{ margin: 0 }}>{currentRecord.title || '-'}</p>
                </div>
                
                <h4 style={{ marginBottom: '8px', color: '#8c8c8c' }}>分享链接</h4>
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px', marginBottom: '16px' }}>
                  <p style={{ margin: 0, wordBreak: 'break-all', color: '#1890ff', cursor: 'pointer' }} onClick={() => copyToClipboard(currentRecord.share_url)} title="点击复制">
                    {currentRecord.share_url || '-'}
                  </p>
                </div>
                
                <h4 style={{ marginBottom: '8px', color: '#8c8c8c' }}>视频URL</h4>
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px', marginBottom: '16px', maxHeight: '60px', overflow: 'hidden' }}>
                  <p style={{ margin: 0, wordBreak: 'break-all', color: '#1890ff', cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }} onClick={() => copyToClipboard(currentRecord.video_url)} title="点击复制">
                    {currentRecord.video_url || '-'}
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ marginBottom: '8px', color: '#8c8c8c' }}>解析接口</h4>
              <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px', marginBottom: '16px' }}>
                <p style={{ margin: 0, wordBreak: 'break-all', color: '#1890ff', cursor: 'pointer' }} onClick={() => copyToClipboard(currentRecord.parse_url)} title="点击复制">
                  {currentRecord.parse_url || '-'}
                </p>
              </div>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ marginBottom: '8px', color: '#8c8c8c' }}>解析消息</h4>
              <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px', marginBottom: '16px' }}>
                <p style={{ margin: 0 }}>{currentRecord.parse_message || '-'}</p>
              </div>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ marginBottom: '8px', color: '#8c8c8c' }}>发送消息</h4>
              <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px', marginBottom: '16px' }}>
                <p style={{ margin: 0 }}>{currentRecord.send_message || '-'}</p>
              </div>
            </div>
            
            {currentRecord.image_urls && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ marginBottom: '8px', color: '#8c8c8c' }}>图片列表</h4>
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                  {(() => {
                    try {
                      const images = JSON.parse(currentRecord.image_urls)
                      return (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {images.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`图片${index + 1}`}
                              style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                              onClick={() => window.open(url, '_blank')}
                              title="点击打开原图"
                            />
                          ))}
                        </div>
                      )
                    } catch (e) {
                      return <p>{currentRecord.image_urls}</p>
                    }
                  })()}
                </div>
              </div>
            )}
            
            {currentRecord.message_ids && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ marginBottom: '8px', color: '#8c8c8c' }}>消息ID列表</h4>
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                  {(() => {
                    try {
                      const ids = JSON.parse(currentRecord.message_ids)
                      return <span>{ids.join(', ')}</span>
                    } catch (e) {
                      return <span>{currentRecord.message_ids}</span>
                    }
                  })()}
                </div>
              </div>
            )}
            
            {currentRecord.group_send_results && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ marginBottom: '8px', color: '#8c8c8c' }}>群组发送结果</h4>
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                  {(() => {
                    try {
                      const results = JSON.parse(currentRecord.group_send_results)
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {results.map((result, index) => {
                            const groupId = result.group_id
                            const groupUsername = result.group_username
                            const messageIds = result.message_ids || []
                            const chatIdStr = String(groupId)
                            const isNegative = chatIdStr.startsWith('-') && chatIdStr.startsWith('-100')
                            const cleanChatId = isNegative ? chatIdStr.replace('-100', '') : chatIdStr
                            
                            return (
                              <div key={index} style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '4px' }}>
                                <div style={{ marginBottom: '4px' }}>
                                  <span style={{ color: '#8c8c8c' }}>群组ID：</span>
                                  <span>{groupId}</span>
                                  {groupUsername && (
                                    <span style={{ marginLeft: '8px' }}>
                                      (用户名：<span style={{ color: '#1890ff' }}>@{groupUsername}</span>)
                                    </span>
                                  )}
                                  <span style={{ marginLeft: '8px', color: '#52c41a' }}>
                                    {result.success ? '发送成功' : '发送失败'}
                                  </span>
                                </div>
                                {result.error_message && (
                                  <div style={{ marginBottom: '4px', color: '#ff4d4f', fontSize: '12px' }}>
                                    错误信息：{result.error_message}
                                  </div>
                                )}
                                <div>
                                  <span style={{ color: '#8c8c8c' }}>消息链接：</span>
                                  {messageIds.map((msgId, msgIndex) => {
                                    let url
                                    if (groupUsername) {
                                      url = `https://t.me/${groupUsername}/${msgId}`
                                    } else if (isNegative) {
                                      url = `https://t.me/c/${cleanChatId}/${msgId}`
                                    } else {
                                      url = `https://t.me/${cleanChatId}/${msgId}`
                                    }
                                    return (
                                      <a 
                                        key={msgIndex}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ marginLeft: msgIndex > 0 ? '8px' : 0, color: '#1890ff' }}
                                      >
                                        {url}
                                      </a>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    } catch (e) {
                      return <span>{currentRecord.group_send_results}</span>
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ParseRecords;