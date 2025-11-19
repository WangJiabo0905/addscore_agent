# 🚀 一键部署到公网 - 最简单方法

## 方法一：Vercel 部署（推荐，5分钟完成）

### 步骤 1：创建 GitHub 仓库
1. 访问 https://github.com
2. 点击右上角的 "+" 号，选择 "New repository"
3. 仓库名：`addscore-agent`
4. 选择 "Public"
5. 点击 "Create repository"

### 步骤 2：推送代码到 GitHub
```bash
# 在项目目录中运行
git remote add origin https://github.com/你的用户名/addscore-agent.git
git push -u origin main
```

### 步骤 3：部署到 Vercel
1. 访问 https://vercel.com
2. 点击 "Sign up" 使用 GitHub 登录
3. 点击 "New Project"
4. 选择你的 `addscore-agent` 仓库
5. 点击 "Deploy"

### 步骤 4：完成！
- 等待 2-3 分钟部署完成
- 获得域名：`https://addscore-agent-你的用户名.vercel.app`
- 所有功能都在这个域名下！

## 方法二：Netlify 部署（备选）

### 步骤 1-2：同上，先推送到 GitHub

### 步骤 3：部署到 Netlify
1. 访问 https://netlify.com
2. 使用 GitHub 登录
3. 点击 "New site from Git"
4. 选择你的仓库
5. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `.next`
6. 点击 "Deploy site"

## 🎯 测试账户

部署完成后，使用以下账户测试：

**学生账户：**
- 学号：`22920242203406`
- 密码：`5201314wjb`

**管理员账户：**
- 学号：`1234567890`
- 密码：`123456`

## ✅ 优势

1. **单一域名**：用户只需记住一个网址
2. **无跨域问题**：前后端同源
3. **自动HTTPS**：免费SSL证书
4. **全球CDN**：访问速度快
5. **自动部署**：Git push 自动更新

## 🔧 本地测试

如果你想先测试本地版本：
```bash
npm run dev
# 访问 http://localhost:3000
```

## 📱 最终效果

部署完成后，你的网站将像 GitHub.com 一样：
- 一个域名访问所有功能
- 登录、仪表盘、API 都在同一个域名下
- 用户体验流畅，无技术障碍

**现在就按照方法一去部署吧！只需要 5 分钟！** 🚀
