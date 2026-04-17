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

  // 预处理测试结果数据，只保留有数据的字段
  const processedTestData = useMemo(() => {
    if (!scriptTestResult?.data) return [];
    
    const data = scriptTestResult.data;
    const fields = [];
    
    if (data.title) {
      fields.push({ label: '标题', value: data.title });
    }
    if (data.username) {
      fields.push({ label: '主播', value: data.username });
    }
    if (data.room_status !== undefined) {
      fields.push({ label: '直播状态', value: data.room_status === 1 ? '🟢 直播中' : '🔴 未直播' });
    }
    if (data.avatar_thumb) {
      fields.push({ label: '主播头像', value: <img src={data.avatar_thumb} alt="主播头像" style={{ width: '80px', height: '80px', borderRadius: '4px' }} /> });
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
                display: 'block',
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
      });
    }
    if (data.targetUrl) {
      fields.push({ 
        label: '直播间链接', 
        value: (
          <a href={data.targetUrl} target="_blank" rel="noopener noreferrer" className="ant-btn ant-btn-primary">
            跳转到直播间
          </a>
        ),
        span: 2
      });
    }
    
    return fields;
  }, [scriptTestResult]);

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

  // 表单提交加载状态
  const [formLoading, setFormLoading] = useState(false)
  
  // 本地状态管理
  const [formInstance, setFormInstance] = useState(null)
  const [scriptFormInstance, setScriptFormInstance] = useState(null)

  // 添加爬虫
  const handleAddSpider = async (values) => {
    try {
      setFormLoading(true)
      // 将 interval 转换为数字
      const processedValues = {
        ...values,
        interval: parseInt(values.interval, 10)
      }
      
      await api.post('/api/spider/add', processedValues)
      message.success('爬虫添加成功')
      setIsModalVisible(false)
      formInstance?.resetFields()
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
      // 将 interval 转换为数字
      const processedValues = {
        ...values,
        interval: parseInt(values.interval, 10)
      }
      
      await api.put(`/api/spider/${editingSpider.id}`, processedValues)
      message.success('爬虫更新成功')
      setIsModalVisible(false)
      formInstance?.resetFields()
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
      // 执行成功后刷新页面
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
      // 执行成功后刷新页面
      fetchSpiders()
    } catch (error) {
      message.error('停止爬虫失败')
      console.error(error)
    } finally {
      setStopAllLoading(false)
    }
  }

  // 切换爬虫状态（启动/停止）
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
      // 获取脚本内容
      
      const response = await api.get(`/api/spider/script/${spider.name}`)
      scriptFormInstance?.setFieldsValue({ script: response.data.script })
      // 设置测试关键字为数据库中的值
      setTestKeyword(spider.testKeyword || '1')
      setScriptTestResult(null)
      setIsScriptModalVisible(true)
    } catch (error) {
      message.error('获取脚本内容失败')
      console.error(error)
      // 如果获取失败，显示空脚本
      scriptFormInstance?.setFieldsValue({ script: '' })
      // 设置测试关键字为数据库中的值
      setTestKeyword(spider.testKeyword || '1')
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
        script
      })
      message.success('脚本保存成功')
      setIsScriptModalVisible(false)
      scriptFormInstance?.resetFields()
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
      const scriptContent = scriptFormInstance?.getFieldValue('script')
      
      // 测试脚本
      const response = await api.post('/api/spider/test', {
        script: scriptContent,
        mid: testKeyword, // 使用用户输入的测试关键字
        proxy: '' // 不使用代理
      })
      setScriptTestResult(response.data)
      setTestLoading(false)
      // 自动切换到测试结果标签页
      setActiveTabKey('test')
      if (response.data.success) {
        message.success('脚本测试成功')
      } else {
        message.error(`脚本测试失败: ${response.data.message}`)
      }
    } catch (error) {
      setTestLoading(false)
      // 自动切换到测试结果标签页
      setActiveTabKey('test')
      message.error('测试脚本失败')
      console.error(error)
    }
  }

  // 打开编辑模态框
  const showEditModal = (spider) => {
    setEditingSpider(spider)
    // 将 crawlInterval 映射到 interval
    const formValues = {
      ...spider,
      interval: spider.crawlInterval,
      testKeyword: spider.testKeyword || '',
      callFunction: spider.callFunction || ''
    }
    formInstance?.setFieldsValue(formValues)
    setIsModalVisible(true)
  }

  // 打开添加模态框
  const showAddModal = () => {
    setEditingSpider(null)
    formInstance?.resetFields()
    setIsModalVisible(true)
  }

  // 当表单打开时，对于编辑模式，如果是从本地脚本添加的，重新获取脚本内容
  useEffect(() => {
    if (isModalVisible && editingSpider) {
      // 尝试从本地脚本获取最新的脚本内容
      const fetchScriptContent = async () => {
        try {
          
          const scriptResponse = await api.get(`http://localhost:3001/api/spider/script/${editingSpider.name}`)
          
          const scriptContent = scriptResponse.data.script || ''
          if (scriptContent) {
            formInstance?.setFieldsValue({ scriptContent })
          }
        } catch (error) {
          console.error('获取脚本内容失败:', error)
        }
      }
      
      fetchScriptContent()
    }
  }, [isModalVisible, editingSpider, formInstance])

  // 上传脚本到数据库
  const uploadScriptsToDatabase = async () => {
    try {
      setUploadLoading(true)
      
      // 首先获取爬虫配置列表
      const configsResponse = await api.get('/api/spider/configs')
      
      // 然后将配置列表上传到数据库
      const uploadResponse = await api.post('/api/spider/upload-to-db', {
        configs: configsResponse.data
      })
      
      message.success(uploadResponse.data.message || '脚本上传成功')
      fetchSpiders()
    } catch (error) {
      message.error('上传脚本失败')
      console.error(error)
    } finally {
      setUploadLoading(false)
    }
  }

  // 切换爬虫状态
  const handleToggleSpider = async (spiderName, isEnabled) => {
    try {
      
      // 转换 isEnabled 为数字 1 或 0
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
      
      
      // 获取本地脚本列表
      const scriptsResponse = await api.get('/api/spider/local-scripts')
      
      // 获取数据库中已有的爬虫配置
      const configsResponse = await api.get('/api/spider/configs')
      
      const localScripts = scriptsResponse.data
      const dbConfigs = configsResponse.data
      
      // 标记已存在的脚本
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
      
      // 从文件名提取脚本名称（去掉 .js 扩展名）
      const scriptFileName = script.file.replace('.js', '');
      
      // 获取脚本内容 - 使用脚本的名称（getModuleName() 返回的名称）
      
      const scriptResponse = await api.get(`http://localhost:3001/api/spider/script/${script.name}`)
      
      const scriptContent = scriptResponse.data.script || ''
      
      // 填充表单数据
      formInstance?.setFieldsValue({
        name: script.name,
        type: 'live',
        url: script.host,
        interval: script.interval || 300,
        isEnabled: true,
        createScript: false, // 不要创建脚本文件，因为已经存在
        scriptContent: scriptContent
      })
      
      // 关闭本地脚本模态框
      setIsLocalScriptsModalVisible(false)
      
      // 显示添加爬虫模态框
      setIsModalVisible(true)
      
      // 重置编辑状态
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
  const filteredSpiders = spiders.filter(spider => {
    if (!searchUrl) return true
    return spider.url.toLowerCase().includes(searchUrl.toLowerCase())
  })

  // 添加/编辑爬虫模态框组件
  const SpiderModal = () => {
    const [form] = Form.useForm()
    
    // 当模态框打开时，设置form实例
    useEffect(() => {
      setFormInstance(form)
    }, [])
    
    return (
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
                name="scriptContent"
                label="脚本代码"
                rules={[{ required: true, message: '请输入脚本代码' }]}
                initialValue={
`// 爬虫脚本模板
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
    // username = $('.anchor-info .name').text().trim();
    
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
}`}
              >
                <Editor
                  height="500px"
                  defaultLanguage="javascript"
                  value={form.getFieldValue('scriptContent') || ''}
                  onChange={(value) => form.setFieldsValue({ scriptContent: value })}
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
    )
  }

  // 编辑脚本模态框组件
  const ScriptModal = () => {
    const [scriptForm] = Form.useForm()
    
    // 当模态框打开时，设置scriptForm实例
    useEffect(() => {
      setScriptFormInstance(scriptForm)
    }, [])
    
    return (
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
                  value={scriptForm.getFieldValue('script')}
                  onChange={(value) => {
                    scriptForm.setFieldsValue({ script: value });
                    setScriptChanged(true);
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
                    onClick={() => scriptForm.submit()} 
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
                        {/* 使用预处理后的数据渲染，只显示有数据的字段 */}
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
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>爬虫管理</h1>
      
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
        <Button type="primary" onClick={uploadScriptsToDatabase} loading={uploadLoading} style={{ marginRight: '10px' }}>
          上传脚本到数据库
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

      <SpiderModal />
      <ScriptModal />

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