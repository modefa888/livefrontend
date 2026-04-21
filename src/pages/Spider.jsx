import React, { useState, useEffect, useMemo } from 'react'
import { Card, Button, Table, Form, Input, Select, Modal, message, Spin, Tabs, Descriptions, Switch, Badge, Row, Col } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import api from '../utils/api'
import Editor from '@monaco-editor/react'

const { Option } = Select
const { TabPane } = Tabs

const Spider = () => {
  const [spiders, setSpiders] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isScriptModalVisible, setIsScriptModalVisible] = useState(false)
  const [editingSpider, setEditingSpider] = useState(null)
  const [editingScript, setEditingScript] = useState(null)
  const [scriptTestResult, setScriptTestResult] = useState(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testKeyword, setTestKeyword] = useState('1')
  const [activeTabKey, setActiveTabKey] = useState('script')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [startAllLoading, setStartAllLoading] = useState(false)
  const [stopAllLoading, setStopAllLoading] = useState(false)
  const [spidersRunning, setSpidersRunning] = useState(false)
  const [scriptChanged, setScriptChanged] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [localScripts, setLocalScripts] = useState([])
  const [localScriptsLoading, setLocalScriptsLoading] = useState(false)
  const [isLocalScriptsModalVisible, setIsLocalScriptsModalVisible] = useState(false)
  const [searchUrl, setSearchUrl] = useState('')
  // 代理检测相关状态
  const [proxyStatus, setProxyStatus] = useState(null)
  const [checkingProxy, setCheckingProxy] = useState(false)
  const [proxyUrl, setProxyUrl] = useState('')

  // 表单实例
  const [form] = Form.useForm()
  const [scriptForm] = Form.useForm()
  const [formLoading, setFormLoading] = useState(false)

  // 预处理测试结果数据，只保留有数据的字段
  const processedTestData = useMemo(() => {
    if (!scriptTestResult?.data) return []
    
    const data = scriptTestResult.data
    const fields = []
    
    if (data.title) {
      fields.push({ label: '标题', value: data.title })
    }
    if (data.username) {
      fields.push({ label: '主播', value: data.username })
    }
    if (data.room_status !== undefined) {
      fields.push({ label: '直播状态', value: data.room_status === 1 ? '🟢 直播中' : '🔴 未直播' })
    }
    if (data.avatar_thumb) {
      fields.push({ label: '主播头像', value: <img src={data.avatar_thumb} alt="主播头像" style={{ width: '80px', height: '80px', borderRadius: '4px' }} /> })
    }
    if (data.liveUrl) {
      fields.push({ 
        label: '直播流URL', 
        value: (
          <div style={{ position: 'relative' }}>
            <a 
              href={data.liveUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                width: '100%',
                maxHeight: '48px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(data.liveUrl)
                  .then(() => {
                    message.success('链接已复制到剪贴板');
                  })
                  .catch(err => {
                    console.error('复制失败:', err);
                    message.error('复制失败，请手动复制');
                  });
              }}
            >
              {data.liveUrl}
            </a>
            <div style={{ position: 'absolute', top: '0', right: '0', background: 'rgba(255, 255, 255, 0.8)', padding: '2px 8px', fontSize: '12px', borderRadius: '4px' }}>
              点击复制
            </div>
          </div>
        ),
        span: 2
      })
    }
    if (data.targetUrl) {
      fields.push({ 
        label: '直播间URL', 
        value: (
          <a href={data.targetUrl} target="_blank" rel="noopener noreferrer" className="ant-btn ant-btn-primary">
            跳转到直播间
          </a>
        ),
        span: 2
      })
    }
    
    return fields
  }, [scriptTestResult])

  // 获取爬虫配置列表
  const fetchSpiders = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/spider/configs')
      setSpiders(response.data)
    } catch (error) {
      message.error('获取爬虫配置失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 获取环境配置（包括代理）
  const fetchEnvConfig = async () => {
    try {
      const response = await api.get('/api/spider/config')
      setProxyUrl(response.data.proxy || '')
      // 自动检测代理
      if (response.data.proxy) {
        checkProxyStatus(response.data.proxy)
      }
    } catch (error) {
      console.error('获取环境配置失败:', error)
    }
  }

  // 检测代理状态
  const checkProxyStatus = async (proxyUrlToCheck = proxyUrl) => {
    if (!proxyUrlToCheck) {
      message.warning('请先配置代理地址')
      return
    }
    
    setCheckingProxy(true)
    try {
      const response = await api.post('/api/spider/check-proxy', {
        proxyUrl: proxyUrlToCheck
      })
      setProxyStatus(response.data)
      if (response.data.success) {
        message.success('代理检测成功')
      } else {
        message.error(`代理检测失败: ${response.data.error || response.data.message}`)
      }
    } catch (error) {
      console.error('代理检测失败:', error)
      message.error('代理检测失败')
    } finally {
      setCheckingProxy(false)
    }
  }

  // 页面加载时获取环境配置
  useEffect(() => {
    fetchEnvConfig()
  }, [])

  // 添加爬虫
  const handleAddSpider = async (values) => {
    try {
      setFormLoading(true)
      const processedValues = {
        ...values,
        interval: parseInt(values.interval, 10)
      }
      
      await api.post('/api/spider/add', processedValues)
      message.success('爬虫添加成功')
      setIsModalVisible(false)
      form.resetFields()
      fetchSpiders()
    } catch (error) {
      message.error('添加爬虫失败')
      console.error(error)
    } finally {
      setFormLoading(false)
    }
  }

  // 更新爬虫
  const handleUpdateSpider = async (values) => {
    try {
      setFormLoading(true)
      const processedValues = {
        ...values,
        interval: parseInt(values.interval, 10)
      }
      
      await api.put(`/api/spider/${editingSpider.id}`, processedValues)
      message.success('爬虫更新成功')
      setIsModalVisible(false)
      form.resetFields()
      setEditingSpider(null)
      fetchSpiders()
    } catch (error) {
      message.error('更新爬虫失败')
      console.error(error)
    } finally {
      setFormLoading(false)
    }
  }

  // 删除爬虫
  const handleDeleteSpider = (spiderId, spiderName) => {
    Modal.confirm({
      title: '确认删除爬虫配置',
      content: (
        <div>
          <p>确定要删除爬虫 <strong>{spiderName}</strong> 的配置吗？</p>
          <p style={{ color: '#999', fontSize: '12px' }}>
            注意：此操作仅删除数据库中的爬虫配置，不会删除本地脚本文件。
          </p>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/api/spider/${spiderId}`)
          message.success('爬虫配置删除成功')
          fetchSpiders()
        } catch (error) {
          message.error('删除爬虫配置失败')
          console.error(error)
        }
      }
    })
  }

  // 启动所有爬虫
  const startAllSpiders = async () => {
    try {
      setStartAllLoading(true)
      await api.post('/api/spider/start-all', {})
      message.success('所有爬虫已启动')
      setSpidersRunning(true)
      fetchSpiders()
    } catch (error) {
      message.error('启动爬虫失败')
      console.error(error)
    } finally {
      setStartAllLoading(false)
    }
  }

  // 停止所有爬虫
  const stopAllSpiders = async () => {
    try {
      setStopAllLoading(true)
      await api.post('/api/spider/stop-all', {})
      message.success('所有爬虫已停止')
      setSpidersRunning(false)
      fetchSpiders()
    } catch (error) {
      message.error('停止爬虫失败')
      console.error(error)
    } finally {
      setStopAllLoading(false)
    }
  }

  // 切换所有爬虫状态
  const toggleAllSpiders = () => {
    if (spidersRunning) {
      stopAllSpiders()
    } else {
      startAllSpiders()
    }
  }

  // 打开脚本编辑模态框
  const showScriptModal = async (spider) => {
    try {
      setEditingScript(spider)
      setScriptTestResult(null)
      setActiveTabKey('script')
      
      const response = await api.get(`/api/spider/script/${spider.name}`)
      
      scriptForm.setFieldsValue({ script: response.data.script || '' })
      setTestKeyword(response.data.testKeyword || '1')
      
      setIsScriptModalVisible(true)
    } catch (error) {
      message.error('获取脚本内容失败')
      console.error(error)
      scriptForm.setFieldsValue({ script: '' })
      setTestKeyword('1')
      setIsScriptModalVisible(true)
    }
  }

  // 保存脚本
  const handleSaveScript = async (values) => {
    try {
      setSaveLoading(true)
      const { script } = values
      
      await api.post('/api/spider/script', {
        site: editingScript.name,
        script,
        testKeyword
      })
      message.success('脚本保存成功')
      setIsScriptModalVisible(false)
      scriptForm.resetFields()
      setEditingScript(null)
      setScriptChanged(false)
    } catch (error) {
      message.error('保存脚本失败')
      console.error(error)
    } finally {
      setSaveLoading(false)
    }
  }

  // 测试脚本
  const handleTestScript = async () => {
    try {
      setTestLoading(true)
      const scriptContent = scriptForm.getFieldValue('script')
      
      const response = await api.post('/api/spider/test', {
        script: scriptContent,
        mid: testKeyword,
        proxy: ''
      })
      setScriptTestResult(response.data)
      setTestLoading(false)
      setActiveTabKey('test')
      if (response.data.success) {
        message.success('脚本测试成功')
      } else {
        message.error(`脚本测试失败: ${response.data.message}`)
      }
    } catch (error) {
      setTestLoading(false)
      setActiveTabKey('test')
      message.error('测试脚本失败')
      console.error(error)
    }
  }

  // 打开编辑模态框
  const showEditModal = (spider) => {
    setEditingSpider(spider)
    setActiveTabKey('basic')
    const formValues = {
      ...spider,
      interval: spider.crawlInterval,
      testKeyword: spider.testKeyword || '',
      callFunction: spider.callFunction || ''
    }
    setIsModalVisible(true)
    setTimeout(() => {
      form.setFieldsValue(formValues)
    }, 0)
  }

  // 打开添加模态框
  const showAddModal = () => {
    setEditingSpider(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  // 切换爬虫状态
  const handleToggleSpider = async (spiderName, isEnabled) => {
    try {
      const enabledValue = isEnabled ? 1 : 0
      await api.put(`/api/spider/toggle/${spiderName}`, {
        isEnabled: enabledValue
      })
      message.success(isEnabled ? '爬虫已启用' : '爬虫已禁用')
      fetchSpiders()
    } catch (error) {
      message.error('切换爬虫状态失败')
      console.error(error)
    }
  }

  // 显示本地脚本列表模态框
  const showLocalScriptsModal = async () => {
    try {
      setLocalScriptsLoading(true)
      
      const scriptsResponse = await api.get('/api/spider/local-scripts')
      const configsResponse = await api.get('/api/spider/configs')
      
      const localScripts = scriptsResponse.data
      const dbConfigs = configsResponse.data
      
      const scriptsWithStatus = localScripts.map(script => {
        const exists = dbConfigs.some(config => config.name === script.name)
        return {
          ...script,
          existsInDb: exists
        }
      })
      
      setLocalScripts(scriptsWithStatus)
      setIsLocalScriptsModalVisible(true)
    } catch (error) {
      message.error('获取本地脚本失败')
      console.error(error)
    } finally {
      setLocalScriptsLoading(false)
    }
  }

  // 从本地脚本添加爬虫（填充到表单）
  const addSpiderFromLocal = async (script) => {
    try {
      console.log('Adding spider from local:', script)
      
      const scriptFileName = script.file.replace('.js', '');
      
      const scriptResponse = await api.get(`/api/spider/script/${script.name}`)
      
      const scriptContent = scriptResponse.data.script || ''
      
      form.setFieldsValue({
        name: script.name,
        type: 'live',
        url: script.host,
        interval: script.interval || 300,
        isEnabled: true,
        createScript: false,
        scriptContent: scriptContent
      })
      
      setIsLocalScriptsModalVisible(false)
      setIsModalVisible(true)
      setEditingSpider(null)
    } catch (error) {
      console.error('Error adding spider:', error)
      message.error('填充表单失败')
    }
  }

  // 初始化时获取爬虫配置
  useEffect(() => {
    fetchSpiders()
  }, [])

  // 表格列
  const columns = [
    {
      title: '爬虫名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true
    },
    {
      title: '爬取间隔 (秒)',
      dataIndex: 'crawlInterval',
      key: 'crawlInterval',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      render: (isEnabled, record) => (
        <Switch 
          checked={isEnabled === 1 || isEnabled === true} 
          onChange={(checked) => handleToggleSpider(record.name, checked)}
        />
      ),
      width: 100
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div>
          <Button type="primary" size="small" style={{ marginRight: '8px' }} onClick={() => showEditModal(record)}>
            编辑
          </Button>
          <Button type="default" size="small" style={{ marginRight: '8px' }} onClick={() => showScriptModal(record)}>
            编辑脚本
          </Button>
          <Button danger size="small" onClick={() => handleDeleteSpider(record.id, record.name)}>
            删除
          </Button>
        </div>
      )
    }
  ]

  // 过滤后的爬虫列表
  const filteredSpiders = useMemo(() => {
    if (!searchUrl) return spiders
    return spiders.filter(spider => 
      spider.url.toLowerCase().includes(searchUrl.toLowerCase())
    )
  }, [spiders, searchUrl])

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>爬虫管理</h1>
      
      {/* 代理检测区域 */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px', fontWeight: 'bold' }}>📍 代理地址:</span>
          <span style={{ marginRight: '10px', flex: 1 }}>{proxyUrl || '未配置'}</span>
          <Button 
            type="link" 
            onClick={() => checkProxyStatus()} 
            loading={checkingProxy}
          >
            检测
          </Button>
          {proxyStatus && (
            <span style={{ marginLeft: '10px', color: proxyStatus.success ? '#52c41a' : '#ff4d4f' }}>
              {proxyStatus.success ? '✅ 可用' : '❌ 不可用'}
            </span>
          )}
        </div>
        {proxyStatus && proxyStatus.error && (
          <div style={{ color: '#ff4d4f', marginTop: '8px', fontSize: '12px' }}>
            错误: {proxyStatus.error}
          </div>
        )}
      </Card>
      
      <div style={{ marginBottom: '20px' }}>
        <Button type="primary" onClick={showAddModal} style={{ marginRight: '10px' }}>
          添加爬虫
        </Button>
        <Button 
          type={spidersRunning ? 'default' : 'primary'} 
          onClick={toggleAllSpiders} 
          style={{ marginRight: '10px' }} 
          loading={startAllLoading || stopAllLoading}
        >
          {spidersRunning ? '停止所有爬虫' : '启动所有爬虫'}
        </Button>
        <Button type="default" onClick={showLocalScriptsModal} style={{ marginRight: '10px' }}>
          从本地添加脚本
        </Button>
        <Input 
          placeholder="搜索URL" 
          value={searchUrl} 
          onChange={(e) => setSearchUrl(e.target.value)} 
          style={{ width: '300px', marginLeft: '10px' }} 
          prefix={<SearchOutlined />}
        />
      </div>

      <Spin spinning={loading}>
        <Card title="爬虫配置列表">
          <Table columns={columns} dataSource={filteredSpiders} rowKey="id" />
        </Card>
      </Spin>

      {/* 添加/编辑爬虫模态框 */}
      <Modal
        title={editingSpider ? '编辑爬虫' : '添加爬虫'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={1000}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingSpider ? handleUpdateSpider : handleAddSpider}
        >
          <Tabs activeKey={activeTabKey} onChange={setActiveTabKey}>
            <TabPane tab="基本信息" key="basic">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="爬虫名称"
                    rules={[{ required: true, message: '请输入爬虫名称' }]}
                  >
                    <Input placeholder="请输入爬虫名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="type"
                    label="爬虫类型"
                    rules={[{ required: true, message: '请选择爬虫类型' }]}
                  >
                    <Select placeholder="请选择爬虫类型">
                      <Option value="live">直播平台爬虫</Option>
                      <Option value="content">内容网站爬虫</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="url"
                    label="爬取URL"
                    rules={[{ required: true, message: '请输入爬取URL' }]}
                  >
                    <Input placeholder="请输入爬取URL" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="interval"
                    label="爬取间隔 (秒)"
                    rules={[{ required: true, message: '请输入爬取间隔' }]}
                    initialValue={4}
                  >
                    <Input type="number" placeholder="请输入爬取间隔" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="isEnabled"
                    label="状态"
                    initialValue={true}
                  >
                    <Select placeholder="请选择状态">
                      <Option value={true}>启用</Option>
                      <Option value={false}>禁用</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="createScript"
                    label="创建脚本文件"
                    initialValue={true}
                  >
                    <Select placeholder="请选择是否创建脚本文件">
                      <Option value={true}>是</Option>
                      <Option value={false}>否</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="testKeyword"
                    label="测试关键字"
                  >
                    <Input placeholder="请输入测试关键字" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="callFunction"
                    label="调用函数"
                  >
                    <Input placeholder="请输入调用函数名称" />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>
            <TabPane tab="脚本编辑" key="script">
              <Form.Item
                label="脚本代码"
                rules={[{ required: true, message: '请输入脚本代码' }]}
              >
                <Editor
                  height="500px"
                  defaultLanguage="javascript"
                  value={form.getFieldValue('scriptContent') || `// 爬虫脚本模板
const includes = require('../config/includes');
const cheerio = require('cheerio');

const host = 'https://example.com';

const getStationStatus = async (mid, proxy) => {
  try {
    let targetUrl = host + '/' + mid;
    const response = await includes.api.get(targetUrl, {
      proxy: proxy ? { host: proxy.split(':')[0], port: parseInt(proxy.split(':')[1]) } : undefined,
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    let room_status = 0;
    let title = '';
    let username = '';
    let avatar_thumb = '';
    let liveUrl = '';
    let roomid = mid;
    
    // 解析页面内容获取直播信息
    // 这里需要根据具体网站的结构进行修改
    // 示例：获取标题
    title = $('title').text().trim();
    
    // 示例：获取主播名称
    // username = $('.anchor-info .name).text().trim();
    
    // 示例：获取直播状态
    // const liveStatusElement = $('.live-status');
    // if (liveStatusElement.length > 0) {
    //   room_status = 1; // 直播中
    // }
    
    // 示例：获取直播流地址
    // 这里需要根据具体网站的结构进行修改
    
    const code = 1;
    return { code, title, username, roomid, avatar_thumb, room_status, liveUrl, targetUrl };
  } catch (error) {
    console.error('获取站点状态失败:', error);
    const msg = '请求失败: ' + error.message;
    const code = 0;
    return { msg, code, room_status: 0 };
  }
};

module.exports = {
  getHost() {
    return host;
  },
  getStationStatus,
  getModuleName() {
    return 'example';
  },
  getMidCount() {
    return 300;
  }
};`}
                  onChange={(value) => form.setFieldsValue({ scriptContent: value })}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    fontLigatures: true,
                    automaticLayout: true,
                  }}
                />
              </Form.Item>
            </TabPane>
          </Tabs>
          <Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Button type="primary" htmlType="submit" loading={formLoading}>
                保存
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑脚本模态框 */}
      <Modal
        title={editingScript ? `编辑爬虫脚本 - ${editingScript.name}` : '编辑爬虫脚本'}
        open={isScriptModalVisible}
        onCancel={() => {
          setIsScriptModalVisible(false)
          scriptForm.resetFields()
          setEditingScript(null)
          setScriptTestResult(null)
        }}
        width={1200}
      >
        <Form
          form={scriptForm}
          layout="vertical"
          onFinish={handleSaveScript}
        >
          <Tabs activeKey={activeTabKey} onChange={setActiveTabKey}>
            <TabPane tab="脚本编辑" key="script">
              <Form.Item
                name="script"
                label="脚本代码"
                rules={[{ required: true, message: '请输入脚本代码' }]}
              >
                <Editor
                  height="500px"
                  defaultLanguage="javascript"
                  value={scriptForm.getFieldValue('script') || ''}
                  onChange={(value) => {
                    scriptForm.setFieldsValue({ script: value });
                    setScriptChanged(true);
                  }}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    fontLigatures: true,
                    automaticLayout: true,
                  }}
                />
              </Form.Item>
              <div style={{ marginTop: '16px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ marginRight: '8px' }}>测试关键字:</label>
                  <Input 
                    type="text" 
                    value={testKeyword} 
                    onChange={(e) => setTestKeyword(e.target.value)} 
                    placeholder="请输入测试关键字"
                    style={{ width: '300px' }}
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={saveLoading}
                    style={{ marginRight: '8px' }}
                  >
                    保存脚本
                  </Button>
                  <Button type="default" onClick={handleTestScript} loading={testLoading}>
                    测试脚本
                  </Button>
                </div>
              </div>
            </TabPane>
            <TabPane tab="测试结果" key="test">
              {scriptTestResult ? (
                <div>
                  <Descriptions bordered>
                    <Descriptions.Item label="测试状态">
                      {scriptTestResult.success ? '✅ 成功' : '❌ 失败'}
                    </Descriptions.Item>
                    <Descriptions.Item label="测试消息">
                      {scriptTestResult.message}
                    </Descriptions.Item>
                  </Descriptions>
                  {scriptTestResult.data && (
                    <div style={{ marginTop: '16px' }}>
                      <h4>爬取结果</h4>
                      <Descriptions bordered column={2}>
                        {processedTestData.map((field, index) => (
                          <Descriptions.Item 
                            key={index} 
                            label={field.label} 
                            style={{ width: '100px' }}
                            span={field.span}
                          >
                            {field.value}
                          </Descriptions.Item>
                        ))}
                      </Descriptions>
                      <div style={{ marginTop: '16px' }}>
                        <h4>JSON 结果</h4>
                        <pre style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px', overflowX: 'auto' }}>
                          {JSON.stringify(scriptTestResult.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  请先点击"测试脚本"按钮运行测试
                </div>
              )}
            </TabPane>
          </Tabs>
        </Form>
      </Modal>

      {/* 本地脚本列表模态框 */}
      <Modal
        title="从本地脚本添加爬虫"
        open={isLocalScriptsModalVisible}
        onCancel={() => setIsLocalScriptsModalVisible(false)}
        width={800}
        footer={null}
      >
        <Spin spinning={localScriptsLoading}>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {localScripts.map((script, index) => (
              <Card key={index} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4>
                      {script.name}
                      {script.existsInDb && (
                        <Badge status="success" text="已存在" style={{ marginLeft: '8px' }} />
                      )}
                    </h4>
                    <p style={{ color: '#666', fontSize: '12px' }}>文件: {script.file}</p>
                    {script.host && <p style={{ color: '#666', fontSize: '12px' }}>主机: {script.host}</p>}
                  </div>
                  <Button 
                    type="primary" 
                    onClick={() => addSpiderFromLocal(script)}
                    disabled={script.existsInDb}
                  >
                    {script.existsInDb ? '已存在' : '添加到数据库'}
                  </Button>
                </div>
              </Card>
            ))}
            {localScripts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                未找到本地脚本文件
              </div>
            )}
          </div>
        </Spin>
      </Modal>
    </div>
  )
}

export default Spider
