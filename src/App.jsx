import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Button, Dropdown, Avatar, message, Spin } from 'antd'
import { HomeOutlined, UserOutlined, SettingOutlined, MonitorOutlined, LogoutOutlined, UserAddOutlined, TeamOutlined, FileTextOutlined, MessageOutlined, RobotOutlined, BugOutlined, ToolOutlined, VideoCameraOutlined, BellOutlined } from '@ant-design/icons'
import api from './utils/api'
import { BotLoadingProvider } from './contexts/BotLoadingContext'

// 页面组件
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Vtbs from './pages/Vtbs'
import Settings from './pages/Settings'
import Logs from './pages/Logs'
import Users from './pages/Users'
import Profile from './pages/Profile'
import LoginLogs from './pages/LoginLogs'
import OperationLogs from './pages/OperationLogs'
import Messages from './pages/Messages'
import Monitor from './pages/Monitor'
import MonitorStats from './pages/MonitorStats'
import Spider from './pages/Spider'
import Tools from './pages/Tools'
import Bot from './pages/Bot'
import BotSelect from './pages/BotSelect'
import FaBuBot from './pages/FaBuBot'
import BotGroups from './pages/BotGroups'
import Permission from './pages/Permission'
import TodayLive from './pages/TodayLive'
import Pages from './pages/Pages'
import PageView from './pages/PageView'
import SiteInfo from './pages/SiteInfo'
import ParseRecords from './pages/ParseRecords'




const { Header, Sider, Content } = Layout

