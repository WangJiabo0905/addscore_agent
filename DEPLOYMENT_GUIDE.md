# 保研加分小助手 - 单一域名部署指南

## 🚀 快速部署（推荐）

### 使用 Vercel 一键部署

1. **准备代码**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **部署到 Vercel**
   - 访问 https://vercel.com
   - 使用 GitHub 登录
   - 点击 "New Project"
   - 选择你的仓库
   - 点击 "Deploy"

3. **配置环境变量**
   在 Vercel 项目设置中添加：
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   JWT_SECRET=your-super-secret-jwt-key
   ```

4. **完成！**
   - 获得一个域名：`https://your-app.vercel.app`
   - 所有功能都在同一个域名下

### 🔧 技术架构

- **前端**: Next.js 13+ App Router
- **后端**: Next.js API Routes (Serverless Functions)
- **数据库**: MongoDB Atlas
- **部署**: Vercel (全栈托管)
- **域名**: 单一域名，无跨域问题

### 📱 访问地址

- **主站**: `https://your-app.vercel.app`
- **登录**: `https://your-app.vercel.app/login`
- **仪表盘**: `https://your-app.vercel.app/dashboard`
- **API**: `https://your-app.vercel.app/api/*`

### 🛠️ 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 📝 项目结构

```
app/
├── api/                 # API 路由
│   ├── auth/
│   │   └── login/      # 登录 API
│   ├── achievements/    # 成果管理 API
│   ├── applications/    # 申请管理 API
│   └── ...
├── login/              # 登录页面
├── dashboard/          # 仪表盘
├── profile/            # 个人信息
├── application/         # 申请管理
├── achievements/       # 成果管理
├── scoring/            # 计分查看
├── admin/              # 管理页面
├── review/             # 审核页面
└── special-academic/   # 特殊学术专长
```

### 🎯 优势

1. **单一域名**: 用户只需记住一个网址
2. **无跨域问题**: 前后端同源
3. **自动部署**: Git push 自动部署
4. **全球 CDN**: Vercel 提供全球加速
5. **HTTPS**: 自动 SSL 证书
6. **Serverless**: 按需扩展，成本低

### 🔒 安全配置

1. **JWT 密钥**: 使用强随机字符串
2. **MongoDB**: 配置 IP 白名单
3. **CORS**: 自动处理，无需配置
4. **环境变量**: 敏感信息不暴露

### 📊 监控和维护

- **Vercel Analytics**: 访问统计
- **Vercel Speed Insights**: 性能监控
- **MongoDB Atlas**: 数据库监控
- **GitHub**: 代码版本控制

现在你只需要一个域名就能访问所有功能！🎉
