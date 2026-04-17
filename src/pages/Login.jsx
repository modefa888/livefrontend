import React, { useState, useEffect, useRef } from 'react'
import { Form, Input, Button, message, Tabs } from 'antd'
import api from '../utils/api'

const { TabPane } = Tabs

function Login({ setUser }) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [captchaSrc, setCaptchaSrc] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const [loginClickCount, setLoginClickCount] = useState(0)
  const [showRegister, setShowRegister] = useState(false)

  // 输入框引用
  const loginUsernameRef = useRef(null)
  const loginPasswordRef = useRef(null)
  const registerUsernameRef = useRef(null)
  const registerPasswordRef = useRef(null)
  const registerConfirmPasswordRef = useRef(null)
  const registerCaptchaRef = useRef(null)

  // 生成验证码
  const generateCaptcha = () => {
    const timestamp = new Date().getTime()
    const url = `/api/auth/captcha?timestamp=${timestamp}`
    
    // 发送请求获取验证码和验证码 ID
    fetch(url)
      .then(response => {
        // 从响应头获取验证码 ID
        const id = response.headers.get('X-Captcha-Id')
        if (id) {
          setCaptchaId(id)
        }
        return response.blob()
      })
      .then(blob => {
        setCaptchaSrc(URL.createObjectURL(blob))
      })
      .catch(error => {
        console.error('生成验证码失败:', error)
      })
  }

  // 组件加载时生成验证码并检查URL参数
  useEffect(() => {
    generateCaptcha()
    
    // 检查URL参数，处理自动登录
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('userId');
    const username = urlParams.get('username');
    
    if (token) {
      // 直接使用 token 登录
      handleTokenLogin(token);
    } else if (userId && username) {
      // 旧方式：使用 userId 和 username 登录
      handleAutoLogin(userId, username);
    }
  }, [activeTab])

  // 处理 token 登录
  const handleTokenLogin = async (token) => {
    setLoading(true);
    try {
      // 验证 token 是否有效
      const response = await api.get('/api/auth/me');
      
      if (response.data) {
        // 存储 token 并设置用户信息
        localStorage.setItem('token', token);
        setUser({
          id: response.data.id,
          username: response.data.username,
          permissionLevel: response.data.permissionLevel
        });
        message.success('自动登录成功');
        
        // 检查是否有重定向地址
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        if (redirect) {
          window.location.href = redirect;
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        message.error('登录失败：无效的token');
      }
    } catch (error) {
      message.error('自动登录失败');
    } finally {
      setLoading(false);
    }
  }

  // 处理自动登录（旧方式）
  const handleAutoLogin = async (userId, username) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login/telegram', {
        userId,
        username
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      message.success('自动登录成功');
      
      // 检查是否有重定向地址
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      if (redirect) {
        window.location.href = redirect;
      } else {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      message.error(error.response?.data?.message || '自动登录失败');
    } finally {
      setLoading(false);
    }
  }

  const onLoginFinish = async (values) => {
    setLoading(true)
    try {
      const response = await api.post('/api/auth/login', values)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      setUser(user)
      message.success('登录成功')
      
      // 检查是否有重定向地址
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      if (redirect) {
        window.location.href = redirect;
      } else {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      message.error(error.response?.data?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const onRegisterFinish = async (values) => {
    setLoading(true)
    try {
      // 添加验证码 ID 到提交数据
      const registerData = {
        ...values,
        captchaId
      }
      await api.post('/api/auth/register', registerData)
      message.success('注册成功，正在自动登录...')
      // 注册成功后自动登录
      const loginResponse = await api.post('/api/auth/login', {
        username: values.username,
        password: values.password
      })
      const { token, user } = loginResponse.data
      localStorage.setItem('token', token)
      setUser(user)
      message.success('登录成功')
      
      // 检查是否有重定向地址
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      if (redirect) {
        window.location.href = redirect;
      } else {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      message.error(error.response?.data?.message || '注册失败')
      // 注册失败后重新生成验证码
      generateCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>LiveBot 管理后台</h1>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className={!showRegister ? 'single-tab' : ''}
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form
                  name="login"
                  initialValues={{ remember: true }}
                  onFinish={onLoginFinish}
                >
                  <Form.Item
                    name="username"
                    rules={[
                      { required: true, message: '请输入用户名' },
                      { min: 3, max: 20, message: '用户名长度必须在 3-20 之间' },
                      { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '用户名只能包含字母、数字和下划线，且不能以数字开头' }
                    ]}
                  >
                    <Input 
                      placeholder="用户名" 
                      ref={loginUsernameRef}
                      onPressEnter={() => loginPasswordRef.current?.focus()}
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 6, max: 20, message: '密码长度必须在 6-20 之间' }
                    ]}
                  >
                    <Input.Password 
                      placeholder="密码" 
                      ref={loginPasswordRef}
                      onPressEnter={() => {
                        // 触发登录表单提交
                        document.querySelector('form[name="login"] button[type="submit"]')?.click()
                      }}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      style={{ width: '100%' }} 
                      loading={loading}
                      onClick={() => {
                        setLoginClickCount(prev => {
                          const newCount = prev + 1
                          if (newCount >= 3) {
                            setShowRegister(true)
                            message.success('注册功能已解锁')
                          }
                          return newCount
                        })
                      }}
                    >
                      登录
                    </Button>
                    {!showRegister && loginClickCount > 0 && loginClickCount < 3 && (
                      <div style={{ textAlign: 'center', marginTop: '8px', color: '#999', fontSize: '12px' }}>
                        再点击 {3 - loginClickCount} 次解锁注册功能
                      </div>
                    )}
                  </Form.Item>
                </Form>
              )
            },
            ...(showRegister ? [{
              key: 'register',
              label: '注册',
              children: (
                <Form
                  name="register"
                  onFinish={onRegisterFinish}
                >
                  <Form.Item
                    name="username"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!value) {
                            return Promise.reject(new Error('请输入用户名'));
                          }
                          if (value.length < 3 || value.length > 20) {
                            return Promise.reject(new Error('用户名长度必须在 3-20 之间'));
                          }
                          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
                            return Promise.reject(new Error('用户名只能包含字母、数字和下划线，且不能以数字开头'));
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input 
                      placeholder="用户名" 
                      ref={registerUsernameRef}
                      onPressEnter={() => registerPasswordRef.current?.focus()}
                    />

                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!value) {
                            return Promise.reject(new Error('请输入密码'));
                          }
                          if (value.length < 6 || value.length > 20) {
                            return Promise.reject(new Error('密码长度必须在 6-20 之间'));
                          }
                          if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(value)) {
                            return Promise.reject(new Error('密码至少包含一个字母和一个数字'));
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input.Password 
                      placeholder="密码" 
                      ref={registerPasswordRef}
                      onPressEnter={() => registerConfirmPasswordRef.current?.focus()}
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: '请确认密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve()
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'))
                        }
                      })
                    ]}
                  >
                    <Input.Password 
                      placeholder="确认密码" 
                      ref={registerConfirmPasswordRef}
                      onPressEnter={() => registerCaptchaRef.current?.focus()}
                    />
                  </Form.Item>

                  <Form.Item
                    name="captcha"
                    rules={[{ required: true, message: '请输入验证码' }]}
                  >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <Input 
                        placeholder="验证码" 
                        style={{ flex: 1 }} 
                        ref={registerCaptchaRef}
                        onPressEnter={() => {
                          // 触发注册表单提交
                          document.querySelector('form[name="register"] button[type="submit"]')?.click()
                        }}
                      />
                      <img 
                        src={captchaSrc} 
                        alt="验证码" 
                        style={{ width: '100px', height: '40px', cursor: 'pointer' }}
                        onClick={generateCaptcha}
                      />
                    </div>
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
                      注册
                    </Button>
                  </Form.Item>
                </Form>
              )
            }] : [])
          ]}
        >
        </Tabs>
      </div>
    </div>
  )
}

export default Login