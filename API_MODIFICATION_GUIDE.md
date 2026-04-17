# API 请求修改指南

## 问题说明

生产环境部署后，API 请求需要直接请求第三方接口，而不是使用 Vite 的 proxy 配置。

## 需要修改的文件

所有使用 `import axios from 'axios'` 的 `.jsx` 页面文件都需要修改。

## 修改步骤

### 步骤 1: 修改 import 语句

修改前：
```javascript
import axios from 'axios'
```

修改后：
```javascript
import api from '../utils/api'
```

### 步骤 2: 替换所有 axios. 为 api.

修改前：
```javascript
const response = await axios.get('/api/xxx', {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
```

修改后：
```javascript
const response = await api.get('/api/xxx')
```

### 步骤 3: 删除 const token 变量（如果有）

如果文件中有：
```javascript
const token = localStorage.getItem('token')
```

删除这行代码，因为 api.js 会自动处理。

### 步骤 4: 删除 headers 配置

删除所有这样的配置：
```javascript
{
  headers: {
    Authorization: `Bearer ${token}`
  }
}
```

## 示例

### 修改前（Dashboard.jsx）：
```javascript
import axios from 'axios'

const response = await axios.get('/api/auth/me', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
})
```

### 修改后（Dashboard.jsx）：
```javascript
import api from '../utils/api'

const response = await api.get('/api/auth/me')
```

## 文件清单

需要修改的文件列表：
- App.jsx
- Bot.jsx
- BotGroups.jsx
- Config.jsx
- Dashboard.jsx
- Login.jsx
- LoginLogs.jsx
- Logs.jsx
- Messages.jsx
- Monitor.jsx
- MonitorStats.jsx
- OperationLogs.jsx
- Pages.jsx
- PageView.jsx
- Permission.jsx
- Profile.jsx
- Settings.jsx
- Spider.jsx
- TodayLive.jsx
- Tools.jsx
- Users.jsx
- Vtbs.jsx

**注意：SiteInfo.jsx 已经是新文件，无需修改。**

