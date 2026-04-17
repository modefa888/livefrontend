import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Button, message, Select, Spin, Alert, Row, Col, Space, Divider } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone, CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api'

// 加密密钥，应该从环境变量中获取
// 注意：前后端密钥必须一致，且长度必须符合 AES-256 要求（32字节）
const SECRET_KEY = 'your-secret-key-for-encryption';
const IV_LENGTH = 16; // 初始化向量长度

/**
 * 将字符串转换为 32 字节密钥（用于 AES-256）
 * @param {string} str - 输入字符串
 * @returns {Uint8Array} 32字节密钥
 */
function getKeyBytes(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  // 如果密钥长度不足32字节，重复填充；如果超过，截取前32字节
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    key[i] = data[i % data.length];
  }
  return key;
}

/**
 * 将十六进制字符串转换为 Uint8Array
 * @param {string} hex - 十六进制字符串
 * @returns {Uint8Array} 字节数组
 */
function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * 解密数据
 * @param {string} text - 要解密的文本
 * @returns {Promise<string>} 解密后的文本
 */
async function decrypt(text) {
  try {
    // 检查是否为加密格式（包含冒号分隔的IV和密文）
    if (!text || !text.includes(':')) {
      return text; // 不是加密格式，直接返回原文
    }

    const textParts = text.split(':');
    if (textParts.length < 2) {
      return text; // 格式不正确，返回原文
    }

    const ivHex = textParts.shift();
    const encryptedHex = textParts.join(':');

    // 验证IV长度是否为32个字符（16字节）
    if (ivHex.length !== 32) {
      return text; // IV长度不正确，可能是明文
    }

    const iv = hexToUint8Array(ivHex);
    const encryptedText = hexToUint8Array(encryptedHex);
    
    // 使用 Web Crypto API 进行解密
    const key = await window.crypto.subtle.importKey(
      'raw',
      getKeyBytes(SECRET_KEY),
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      key,
      encryptedText
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('解密失败:', error);
    return text; // 解密失败时返回原文本
  }
}

/**
 * 解密环境配置中的敏感字段
 * @param {object} environment - 加密的环境配置对象
 * @returns {Promise<object>} 解密后的环境配置对象
 */
async function decryptEnvironment(environment) {
  const sensitiveFields = ['bot_token', 'authorization', 'github_token'];
  const decryptedEnv = { ...environment };
  
  for (const field of sensitiveFields) {
    if (decryptedEnv[field]) {
      decryptedEnv[field] = await decrypt(decryptedEnv[field]);
    }
  }
  
  return decryptedEnv;
}

/**
 * 解密环境配置列表中的敏感字段
 * @param {array} environments - 加密的环境配置列表
 * @returns {Promise<array>} 解密后的环境配置列表
 */
async function decryptEnvironments(environments) {
  return Promise.all(environments.map(decryptEnvironment));
}

const { TabPane } = Tabs;
const { Option } = Select;

function Config() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('environment');
  const [environments, setEnvironments] = useState([]);
  const [currentEnvironment, setCurrentEnvironment] = useState('local');
  const [settings, setSettings] = useState([]);
  const [sites, setSites] = useState([]);
  
  // 为每个 tab 创建独立的 form 实例
  const [envForm] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [sitesForm] = Form.useForm();
  
  // 独立的保存状态
  const [savingEnv, setSavingEnv] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingSites, setSavingSites] = useState(false);
  
  // 独立的表单变更状态
  const [envChanged, setEnvChanged] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [sitesChanged, setSitesChanged] = useState({});
  const [localSiteValues, setLocalSiteValues] = useState({});
  
  // 敏感字段显示状态
  const [visibleFields, setVisibleFields] = useState({
    bot_token: false,
    authorization: false,
    github_token: false
  });
  
  // 复制到剪贴板
  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success(`${fieldName} 已复制到剪贴板`);
      })
      .catch(err => {
        message.error('复制失败');
        console.error('复制失败:', err);
      });
  };
  
  // 切换字段显示状态
  const toggleVisible = (field) => {
    setVisibleFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 获取配置数据
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        
        // 获取环境配置
        const envResponse = await api.get('/api/config/environments');
        // 解密环境配置中的敏感字段
        const decryptedEnvironments = await decryptEnvironments(envResponse.data.environments);
        setEnvironments(decryptedEnvironments);

        // 获取当前环境
        const currentEnvResponse = await api.get('/api/config/current-env');
        setCurrentEnvironment(currentEnvResponse.data.environment);

        // 获取系统设置
        const settingsResponse = await api.get('/api/config/settings');
        setSettings(settingsResponse.data.settings);

        // 获取网站配置
        const sitesResponse = await api.get('/api/config/sites');
        setSites(sitesResponse.data.sites);
      } catch (error) {
        message.error('获取配置数据失败');
        console.error('获取配置数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // 初始化本地网站配置值
  useEffect(() => {
    const initialValues = {};
    sites.forEach(site => {
      initialValues[site.site_type] = site.site_list;
    });
    setLocalSiteValues(initialValues);
  }, [sites]);

  // 当环境数据或当前标签变化时，设置表单值
  useEffect(() => {
    const envName = activeTab === 'environment' ? 'local' : 'server';
    const environment = environments.find(env => env.env_name === envName);
    if (environment) {
      // 重置表单并设置新值
      envForm.resetFields();
      envForm.setFieldsValue({
        app_name: environment.app_name,
        bot_token: environment.bot_token,
        proxy: environment.proxy,
        authorization: environment.authorization,
        github_token: environment.github_token,
        user_name: environment.user_name,
        user_email: environment.user_email,
        api_host: environment.api_host,
        backend_port: environment.backend_port,
        frontend_port: environment.frontend_port
      });
      setEnvChanged(false);
    }
  }, [environments, activeTab, envForm]);

  // 更新环境配置
  const handleEnvUpdate = async (values) => {
    try {
      setSavingEnv(true);
      const envName = activeTab === 'environment' ? 'local' : 'server';
      await api.put(`/api/config/environments/${envName}`, values);
      message.success('环境配置更新成功');
      setEnvChanged(false);
    } catch (error) {
      message.error('环境配置更新失败');
      console.error('环境配置更新失败:', error);
    } finally {
      setSavingEnv(false);
    }
  };

  // 更新系统设置
  const handleSettingsUpdate = async (values) => {
    try {
      setSavingSettings(true);
      const settingsToUpdate = Object.entries(values).map(([key, value]) => ({
        setting_key: key,
        setting_value: value
      }));
      
      await api.put('/api/config/settings', { settings: settingsToUpdate });
      message.success('系统设置更新成功');
      setSettingsChanged(false);
    } catch (error) {
      message.error('系统设置更新失败');
      console.error('系统设置更新失败:', error);
    } finally {
      setSavingSettings(false);
    }
  };

  // 更新网站配置（单个）
  const handleSiteUpdate = async (siteType, value) => {
    try {
      await api.put(`/api/config/sites/${siteType}`, { site_list: value });
      message.success('网站配置更新成功');
    } catch (error) {
      message.error('网站配置更新失败');
      console.error('网站配置更新失败:', error);
    }
  };

  // 更新网站配置（单个，有加载状态）
  const handleSingleSiteSave = async (siteType, value) => {
    try {
      setSavingSites(true);
      await api.put(`/api/config/sites/${siteType}`, { site_list: value });
      message.success('网站配置更新成功');
      // 更新变更状态
      const newSitesChanged = { ...sitesChanged };
      newSitesChanged[siteType] = false;
      setSitesChanged(newSitesChanged);
    } catch (error) {
      message.error('网站配置更新失败');
      console.error('网站配置更新失败:', error);
    } finally {
      setSavingSites(false);
    }
  };

  // 更新当前环境
  const handleCurrentEnvironmentChange = async (value) => {
    try {
      await api.put('/api/config/current-env', { environment: value });
      setCurrentEnvironment(value);
      message.success('当前环境更新成功');
    } catch (error) {
      message.error('当前环境更新失败');
      console.error('当前环境更新失败:', error);
    }
  };

  // 渲染环境配置表单
  const renderEnvironmentForm = (envName) => {
    const environment = environments.find(env => env.env_name === envName);
    if (!environment) return null;

    return (
      <Form
        form={envForm}
        layout="vertical"
        onFinish={(values) => handleEnvUpdate(values)}
        onValuesChange={() => setEnvChanged(true)}
      >
        <Form.Item 
          label="机器人名称" 
          name="app_name" 
          rules={[{ required: true, message: '请输入机器人名称' }]}
          tooltip={`当前值: ${environment.app_name}`}
        >
          <Input placeholder="请输入机器人名称" />
        </Form.Item>
        <Form.Item 
          label="机器人 Token" 
          name="bot_token" 
          rules={[{ required: true, message: '请输入机器人 Token' }]}
          tooltip={`当前值: ${environment.bot_token}`}
        >
          <Input 
            placeholder="请输入机器人 Token" 
            type={visibleFields.bot_token ? 'text' : 'password'}
            suffix={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Button 
                  type="text" 
                  icon={visibleFields.bot_token ? <EyeInvisibleOutlined /> : <EyeTwoTone />}
                  onClick={() => toggleVisible('bot_token')}
                  style={{ marginRight: 8 }}
                />
                <Button 
                  type="text" 
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(environment.bot_token, '机器人 Token')}
                />
              </div>
            }
          />
        </Form.Item>
        <Form.Item 
          label="代理地址" 
          name="proxy" 
          rules={[{ required: true, message: '请输入代理地址' }]}
          tooltip={`当前值: ${environment.proxy}`}
        >
          <Input placeholder="请输入代理地址" />
        </Form.Item>
        <Form.Item 
          label="授权密钥" 
          name="authorization" 
          rules={[{ required: true, message: '请输入授权密钥' }]}
          tooltip={`当前值: ${environment.authorization}`}
        >
          <Input 
            placeholder="请输入授权密钥" 
            type={visibleFields.authorization ? 'text' : 'password'}
            suffix={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Button 
                  type="text" 
                  icon={visibleFields.authorization ? <EyeInvisibleOutlined /> : <EyeTwoTone />}
                  onClick={() => toggleVisible('authorization')}
                  style={{ marginRight: 8 }}
                />
                <Button 
                  type="text" 
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(environment.authorization, '授权密钥')}
                />
              </div>
            }
          />
        </Form.Item>
        <Form.Item 
          label="GitHub Token" 
          name="github_token" 
          rules={[{ required: true, message: '请输入 GitHub Token' }]}
          tooltip={`当前值: ${environment.github_token}`}
        >
          <Input 
            placeholder="请输入 GitHub Token" 
            type={visibleFields.github_token ? 'text' : 'password'}
            suffix={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Button 
                  type="text" 
                  icon={visibleFields.github_token ? <EyeInvisibleOutlined /> : <EyeTwoTone />}
                  onClick={() => toggleVisible('github_token')}
                  style={{ marginRight: 8 }}
                />
                <Button 
                  type="text" 
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(environment.github_token, 'GitHub Token')}
                />
              </div>
            }
          />
        </Form.Item>
        <Form.Item 
          label="用户名" 
          name="user_name" 
          rules={[{ required: true, message: '请输入用户名' }]}
          tooltip={`当前值: ${environment.user_name}`}
        >
          <Input placeholder="请输入用户名" />
        </Form.Item>
        <Form.Item 
          label="用户邮箱" 
          name="user_email" 
          rules={[{ required: true, message: '请输入用户邮箱' }]}
          tooltip={`当前值: ${environment.user_email}`}
        >
          <Input placeholder="请输入用户邮箱" />
        </Form.Item>
        <Divider />
        <Form.Item 
          label="API主机地址" 
          name="api_host" 
          rules={[{ required: true, message: '请输入API主机地址' }]}
          tooltip={`当前值: ${environment.api_host}`}
        >
          <Input placeholder="例如：http://localhost" />
        </Form.Item>
        <Form.Item 
          label="后端端口" 
          name="backend_port" 
          rules={[{ required: true, message: '请输入后端端口' }]}
          tooltip={`当前值: ${environment.backend_port}`}
        >
          <Input placeholder="例如：3002" />
        </Form.Item>
        <Form.Item 
          label="前端端口" 
          name="frontend_port" 
          rules={[{ required: true, message: '请输入前端端口' }]}
          tooltip={`当前值: ${environment.frontend_port}`}
        >
          <Input placeholder="例如：3003" />
        </Form.Item>
        <Form.Item style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" loading={savingEnv} disabled={!envChanged}>
            保存配置
          </Button>
        </Form.Item>
      </Form>
    );
  };

  // 获取字段提示信息
  const getFieldTooltip = (setting) => {
    if (setting.setting_key === 'dy_jx_groups') {
      return '格式：1_[群组ID列表]，如 1_[-1003000233318,987654321]\n1表示启动群组发送，其他值表示关闭\n群组ID支持负数（频道）和正数（超级群组）';
    }
    if (setting.setting_key === 'dy_jx_api') {
      return '抖音解析接口地址，如 http://xxx/api/dy_jx.php?msg=';
    }
    if (setting.setting_key === 'SITE_KEY_VALUE') {
      return '网站域名映射到网站名称\n格式：{"域名":"网站名称","域名2":"网站名称2"}\n例如：{"live.douyin.com":"抖音","www.huya.com":"虎牙"}';
    }
    if (setting.setting_key === 'KEY_OBJECT') {
      return '英文分类映射到中文分类名称\n格式：{"英文key":"中文名称","英文key2":"中文名称2"}\n例如：{"lucky":"超级福袋","looks":"颜值"}';
    }
    return `配置键: ${setting.setting_key}\n当前值: ${setting.setting_value}`;
  };

  // 键值对编辑器组件
  const KeyValueEditor = ({ setting, onChange }) => {
    // 解析 JSON 字符串为键值对数组
    const parseJsonToPairs = (jsonStr) => {
      try {
        const obj = JSON.parse(jsonStr);
        return Object.entries(obj).map(([key, value]) => ({ key, value }));
      } catch (e) {
        return [];
      }
    };

    // 将键值对数组转换为 JSON 字符串
    const pairsToJson = (pairs) => {
      const obj = {};
      pairs.forEach(pair => {
        if (pair.key) {
          obj[pair.key] = pair.value;
        }
      });
      return JSON.stringify(obj);
    };

    const [pairs, setPairs] = useState(parseJsonToPairs(setting.setting_value));

    // 监听外部 setting_value 变化，同步更新内部状态
    useEffect(() => {
      setPairs(parseJsonToPairs(setting.setting_value));
    }, [setting.setting_value]);

    // 添加新的键值对
    const addPair = () => {
      const newPairs = [...pairs, { key: '', value: '' }];
      setPairs(newPairs);
      onChange(pairsToJson(newPairs));
    };

    // 删除键值对
    const removePair = (index) => {
      const newPairs = [...pairs];
      newPairs.splice(index, 1);
      setPairs(newPairs);
      // 通知表单更新
      onChange(pairsToJson(newPairs));
    };

    // 更新键值对
    const updatePair = (index, field, value) => {
      const newPairs = [...pairs];
      newPairs[index][field] = value;
      setPairs(newPairs);
      // 通知表单更新
      onChange(pairsToJson(newPairs));
    };

    return (
      <div>
        {pairs.map((pair, index) => (
          <Row key={index} gutter={8} style={{ marginBottom: 8 }}>
            <Col span={10}>
              <Input
                placeholder="Key"
                value={pair.key}
                onChange={(e) => updatePair(index, 'key', e.target.value)}
              />
            </Col>
            <Col span={12}>
              <Input
                placeholder="Value"
                value={pair.value}
                onChange={(e) => updatePair(index, 'value', e.target.value)}
              />
            </Col>
            <Col span={2}>
              <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removePair(index)}
            />
            </Col>
          </Row>
        ))}
        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={addPair}
          style={{ marginTop: 8 }}
        >
          添加键值对
        </Button>
      </div>
    );
  };

  // 渲染系统设置表单
  const renderSettingsForm = () => {
    const initialValues = {};
    settings.forEach(setting => {
      initialValues[setting.setting_key] = setting.setting_value;
    });

    // 获取字段的显示标签
    const getFieldLabel = (setting) => {
      if (setting.description) return setting.description;
      if (setting.setting_key === 'SITE_KEY_VALUE') return '网站映射配置';
      if (setting.setting_key === 'KEY_OBJECT') return '分类映射配置';
      return setting.setting_key;
    };

    // 获取字段的占位符
    const getPlaceholder = (setting) => {
      if (setting.description) return `请输入${setting.description}`;
      if (setting.setting_key === 'SITE_KEY_VALUE') return '请输入网站域名映射JSON，例如：{"live.douyin.com":"抖音"}';
      if (setting.setting_key === 'KEY_OBJECT') return '请输入分类映射JSON，例如：{"lucky":"超级福袋"}';
      return `请输入${setting.setting_key}`;
    };

    // 渲染普通的表单项
    const renderNormalField = (setting) => (
      <Form.Item 
        key={setting.setting_key} 
        label={getFieldLabel(setting)} 
        name={setting.setting_key}
        tooltip={getFieldTooltip(setting)}
      >
        {setting.setting_type === 'number' ? (
          <Input type="number" placeholder={getPlaceholder(setting)} />
        ) : (
          <Input placeholder={getPlaceholder(setting)} />
        )}
      </Form.Item>
    );

    // 渲染键值对编辑器字段
    const renderKeyValueField = (setting) => {
      const currentValue = settingsForm.getFieldValue(setting.setting_key) || setting.setting_value;
      
      return (
        <Form.Item 
          key={setting.setting_key} 
          label={getFieldLabel(setting)} 
          name={setting.setting_key}
          tooltip={getFieldTooltip(setting)}
        >
          <KeyValueEditor 
            setting={{ ...setting, setting_value: currentValue }} 
            onChange={(value) => {
              settingsForm.setFieldValue(setting.setting_key, value);
              setSettingsChanged(true);
            }}
          />
          <Divider style={{ margin: '8px 0' }} />
          <details>
            <summary style={{ cursor: 'pointer', color: '#1890ff', fontSize: '12px' }}>查看/编辑原始 JSON</summary>
            <Input.TextArea
              rows={4}
              placeholder={getPlaceholder(setting)}
              value={currentValue}
              onChange={(e) => {
                settingsForm.setFieldValue(setting.setting_key, e.target.value);
                setSettingsChanged(true);
              }}
              style={{ marginTop: 8 }}
            />
          </details>
        </Form.Item>
      );
    };

    return (
      <Form
        form={settingsForm}
        layout="vertical"
        initialValues={initialValues}
        onFinish={(values) => handleSettingsUpdate(values)}
        onValuesChange={() => setSettingsChanged(true)}
      >
        {settings.map(setting => (
          (setting.setting_key === 'SITE_KEY_VALUE' || setting.setting_key === 'KEY_OBJECT') 
            ? renderKeyValueField(setting)
            : renderNormalField(setting)
        ))}
        <Form.Item style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" loading={savingSettings} disabled={!settingsChanged}>
            保存设置
          </Button>
        </Form.Item>
      </Form>
    );
  };

  // 渲染网站配置表单
  const renderSiteForm = () => {
    return (
      <div>
        {sites.map(site => {
          const isChanged = sitesChanged[site.site_type];
          const currentValue = localSiteValues[site.site_type] ?? site.site_list;
          
          return (
            <Card key={site.site_type} title={site.description || (site.site_type === 'S19_SITE' ? '成人网站列表' : 'CG网站源')} style={{ marginBottom: 16 }}>
              <Form.Item 
                label={site.description || (site.site_type === 'S19_SITE' ? '成人网站列表' : 'CG网站源')}
                tooltip={`当前值: ${site.site_list}`}
              >
                <Input.TextArea
                  rows={6}
                  value={currentValue}
                  onChange={(e) => {
                    const newValues = { ...localSiteValues };
                    newValues[site.site_type] = e.target.value;
                    setLocalSiteValues(newValues);
                    const newSitesChanged = { ...sitesChanged };
                    newSitesChanged[site.site_type] = true;
                    setSitesChanged(newSitesChanged);
                  }}
                  placeholder="多个网站以 # 分隔"
                />
              </Form.Item>
              <div style={{ textAlign: 'right' }}>
                <Button 
                  type="primary" 
                  onClick={() => handleSingleSiteSave(site.site_type, currentValue)}
                  loading={savingSites}
                  disabled={!isChanged}
                >
                  保存配置
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <Spin style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>配置管理</h2>
      
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>当前环境</h3>
          <Select value={currentEnvironment} onChange={handleCurrentEnvironmentChange} style={{ width: 200 }}>
            <Option value="local">本地环境</Option>
            <Option value="server">生产环境</Option>
          </Select>
        </div>
        <Alert message="修改当前环境后需要重启服务才能生效" type="info" style={{ marginTop: 16 }} />
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="本地环境配置" key="environment">
          {renderEnvironmentForm('local')}
        </TabPane>
        <TabPane tab="生产环境配置" key="server">
          {renderEnvironmentForm('server')}
        </TabPane>
        <TabPane tab="系统设置" key="settings">
          {renderSettingsForm()}
        </TabPane>
        <TabPane tab="网站配置" key="sites">
          {renderSiteForm()}
        </TabPane>
      </Tabs>
    </div>
  );
}

export default Config;