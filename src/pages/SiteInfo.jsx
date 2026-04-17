import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Form, Input, Modal, message, Spin, Image, Space, Pagination } from 'antd'
import { UnorderedListOutlined, PlayCircleOutlined, EyeOutlined, CheckCircleOutlined, VideoCameraOutlined } from '@ant-design/icons'
import api from '../utils/api'

const SiteInfo = () => {
  const [siteInfoData, setSiteInfoData] = useState([])
  const [siteInfoLoading, setSiteInfoLoading] = useState(false)
  const [siteInfoTotal, setSiteInfoTotal] = useState(0)
  const [siteInfoCurrentPage, setSiteInfoCurrentPage] = useState(1)
  const [siteInfoPageSize, setSiteInfoPageSize] = useState(10)
  const [siteInfoForm] = Form.useForm()
  const [isSiteInfoModalVisible, setIsSiteInfoModalVisible] = useState(false)
  const [isSiteInfoSubmitting, setIsSiteInfoSubmitting] = useState(false)
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'card'
  const [isViewModalVisible, setIsViewModalVisible] = useState(false)
  const [viewRecord, setViewRecord] = useState(null)
  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchSiteInfoData = async (page = 1, size = 10) => {
    setSiteInfoLoading(true)
    try {
      const response = await api.get('/api/site-info/query-data-by-page', {
        params: { page: page, size: size, keyword: searchKeyword }
      })
      setSiteInfoData(response.data.data)
      setSiteInfoTotal(response.data.total_count)
      setSiteInfoCurrentPage(page)
      setSiteInfoPageSize(size)
    } catch (error) {
      message.error('获取网页表数据失败')
    } finally {
      setSiteInfoLoading(false)
    }
  }

  const saveSiteInfoData = async (values) => {
    setIsSiteInfoSubmitting(true)
    try {
      const checkResponse = await api.get('/api/site-info/check-data-exists-by-pageHref', {
        params: { pageHref: values.pageHref }
      })

      if (checkResponse.status === 200) {
        message.error('数据已存在')
        return
      }

      await api.post('/api/site-info/save-data', values)
      message.success('数据保存成功')
      setIsSiteInfoModalVisible(false)
      siteInfoForm.resetFields()
      fetchSiteInfoData()
    } catch (error) {
      if (error.response && error.response.status === 408) {
        await api.post('/api/site-info/save-data', values)
        message.success('数据保存成功')
        setIsSiteInfoModalVisible(false)
        siteInfoForm.resetFields()
        fetchSiteInfoData()
      } else {
        message.error('保存数据失败')
      }
    } finally {
      setIsSiteInfoSubmitting(false)
    }
  }

  const showDeleteModal = (id) => {
    setDeleteId(id)
    setIsDeleteModalVisible(true)
  }

  const confirmDelete = async () => {
    try {
      await api.delete('/api/site-info/delete-data', {
        data: { id: deleteId }
      })
      message.success('数据删除成功')
      setIsDeleteModalVisible(false)
      fetchSiteInfoData()
    } catch (error) {
      message.error('删除数据失败')
      setIsDeleteModalVisible(false)
    }
  }

  const cancelDelete = () => {
    setIsDeleteModalVisible(false)
    setDeleteId(null)
  }

  const showViewModal = (record) => {
    setViewRecord(record)
    setIsViewModalVisible(true)
  }

  const cancelView = () => {
    setIsViewModalVisible(false)
    setViewRecord(null)
  }

  useEffect(() => {
    fetchSiteInfoData()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>网页表管理</h1>

      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>网页表管理</span>
            <div style={{ flex: 1, maxWidth: '350px', margin: '0 30px' }}>
              <Input
                placeholder="搜索页面标题..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onPressEnter={() => fetchSiteInfoData(1, siteInfoPageSize)}
                allowClear
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Space>
                <Button 
                  type={viewMode === 'list' ? 'primary' : 'default'}
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('list')}
                >
                  列表视图
                </Button>
                <Button 
                  type={viewMode === 'card' ? 'primary' : 'default'}
                  icon={<VideoCameraOutlined />}
                  onClick={() => setViewMode('card')}
                >
                  卡片视图
                </Button>
              </Space>
              <Button 
                type="primary" 
                onClick={() => {
                  siteInfoForm.resetFields()
                  setIsSiteInfoModalVisible(true)
                }}
              >
                添加数据
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ marginBottom: '20px' }}>
          <Spin spinning={siteInfoLoading}>
            {viewMode === 'list' ? (
              <Table 
                columns={[
                  {
                    title: 'ID',
                    dataIndex: 'id',
                    key: 'id'
                  },
                  {
                    title: '页面标题',
                    dataIndex: 'page_title',
                    key: 'page_title',
                    render: (page_title) => page_title || '无'
                  },
                  {
                    title: '页面链接',
                    dataIndex: 'page_href',
                    key: 'page_href',
                    render: (page_href) => (
                      <Button 
                        type="link" 
                        onClick={() => window.open(page_href, '_blank')}
                      >
                        跳转
                      </Button>
                    )
                  },
                  {
                    title: '页面图片',
                    dataIndex: 'page_img',
                    key: 'page_img',
                    render: (page_img, record) => page_img ? (
                      <Image 
                        src={page_img} 
                        alt="页面图片" 
                        style={{ width: '100px', height: 'auto', cursor: 'pointer' }}
                        preview={{
                          mask: '点击放大'
                        }}
                        onError={(e) => {
                          if (record.local_img_path) {
                            e.target.src = record.local_img_path;
                          }
                        }}
                      />
                    ) : '无'
                  },
                  {
                    title: '查看次数',
                    dataIndex: 'view_count',
                    key: 'view_count',
                    render: (view_count) => (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <EyeOutlined />
                        {view_count || 0}
                      </span>
                    )
                  },
                  {
                    title: '评分',
                    dataIndex: 'stars',
                    key: 'stars',
                    render: (stars) => (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                        <CheckCircleOutlined />
                        {stars || 0}
                      </span>
                    )
                  },
                  {
                    title: '创建时间',
                    dataIndex: 'create_time',
                    key: 'create_time',
                    render: (create_time) => new Date(create_time).toLocaleString()
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_, record) => (
                      <Space>
                        <Button 
                          size="small" 
                          icon={<EyeOutlined />}
                          onClick={() => showViewModal(record)}
                        />
                        <Button 
                          danger 
                          size="small" 
                          onClick={() => showDeleteModal(record.id)}
                        >
                          删除
                        </Button>
                      </Space>
                    )
                  }
                ]} 
                dataSource={siteInfoData} 
                rowKey="id"
                pagination={{
                  current: siteInfoCurrentPage,
                  pageSize: siteInfoPageSize,
                  total: siteInfoTotal,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                  className: 'custom-pagination',
                  onChange: (page, size) => fetchSiteInfoData(page, size),
                  onShowSizeChange: (page, size) => fetchSiteInfoData(page, size)
                }}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {siteInfoData.map((item) => (
                  <Card 
                    key={item.id} 
                    hoverable
                    style={{ borderRadius: '12px', overflow: 'hidden' }}
                    onClick={() => item.page_href && window.open(item.page_href, '_blank')}
                  >
                    <div style={{ marginBottom: '12px', backgroundColor: '#f5f5f5', height: '180px', overflow: 'hidden', cursor: 'zoom-in' }} onClick={(e) => e.stopPropagation()}>
                      <Image 
                        src={item.page_img} 
                        alt={item.page_title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center' }}
                        preview
                        onError={(e) => {
                          if (item.local_img_path) {
                            e.target.src = item.local_img_path;
                          }
                        }}
                      >
                        {({ image }) => {
                          if (!image) {
                            return (
                              <div style={{ 
                                width: '100%', 
                                height: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                backgroundColor: '#e5e5e5'
                              }}>
                                <span style={{ color: '#999', fontSize: '14px' }}>图片失联了</span>
                              </div>
                            )
                          }
                          return null
                        }}
                      </Image>
                    </div>
                    <h3 style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#1f2937', 
                      marginBottom: '8px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: '1.4'
                    }}>
                      {item.page_title || '未命名'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#6b7280', fontSize: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <EyeOutlined />
                        {item.view_count || 0}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                        <CheckCircleOutlined />
                        {item.stars || 0}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Spin>
        </div>
        
        {viewMode === 'card' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={siteInfoCurrentPage}
              pageSize={siteInfoPageSize}
              total={siteInfoTotal}
              showSizeChanger
              showQuickJumper
              showTotal={(total) => `共 ${total} 条记录`}
              onChange={(page, size) => fetchSiteInfoData(page, size)}
              onShowSizeChange={(page, size) => fetchSiteInfoData(page, size)}
            />
          </div>
        )}
      </Card>

      <Modal
        title="添加网页表数据"
        open={isSiteInfoModalVisible}
        onCancel={() => setIsSiteInfoModalVisible(false)}
        onOk={() => siteInfoForm.submit()}
      >
        <Form
          form={siteInfoForm}
          layout="vertical"
          onFinish={saveSiteInfoData}
        >
          <Form.Item
            name="pageTitle"
            label="页面标题"
            rules={[{ required: true, message: '请输入页面标题' }]}
          >
            <Input placeholder="请输入页面标题" />
          </Form.Item>
          <Form.Item
            name="pageHref"
            label="页面链接"
            rules={[{ required: true, message: '请输入页面链接' }]}
          >
            <Input placeholder="请输入页面链接" />
          </Form.Item>
          <Form.Item
            name="pageImg"
            label="页面图片"
          >
            <Input placeholder="请输入页面图片链接" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="确认删除"
        open={isDeleteModalVisible}
        onCancel={cancelDelete}
        onOk={confirmDelete}
        okText="确认删除"
        cancelText="取消"
      >
        <p>您确定要删除这条数据吗？此操作不可恢复。</p>
      </Modal>

      <Modal
        title="查看详情"
        open={isViewModalVisible}
        onCancel={cancelView}
        footer={null}
        width={800}
      >
        {viewRecord && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ width: '200px', flexShrink: 0 }}>
                <Image
                  src={viewRecord.page_img}
                  alt="页面图片"
                  style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                  onError={(e) => {
                    if (viewRecord.local_img_path) {
                      e.target.src = viewRecord.local_img_path;
                    }
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>页面标题</h3>
                  <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
                    {viewRecord.page_title || '未命名'}
                  </p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>页面链接</h3>
                  <a
                    href={viewRecord.page_href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '14px', color: '#2563eb', wordBreak: 'break-all' }}
                  >
                    {viewRecord.page_href}
                  </a>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>统计信息</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <EyeOutlined style={{ fontSize: '20px', color: '#6b7280' }} />
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{viewRecord.view_count || 0}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>浏览次数</div>
                </div>
                <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <CheckCircleOutlined style={{ fontSize: '20px', color: '#d97706' }} />
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#d97706' }}>{viewRecord.stars || 0}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#d97706', marginTop: '8px' }}>星级评分</div>
                </div>
                <div style={{ backgroundColor: '#ecfdf5', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <PlayCircleOutlined style={{ fontSize: '20px', color: '#059669' }} />
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>
                      {viewRecord.m3u8_list && viewRecord.m3u8_list.length > 0 ? viewRecord.m3u8_list.length : 0}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#059669', marginTop: '8px' }}>M3U8链接数</div>
                </div>
              </div>
            </div>

            {viewRecord.m3u8_list && viewRecord.m3u8_list.length > 0 && (
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>M3U8 播放地址</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {viewRecord.m3u8_list.map((url, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        fontSize: '13px',
                        color: '#374151',
                        wordBreak: 'break-all'
                      }}
                    >
                      <span style={{ color: '#9ca3af', marginRight: '8px' }}>{index + 1}.</span>
                      {url}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>图片地址</h3>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>线上图片地址</div>
                <div 
                  style={{ 
                    padding: '10px 12px', 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: '6px', 
                    fontSize: '13px', 
                    color: '#374151',
                    wordBreak: 'break-all',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(viewRecord.page_img || '');
                    message.success('线上图片地址已复制');
                  }}
                >
                  <span>{viewRecord.page_img || '无'}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>点击复制</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>本地图片地址</div>
                <div 
                  style={{ 
                    padding: '10px 12px', 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: '6px', 
                    fontSize: '13px', 
                    color: '#374151',
                    wordBreak: 'break-all',
                    cursor: viewRecord.local_img_path ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onClick={() => {
                    if (viewRecord.local_img_path) {
                      const fullUrl = `http://localhost:3002${viewRecord.local_img_path}`;
                      navigator.clipboard.writeText(fullUrl);
                      message.success('本地图片地址已复制');
                    }
                  }}
                >
                  <span>{viewRecord.local_img_path ? `http://localhost:3002${viewRecord.local_img_path}` : '无'}</span>
                  {viewRecord.local_img_path && <span style={{ fontSize: '12px', color: '#9ca3af' }}>点击复制</span>}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>创建时间</h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                {new Date(viewRecord.create_time).toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SiteInfo

