import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Spin, Alert, message } from 'antd'
import api from '../utils/api'

function PageView() {
  const { path } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [countdown, setCountdown] = useState(3)
  const [isStaticFile, setIsStaticFile] = useState(false)
  const [staticFileUrl, setStaticFileUrl] = useState(null)

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true)
      setError(null)
      setIsStaticFile(false)
      setStaticFileUrl(null)
      
      try {
        // 先调用API获取页面信息，检查权限
        const response = await api.get(`/api/pages/view/${path}`)
        const pageData = response.data.page
        
        // 检查是否有对应的静态HTML文件（两种可能）
        let staticUrl = null
        
        // 1. 检查数据库content是否是html文件名
        if (pageData.content && pageData.content.endsWith('.html')) {
          const testUrl = `/api/html/${pageData.content}`
          try {
            const testResponse = await fetch(testUrl)
            if (testResponse.ok) {
              staticUrl = testUrl
            }
          } catch (e) {
            // 继续试其他可能
          }
        }
        
        // 2. 如果上面没找到，检查 /api/html/${path}.html
        if (!staticUrl) {
          const testUrl = `/api/html/${path}.html`
          try {
            const testResponse = await fetch(testUrl)
            if (testResponse.ok) {
              staticUrl = testUrl
            }
          } catch (e) {
            // 找不到静态文件
          }
        }
        
        // 如果找到静态文件，用iframe渲染
        if (staticUrl) {
          setIsStaticFile(true)
          setStaticFileUrl(staticUrl)
          setLoading(false)
          return
        }
        
        // 没有静态文件，用数据库内容渲染
        setPage(pageData)
        
      } catch (error) {
        if (error.response?.status === 401) {
          message.error('需登录')
          setError('需登录')
        } else if (error.response?.status === 404) {
          setError('页面不存在或已禁用')
        } else {
          setError('加载页面失败')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [path])

  useEffect(() => {
    if (error === '需登录') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            window.location.href = `/login?redirect=/v/${path}`
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [error, path])

  // 如果是静态文件，使用iframe渲染
  if (isStaticFile && staticFileUrl) {
    return (
      <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
        <iframe 
          src={staticFileUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={path}
        />
      </div>
    )
  }

  return (
    <div className="page-view-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <Alert
            message=""
            description={
              error === '需登录' ? (
                <div>
                  需登录
                  <br />
                  <span style={{ fontSize: '14px', color: '#666' }}>将在 {countdown} 秒后跳转到登录页面...</span>
                </div>
              ) : error
            }
            type="error"
            showIcon
            style={{ maxWidth: '400px', textAlign: 'center' }}
          />
        </div>
      ) : page ? (
        <div>
          <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>{page.title}</h1>
          <div 
            style={{ 
              lineHeight: '1.6', 
              fontSize: '16px',
              whiteSpace: 'pre-line'
            }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
          <div style={{ marginTop: '40px', textAlign: 'right', color: '#999', fontSize: '14px' }}>
            更新时间: {page.updated_at}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default PageView
