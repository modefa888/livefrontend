import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Typography, 
  Form, 
  Input, 
  Button, 
  Switch, 
  message, 
  Tabs, 
  InputNumber, 
  Space, 
  Divider, 
  Alert, 
  Empty, 
  Select, 
  List, 
  Modal, 
  Tag, 
  Row, 
  Col, 
  Descriptions,
  Tooltip
} from 'antd';
import { 
  MailOutlined, 
  SettingOutlined, 
  SendOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  StarOutlined, 
  StarFilled,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import api from '../utils/api';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [emailForm] = Form.useForm();
  const [testEmailForm] = Form.useForm();
  const [emailConfigs, setEmailConfigs] = useState([]);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // 常用邮箱配置
  const commonEmailConfigs = [
    { label: 'QQ邮箱', value: 'qq', config: { host: 'smtp.qq.com', port: 465, secure: true, description: '需要开启SMTP服务并使用授权码' } },
    { label: 'Gmail', value: 'gmail', config: { host: 'smtp.gmail.com', port: 587, secure: false, description: '需要开启两步验证并使用应用专用密码' } },
    { label: '163邮箱', value: '163', config: { host: 'smtp.163.com', port: 465, secure: true, description: '需要开启SMTP服务并使用授权码' } },
    { label: 'Outlook/Hotmail', value: 'outlook', config: { host: 'smtp.office365.com', port: 587, secure: false, description: '使用账户密码' } }
  ];

  // 获取所有邮箱配置
  const fetchEmailConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/settings/email/configs');
      setEmailConfigs(response.data);
    } catch (error) {
      console.error('获取邮箱配置列表失败:', error);
      message.error('获取邮箱配置列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载配置到表单
  const loadConfigToForm = (config) => {
    emailForm.setFieldsValue({
      name: config.name || '',
      enabled: config.is_active === 1 || config.is_active === true,
      host: config.host,
      port: parseInt(config.port) || 587,
      secure: config.secure === 1 || config.secure === true,
      user: config.user,
      pass: config.pass,
      fromEmail: config.from_email,
      fromName: config.from_name || 'LiveBot 系统'
    });
  };

  // 常用邮箱选择处理
  const handleCommonEmailSelect = async (value) => {
    const selectedConfig = commonEmailConfigs.find(item => item.value === value);
    if (!selectedConfig) return;
    
    try {
      if (selectedConfig.config) {
        emailForm.setFieldsValue({
          host: selectedConfig.config.host,
          port: selectedConfig.config.port,
          secure: selectedConfig.config.secure
        });
        message.info(`已加载${selectedConfig.label}默认配置`);
      }
    } catch (error) {
      console.error('加载邮箱配置失败:', error);
    }
  };

  useEffect(() => {
    fetchEmailConfigs();
  }, []);

  // 打开新建配置模态框
  const handleNewConfig = () => {
    setIsEdit(false);
    setCurrentConfig(null);
    emailForm.resetFields();
    emailForm.setFieldsValue({
      port: 587,
      fromName: 'LiveBot 系统',
      name: '新配置'
    });
    setModalVisible(true);
  };

  // 打开编辑配置模态框
  const handleEditConfig = (config) => {
    setIsEdit(true);
    setCurrentConfig(config);
    loadConfigToForm(config);
    setModalVisible(true);
  };

  // 保存邮箱配置
  const handleSaveEmailConfig = async () => {
    try {
      setLoading(true);
      const values = await emailForm.validateFields();
      
      const configData = {
        id: isEdit ? currentConfig.id : undefined,
        name: values.name || '默认配置',
        host: values.host,
        port: parseInt(values.port),
        secure: values.secure === true ? 1 : 0,
        user: values.user,
        pass: values.pass,
        from_email: values.fromEmail || values.user,
        from_name: values.fromName || 'LiveBot 系统',
        is_active: values.enabled === true ? 1 : 0,
        is_default: isEdit ? (currentConfig?.is_default || 0) : (emailConfigs.length === 0 ? 1 : 0)
      };

      const response = await api.post('/api/settings/email/config', configData);
      message.success(isEdit ? '配置更新成功' : '配置创建成功');
      setModalVisible(false);
      await fetchEmailConfigs();
    } catch (error) {
      console.error('保存邮箱配置失败:', error);
      message.error(error.response?.data?.message || '保存邮箱配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试邮件连接
  const handleTestConnection = async () => {
    try {
      const values = emailForm.getFieldsValue();
      const config = {
        host: values.host,
        port: values.port,
        secure: values.secure,
        user: values.user,
        pass: values.pass
      };

      setLoading(true);
      await api.post('/api/settings/email/test-connection', config);
      message.success('邮件服务器连接成功');
    } catch (error) {
      console.error('测试连接失败:', error);
      message.error(error.response?.data?.message || '邮件服务器连接失败');
    } finally {
      setLoading(false);
    }
  };

  // 发送测试邮件
  const handleSendTestEmail = async (values) => {
    try {
      setLoading(true);
      await api.post('/api/settings/email/send-test', values);
      message.success('测试邮件发送成功，请查收');
      testEmailForm.resetFields();
    } catch (error) {
      console.error('发送测试邮件失败:', error);
      message.error(error.response?.data?.message || '发送测试邮件失败');
    } finally {
      setLoading(false);
    }
  };

  // 设置默认配置
  const handleSetDefault = async (config) => {
    try {
      setLoading(true);
      await api.put(`/api/settings/email/config/${config.id}/default`);
      message.success('已设置为默认配置');
      await fetchEmailConfigs();
    } catch (error) {
      console.error('设置默认配置失败:', error);
      message.error('设置默认配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除配置
  const handleDeleteConfig = async (config) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除配置「${config.name}」吗？此操作无法恢复。`,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          await api.delete(`/api/settings/email/config/${config.id}`);
          message.success('配置删除成功');
          await fetchEmailConfigs();
        } catch (error) {
          console.error('删除配置失败:', error);
          message.error('删除配置失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const emailTabItems = [
    {
      key: 'email',
      label: <span><MailOutlined /> 邮件服务</span>,
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title={<><StarOutlined style={{marginRight: 8}} />配置列表</>} 
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleNewConfig}>
                    新建配置
                  </Button>
                }
              >
                {emailConfigs.length === 0 ? (
                  <Empty description="暂无邮箱配置，点击「新建配置」添加" />
                ) : (
                  <List
                    itemLayout="horizontal"
                    dataSource={emailConfigs}
                    renderItem={(config) => (
                      <List.Item
                        actions={[
                          <Tooltip title="编辑">
                            <Button type="text" icon={<EditOutlined />} onClick={() => handleEditConfig(config)} />
                          </Tooltip>,
                          config.is_default ? (
                            <Tooltip title="已设为默认">
                              <Button type="text" disabled icon={<StarFilled />} />
                            </Tooltip>
                          ) : (
                            <Tooltip title="设为默认">
                              <Button type="text" icon={<StarOutlined />} onClick={() => handleSetDefault(config)} />
                            </Tooltip>
                          ),
                          <Tooltip title="删除">
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteConfig(config)} />
                          </Tooltip>
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              {config.is_default && <StarFilled style={{color: '#faad14'}} />}
                              <Text strong>{config.name}</Text>
                              <Tag color={config.is_active ? 'green' : 'red'}>
                                {config.is_active ? <><CheckOutlined />启用</> : <><CloseOutlined />禁用</>}
                              </Tag>
                            </Space>
                          }
                          description={
                            <Descriptions size="small" column={1} layout="inline" style={{marginTop: 4}}>
                              <Descriptions.Item label="服务器">{config.host}:{config.port}</Descriptions.Item>
                              <Descriptions.Item label="用户名">{config.user}</Descriptions.Item>
                            </Descriptions>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title={<><SendOutlined style={{marginRight: 8}} />发送测试邮件</>} style={{height: '100%'}}>
                <Alert
                  message="配置提示"
                  description={
                    <div>
                      <p>• 使用「新建配置」创建邮箱设置</p>
                      <p>• QQ/163邮箱需在邮箱设置中开启SMTP服务并获取授权码</p>
                      <p>• Gmail需开启两步验证并使用应用专用密码</p>
                    </div>
                  }
                  type="info"
                  style={{ marginBottom: 16 }}
                  icon={<ExclamationCircleOutlined />}
                />
                
                <Form
                  form={testEmailForm}
                  layout="vertical"
                  onFinish={handleSendTestEmail}
                >
                  <Form.Item
                    name="to"
                    label="收件人邮箱"
                    rules={[
                      { required: true, message: '请输入收件人邮箱' },
                      { type: 'email', message: '请输入正确的邮箱格式' }
                    ]}
                    placeholder="请输入要接收测试邮件的邮箱"
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />}>
                      发送测试邮件
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'system',
      label: <span><SettingOutlined /> 系统设置</span>,
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Empty description="更多系统设置功能开发中..." />
          </div>
        </Card>
      )
    }
  ];

  return (
    <Layout style={{ padding: '24px' }}>
      <Content>
        <Card>
          <Title level={3} style={{ marginBottom: 24 }}>系统设置</Title>
          <Tabs items={emailTabItems} defaultActiveKey="email" />
        </Card>
        
        {/* 配置编辑/新建模态框 */}
        <Modal
          title={isEdit ? <><EditOutlined /> 编辑配置</> : <><PlusOutlined /> 新建配置</>}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={emailForm}
            layout="vertical"
            initialValues={{
              port: 587,
              fromName: 'LiveBot 系统',
              name: '新配置'
            }}
          >
            <Form.Item
              name="name"
              label="配置名称"
              rules={[{ required: true, message: '请输入配置名称' }]}
            >
              <Input placeholder="给这个配置起个名字" />
            </Form.Item>

            <Form.Item
              name="enabled"
              label="启用邮件服务"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Divider orientation="left">SMTP 服务器配置</Divider>

            <Form.Item label="常用邮箱配置">
              <Select
                placeholder="选择常用邮箱快速配置"
                onChange={handleCommonEmailSelect}
                style={{ width: '100%' }}
                options={commonEmailConfigs}
              />
            </Form.Item>

            <Form.Item
              name="host"
              label="SMTP 服务器地址"
              rules={[{ required: true, message: '请输入SMTP服务器地址' }]}
              placeholder="例如: smtp.qq.com 或 smtp.gmail.com"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="port"
              label="端口"
              rules={[{ required: true, message: '请输入端口号' }]}
            >
              <InputNumber style={{ width: '100%' }} placeholder="常用端口: 465, 587, 25" />
            </Form.Item>

            <Form.Item
              name="secure"
              label="启用 SSL/TLS"
              valuePropName="checked"
              tooltip="端口465通常需要启用，端口587通常不需要"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="user"
              label="SMTP 用户名"
              rules={[{ required: true, message: '请输入SMTP用户名' }]}
              placeholder="通常是您的邮箱地址"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="pass"
              label="SMTP 密码 / 授权码"
              rules={[{ required: true, message: '请输入SMTP密码或授权码' }]}
              placeholder="QQ邮箱需使用授权码，Gmail需使用应用专用密码"
            >
              <Input.Password />
            </Form.Item>

            <Divider orientation="left">发件人配置</Divider>

            <Form.Item
              name="fromEmail"
              label="发件人邮箱"
              placeholder="留空则使用SMTP用户名"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="fromName"
              label="发件人名称"
              placeholder="默认为 LiveBot 系统"
            >
              <Input />
            </Form.Item>

            <Divider />

            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  onClick={handleSaveEmailConfig} 
                  loading={loading} 
                  icon={<SettingOutlined />}
                >
                  {isEdit ? '更新配置' : '保存配置'}
                </Button>
                <Button 
                  onClick={handleTestConnection} 
                  loading={loading} 
                  icon={<CheckCircleOutlined />}
                >
                  测试连接
                </Button>
                <Button onClick={() => setModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Settings;