function App() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [permissions, setPermissions] = useState([])
  const [permissionsLoading, setPermissionsLoading] = useState(true)

  // 检查用户登录状态
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const response = await api.get('/api/auth/me')
          setUser(response.data)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('检查登录状态失败:', error)
        localStorage.removeItem('token')
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkLoginStatus()
  }, [])

  // 当用户状态变化时，获取用户权限
  useEffect(() => {
    const getPermissions = async () => {
      if (user) {
        setPermissionsLoading(true)
        try {
          const token = localStorage.getItem('token')
          if (token) {
            const permissionsResponse = await api.get('/api/permission/user')
            setPermissions(permissionsResponse.data)
          }
        } catch (permissionError) {
          console.error('获取权限失败:', permissionError)
          try {
            const token = localStorage.getItem('token')
            if (token) {
              const userResponse = await api.get('/api/auth/me')
              if (userResponse.data) {
                setPermissions([
                  { path: '/dashboard' },
                  { path: '/vtbs' },
                  { path: '/messages' },
                  { path: '/logs' }
                ])
              } else {
                localStorage.removeItem('token')
                setUser(null)
                setPermissions([])
              }
            } else {
              setUser(null)
              setPermissions([])
            }
          } catch (userError) {
            console.error('检查用户状态失败:', userError)
            localStorage.removeItem('token')
            setUser(null)
            setPermissions([])
          }
        } finally {
          setPermissionsLoading(false)
        }
      }
    }

    getPermissions()
  }, [user])

  // 处理登出
  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', {})
    } catch (error) {
    } finally {
      localStorage.removeItem('token')
      setUser(null)
      message.success('登出成功')
    }
  }

  // 处理菜单点击
  const handleMenuClick = (key) => {
    if (key === 'profile') {
      window.location.href = '/profile'
    }
  }

  // 导航菜单 - 基于权限等级
  const allMenuItems = [
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: '仪表盘',
      path: '/dashboard',
      modulePath: '/dashboard'
    },
    {
      key: 'today-live',
      icon: <VideoCameraOutlined />,
      label: '今日直播管理',
      path: '/today-live',
      modulePath: '/today-live'
    },
    {
      key: 'vtbs',
      icon: <MonitorOutlined />,
      label: user?.permissionLevel >= 2 ? '主播管理' : '我的主播',
      path: '/vtbs',
      modulePath: '/vtbs'
    },
    {
      key: 'users',
      icon: <UserAddOutlined />,
      label: '用户管理',
      path: '/users',
      modulePath: '/users'
    },
    {
      key: 'bot-groups',
      icon: <TeamOutlined />,
      label: user?.permissionLevel >= 2 ? '机器人群组管理' : '我的机器人群',
      path: '/bot-groups',
      modulePath: '/bot-groups'
    },
    {
      key: 'monitor',
      icon: <MonitorOutlined />,
      label: '监控管理',
      modulePath: '/monitor',
      children: [
        {
          key: 'monitor-main',
          label: '监控模块',
          path: '/monitor',
          modulePath: '/monitor'
        },
        {
          key: 'monitor-stats',
          label: '监控统计',
          path: '/monitor-stats',
          modulePath: '/monitor-stats'
        }
      ]
    },
    {
      key: 'spider',
      icon: <BugOutlined />,
      label: '爬虫管理',
      path: '/spider',
      modulePath: '/spider'
    },
    {
      key: 'tools',
      icon: <ToolOutlined />,
      label: '工具管理',
      path: '/tools',
      modulePath: '/tools'
    },
    {  
      key: 'bot', 
      icon: <RobotOutlined />, 
      label: '机器人', 
      modulePath: '/bot',
      path: '/bot'
    },
    {
      key: 'logs',
      icon: <FileTextOutlined />,
      label: '监控日志',
      path: '/logs',
      modulePath: '/logs'
    },
    {
      key: 'parse-records',
      icon: <VideoCameraOutlined />,
      label: '解析管理',
      path: '/parse-records',
      modulePath: '/parse-records'
    },
    {
      key: 'messages',
      icon: <MessageOutlined />,
      label: '消息记录',
      path: '/messages',
      modulePath: '/messages'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      path: '/settings',
      modulePath: '/settings'
    },
    {
      key: 'login-logs',
      icon: <TeamOutlined />,
      label: '登录记录',
      path: '/login-logs',
      modulePath: '/login-logs'
    },
    {
      key: 'operation-logs',
      icon: <FileTextOutlined />,
      label: '操作记录',
      path: '/operation-logs',
      modulePath: '/operation-logs'
    },
    {
      key: 'permission',
      icon: <SettingOutlined />,
      label: '权限管理',
      path: '/permission',
      modulePath: '/permission'
    },
    {
      key: 'pages',
      icon: <FileTextOutlined />,
      label: '页面管理',
      path: '/pages',
      modulePath: '/pages'
    },
    {
      key: 'site-info',
      icon: <FileTextOutlined />,
      label: '网页表管理',
      path: '/site-info',
      modulePath: '/site-info'
    },

  ]

  // 根据用户权限和权限配置过滤菜单，并动态更新菜单名称
  const menuItems = user ? allMenuItems.filter(item => {
    // 查找该模块的权限配置
    const modulePermission = permissions.find(perm => perm.path === item.modulePath)
    
    // 如果没有配置，默认不显示
    if (!modulePermission) return false
    
    // 只要在权限列表中存在，就允许访问
    return true
  }).map(item => {
    // 查找该模块的权限配置，获取动态名称
    const modulePermission = permissions.find(perm => perm.path === item.modulePath)
    const dynamicLabel = modulePermission ? modulePermission.module : item.label
    
    // 如果有子菜单，也更新子菜单的名称
    if (item.children) {
      return {
        ...item,
        label: dynamicLabel,
        children: item.children.map(child => {
          const childPermission = permissions.find(perm => perm.path === child.modulePath)
          const childLabel = childPermission ? childPermission.module : child.label
          return {
            ...child,
            label: childLabel
          }
        })
      }
    }
    
    return {
      ...item,
      label: dynamicLabel
    }
  }) : []

  // 加载中状态 - 检查当前路径，如果是登录页面或独立页面则直接渲染
  if (isLoading || permissionsLoading) {
    // 获取当前路径
    const currentPath = window.location.pathname
    
    // 检查是否是独立页面路径
    if (currentPath.startsWith('/v/')) {
      return (
        <Router>
          <Routes>
            <Route path="/v/:path" element={<PageView />} />
          </Routes>
        </Router>
      )
    }
    
    // 检查是否是登录页面
    if (currentPath.startsWith('/login')) {
      return (
        <Router>
          <Routes>
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/login/*" element={<Login setUser={setUser} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      )
    }
    
    // 检查是否有token
    const token = localStorage.getItem('token')
    
    // 如果没有token，直接重定向到登录页面
    if (!token) {
      return (
        <Router>
          <Routes>
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      )
    }
    
    // 有token且不是登录页面，显示加载状态
    return (
      <Router>
        <Layout className="app-container">
          <Header className="header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#1890ff' }}>LiveBot 管理后台</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>加载中...</span>
              </div>
            </div>
          </Header>
          <Layout style={{ overflow: 'hidden' }}>
            <Sider 
              className="sider" 
              width={220}
              style={{
                position: 'fixed',
                left: 0,
                top: 64,
                bottom: 0,
                overflow: 'auto',
                zIndex: 100,
                boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                position: 'relative'
              }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%',
                    backgroundColor: '#1890ff',
                    animation: 'dot-bounce 1.4s infinite ease-in-out both'
                  }}></div>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%',
                    backgroundColor: '#1890ff',
                    animation: 'dot-bounce 1.4s infinite ease-in-out both',
                    animationDelay: '0.2s'
                  }}></div>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%',
                    backgroundColor: '#1890ff',
                    animation: 'dot-bounce 1.4s infinite ease-in-out both',
                    animationDelay: '0.4s'
                  }}></div>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%',
                    backgroundColor: '#1890ff',
                    animation: 'dot-bounce 1.4s infinite ease-in-out both',
                    animationDelay: '0.6s'
                  }}></div>
                </div>
                <style>{`
                  @keyframes dot-bounce {
                    0%, 80%, 100% {
                      transform: scale(0);
                    } 40% {
                      transform: scale(1.0);
                    }
                  }
                `}</style>
              </div>
            </Sider>
            <Content className="content" style={{ marginLeft: 220, overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>加载中...</div>
            </Content>
          </Layout>
        </Layout>
      </Router>
    )
  }

// 导航菜单组件
const NavigationMenu = ({ menuItems, isLoading }) => {
  const location = useLocation()
  const [openKeys, setOpenKeys] = useState([])
  
  // 根据当前路径获取选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname
    
    // 检查子菜单
    for (const item of menuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (path === child.path) {
            return [child.key]
          }
        }
      } else if (path === item.path) {
        return [item.key]
      }
    }
    return ['dashboard']
  }
  
  // 根据当前路径获取展开的菜单项
  const getDefaultOpenKeys = () => {
    const path = location.pathname
    
    for (const item of menuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (path === child.path) {
            return [item.key]
          }
        }
      }
    }
    return []
  }
  
  // 初始化展开状态
  React.useEffect(() => {
    setOpenKeys(getDefaultOpenKeys())
  }, [location.pathname, menuItems])
  
  // 处理菜单点击，实现手风琴效果
  const handleOpenChange = (keys) => {
    // 如果点击的是新的父菜单，折叠之前的菜单
    if (keys.length > 0) {
      setOpenKeys([keys[keys.length - 1]])
    } else {
      setOpenKeys([])
    }
  }
  
  // 处理菜单项
  const processMenuItems = (items) => {
    return items.map(item => {
      if (item.children) {
        return {
          key: item.key,
          icon: item.icon,
          label: item.label,
          children: item.children.map(child => ({
            key: child.key,
            label: <Link to={child.path}>{child.label}</Link>
          }))
        }
      } else {
        return {
          key: item.key,
          icon: item.icon,
          label: <Link to={item.path}>{item.label}</Link>
        }
      }
    })
  }
  
  // 加载中状态
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #1890ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }
  
  return (
    <Menu
      mode="inline"
      selectedKeys={getSelectedKey()}
      openKeys={openKeys}
      onOpenChange={handleOpenChange}
      style={{ 
        height: '100%', 
        borderRight: 0,
        paddingTop: '16px',
        paddingBottom: '16px'
      }}
      items={processMenuItems(menuItems)}
      className="navigation-menu"
    />
  )
}

  return (
    <BotLoadingProvider>
      <Router>
        <Routes>
        {/* 独立页面路由 - 不显示头部和导航菜单 */}
        <Route path="/v/:path" element={<PageView />} />
        
        {/* 登录页面路由 */}
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/login/*" element={<Login setUser={setUser} />} />
        
        {/* 管理后台路由 */}
        <Route path="/*" element={
          user ? (
            <Layout className="app-container">
              <Header className="header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1890ff' }}>LiveBot 管理后台</div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '16px' }}>{user.username}</span>
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'profile',
                            label: '个人信息',
                            onClick: () => handleMenuClick('profile')
                          },
                          {
                            key: 'logout',
                            label: '登出',
                            icon: <LogoutOutlined />,
                            onClick: handleLogout
                          }
                        ]
                      }}
                    >
                      <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
                    </Dropdown>
                  </div>
                </div>
              </Header>
              <Layout style={{ overflow: 'hidden' }}>
                <Sider 
                  className="sider" 
                  width={220}
                  style={{
                    position: 'fixed',
                    left: 0,
                    top: 64,
                    bottom: 0,
                    overflow: 'auto',
                    zIndex: 100,
                    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <NavigationMenu menuItems={menuItems} isLoading={permissionsLoading} />
                </Sider>
                <Content className="content" style={{ marginLeft: 220, overflow: 'auto' }}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/today-live" element={<TodayLive />} />
                    <Route path="/vtbs" element={<Vtbs />} />
                    <Route path="/monitor" element={<Monitor />} />
                    <Route path="/monitor-stats" element={<MonitorStats />} />
                    <Route path="/spider" element={<Spider />} />
                    <Route path="/tools" element={<Tools />} />
                    <Route path="/bot" element={<BotSelect />} />
                    <Route path="/bot/livebot" element={<Bot />} />
                    <Route path="/bot/fabu" element={<FaBuBot />} />
                    <Route path="/bot-groups" element={<BotGroups />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/logs" element={<Logs />} />
                    <Route path="/parse-records" element={<ParseRecords />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/login-logs" element={<LoginLogs />} />
                    <Route path="/operation-logs" element={<OperationLogs />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/permission" element={<Permission />} />
                    <Route path="/pages" element={<Pages />} />
                    <Route path="/site-info" element={<SiteInfo />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Content>
              </Layout>
            </Layout>
          ) : (
            <Routes>
              <Route path="/login" element={<Login setUser={setUser} />} />
              <Route path="/login/*" element={<Login setUser={setUser} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          )
        } />
      </Routes>
    </Router>
    </BotLoadingProvider>
  )
}

export default App