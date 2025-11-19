# 保研加分小助手 - Next.js 全栈应用

## 🎉 当前状态

✅ **项目已成功转换为 Next.js 全栈应用**
✅ **单一域名部署方案已就绪**
✅ **本地开发服务器正在运行**

## 🚀 下一步操作

### 1. 测试本地应用
打开浏览器访问：http://localhost:3000

你应该看到：
- 自动重定向到登录页面
- 支持 10-14 位学号格式
- 现代化的登录界面
- 使用默认账号 `22920242203406 / 5201314wjb` 成功登录并进入仪表盘

### 2. 部署到公网

#### 方法一：使用 Vercel（推荐）

1. **推送到 GitHub**
   ```bash
   git add .
   git commit -m "Convert to Next.js fullstack app"
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

#### 方法二：使用其他平台

- **Netlify**: 支持 Next.js 全栈部署
- **Railway**: 支持 Node.js 应用
- **Heroku**: 传统 PaaS 平台

### 3. 配置数据库

1. **创建 MongoDB Atlas 账户**
   - 访问 https://www.mongodb.com/atlas
   - 创建免费集群

2. **获取连接字符串**
   - 在 Atlas 控制台中获取连接字符串
   - 替换用户名、密码和数据库名

3. **配置网络访问**
   - 添加 IP 白名单 (0.0.0.0/0 允许所有 IP)

## 📱 访问地址

部署完成后，你将获得：
- **主站**: `https://your-app.vercel.app`
- **登录**: `https://your-app.vercel.app/login`
- **仪表盘**: `https://your-app.vercel.app/dashboard`
- **API**: `https://your-app.vercel.app/api/*`

## 🎯 优势

1. **单一域名**: 用户只需记住一个网址
2. **无跨域问题**: 前后端同源
3. **自动部署**: Git push 自动部署
4. **全球 CDN**: Vercel 提供全球加速
5. **HTTPS**: 自动 SSL 证书
6. **Serverless**: 按需扩展，成本低

## 🛠️ 技术栈

- **前端**: Next.js 14 App Router + TypeScript
- **样式**: Tailwind CSS（新增目录/反馈模块）+ Ant Design（存量页面）
- **后端**: Next.js API Routes（Serverless Functions）
- **数据层**: MongoDB Atlas（存量业务）+ PostgreSQL / Supabase Storage（Prisma 管理目录 & 反馈）
- **ORM**: Prisma 5
- **部署**: Vercel (全栈托管)
- **状态管理**: React Hooks + localStorage

## 🆕 新增功能（2024）

1. **加分项目总目录**（`/catalog`）  
   - 分类导航、关键字搜索、标签筛选、空状态/骨架加载  
   - 项目卡片展示最高加分、材料清单、政策徽章、答辩/公示提示  
   - 内嵌申请弹窗（`<ApplyDialog/>`）动态生成字段，并调用 `POST /api/applications`
2. **网站问题反馈闭环**  
   - 学生端浮动按钮 `<FeedbackDrawer/>` 支持截图上传（Supabase Storage）与优先级标注  
   - `/ (student)/feedback` 查看历史工单与进度  
   - 管理端 `/admin/feedback` 表格筛选、状态流转（OPEN → IN_PROGRESS/RESOLVED/WONT_FIX）、备注记录

关键政策参数统一声明在 `lib/policy.ts`，数据库 Schema（Prisma）、校验逻辑（Zod）和前端展示保持一致。

## 🔐 默认账号

系统首次启动会自动初始化默认学生账号：

- 学号：`22920242203406`
- 密码：`5201314wjb`

登录后可在「个人信息」页修改姓名、联系方式等资料。密码存储为哈希值，可在 MongoDB 中自行更新或另建账号。

## 📝 项目结构

```
app/
├── (student)/
│   ├── apply/[slug]/          # 直接跳转申请页（复用 ApplyDialog）
│   ├── catalog/               # 加分项目总目录
│   ├── feedback/              # 学生端反馈历史
│   └── layout.tsx             # 学生端基础布局 + FeedbackDrawer
├── (admin)/
│   ├── feedback/              # 管理端反馈面板
│   └── layout.tsx
├── api/
│   ├── applications/          # Prisma CatalogApplication CRUD
│   ├── catalog/               # 目录列表 & 详情
│   ├── feedback/              # 反馈收集/查询
│   └── uploads/               # Supabase Storage / 本地上传
├── achievements/              # 既有成就管理
├── dashboard/                 # 仪表盘
├── login/                     # 登录页
├── profile/                   # 个人信息
├── layout.tsx                 # 根布局
└── page.tsx                   # 首页重定向

components/
├── admin/AdminFeedbackTable.tsx
├── catalog/                   # Filters / Cards / ApplyDialog
└── feedback/FeedbackDrawer.tsx

lib/
├── policy.ts                  # 政策常量、目录配置
├── prisma.ts                  # Prisma 客户端
└── validation.ts              # Zod 校验

prisma/
├── schema.prisma              # PostgreSQL Schema
└── seed.ts                    # 目录与项目种子数据
```

## ⚙️ 环境变量

| 变量 | 说明 |
| --- | --- |
| `MONGODB_URI` | 既有业务使用的 MongoDB 连接串 |
| `JWT_SECRET` | 旧版登录模块使用的 JWT 密钥 |
| `DATABASE_URL` | Prisma 用于目录/反馈模块的 PostgreSQL 连接串（兼容 Supabase） |
| `SUPABASE_URL` | Supabase 项目地址，启用截图/材料上传时必填 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key，用于服务端上传 |
| `SUPABASE_STORAGE_BUCKET` | 用于存放截图/附件的存储桶名称 |

> 若暂未配置 Supabase，将自动回退到 `public/uploads` 本地存储（开发调试用）。

## 🔧 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 Mongo / PostgreSQL / Supabase 配置

# 初始化 Prisma Schema 并同步数据
npx prisma migrate dev
npx prisma db seed

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

## 📞 需要帮助？

如果遇到问题，请检查：
1. Node.js 版本 >= 18
2. MongoDB 连接字符串是否正确
3. 环境变量是否配置
4. 网络连接是否正常

现在你只需要一个域名就能访问所有功能！🎉
