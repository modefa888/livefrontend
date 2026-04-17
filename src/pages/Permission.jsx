import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Select, Switch, message, Spin, Result } from 'antd'
import { SettingOutlined, SaveOutlined, SyncOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { Option } = Select

function Permission() {
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [permissionChecked, setPermissionChecked] = useState(false)

  // 检查用户权限
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await api.get('/api/auth/me')
        setUser(response.data)
        setHasPermission(response.data.permissionLevel === 3) // 只有超级管理员可以访问
      } catch (error) {
        message.error('获取用户信息失败')
        setHasPermission(false)
      } finally {
        setPermissionChecked(true)
      }
    }
    
    checkPermission()
  }, [])

  // 加载权限配置
  useEffect(() => {
    if (hasPermission) {
      fetchPermissions()
    } else {
      setLoading(false)
    }
  }, [hasPermission])

  const fetchPermissions = async () => {
    setLoading(true)
    try {
      // 从后端API获取权限配置数据
      const response = await api.get('/api/permission')
      
      const apiPermissions = response.data
      
      // 转换数据格式
      const formattedPermissions = apiPermissions.map(item => ({
        id: item.id,
        module: item.module,
        path: item.path,
        permissionLevels: [
          item.permission_level_1 ? 1 : null,
          item.permission_level_2 ? 2 : null,
          item.permission_level_3 ? 3 : null
        ].filter(level => level !== null),
        description: item.description
      }))
      
      setPermissions(formattedPermissions)
    } catch (error) {
      message.error('获取权限配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 单独更新权限配置
  const handlePermissionChange = async (record, level, checked) => {
    setLoading(true)
    try {
      // 准备更新数据
      const permissionData = {
        id: record.id,
        permission_level_1: record.permissionLevels.includes(1) ? 1 : 0,
        permission_level_2: record.permissionLevels.includes(2) ? 1 : 0,
        permission_level_3: record.permissionLevels.includes(3) ? 1 : 0
      }
      
      // 更新对应权限等级
      permissionData[`permission_level_${level}`] = checked ? 1 : 0
      
      // 调用后端API保存权限配置
      await api.put('/api/permission', {
        permissions: [permissionData]
      })
      
      // 重新获取最新权限配置
      await fetchPermissions()
      message.success('权限配置更新成功')
    } catch (error) {
      message.error('更新权限配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '模块名称',
      dataIndex: 'module',
      key: 'module',
      width: 150
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      width: 150
    },
    {
      title: '普通用户 (1)',
      dataIndex: 'level1',
      key: 'level1',
      width: 100,
      render: (_, record) => (
        <Switch 
          checked={record.permissionLevels.includes(1)}
          onChange={(checked) => handlePermissionChange(record, 1, checked)}
        />
      )
    },
    {
      title: '管理员 (2)',
      dataIndex: 'level2',
      key: 'level2',
      width: 100,
      render: (_, record) => (
        <Switch 
          checked={record.permissionLevels.includes(2)}
          onChange={(checked) => handlePermissionChange(record, 2, checked)}
        />
      )
    },
    {
      title: '超级管理员 (3)',
      dataIndex: 'level3',
      key: 'level3',
      width: 120,
      render: (_, record) => (
        <Switch 
          checked={record.permissionLevels.includes(3)}
          onChange={(checked) => handlePermissionChange(record, 3, checked)}
          disabled={record.module === '权限管理'}
        />
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    }
  ]

  return (
    <div>
      {!permissionChecked ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      ) : !hasPermission ? (
        <Result
          status="403"
          title="权限不足"
          subTitle="您没有权限访问权限管理页面"
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2>权限管理</h2>
            <Button 
              icon={<SyncOutlined />} 
              onClick={fetchPermissions}
              loading={loading}
            >
              刷新
            </Button>
          </div>
          
          <Card className="card">
            <p style={{ marginBottom: 16, color: '#666' }}>
              配置不同权限等级的功能访问权限：
              <br />• 权限等级1（普通用户）：可访问仪表盘、我的主播、我的机器人群
              <br />• 权限等级2（管理员）：可访问所有基础管理功能，包括监控、爬虫、工具等
              <br />• 权限等级3（超级管理员）：可访问所有功能，包括系统设置、日志记录、用户管理等
              <br /><br />点击开关直接更新权限配置
            </p>
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
                <Spin size="large" />
              </div>
            ) : (
              <Table 
                columns={columns} 
                dataSource={permissions} 
                rowKey="id" 
                pagination={false}
                scroll={{ y: 500 }}
              />
            )}
          </Card>
        </>
      )}
    </div>
  )
}

export default Permission