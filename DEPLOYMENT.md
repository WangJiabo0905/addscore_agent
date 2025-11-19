# 保研加分小助手部署指南

## 系统要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- MongoDB >= 4.4.0
- 操作系统：Windows 10/11, macOS 10.15+, Ubuntu 18.04+

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd 保研加分agent
```

### 2. 安装依赖
```bash
# 使用启动脚本（推荐）
./start.sh

# 或手动安装
npm install
cd server && npm install
cd ../client && npm install
```

### 3. 配置环境变量
```bash
# 复制环境配置文件
cp server/env.example server/.env

# 编辑配置文件
nano server/.env
```

### 4. 启动服务
```bash
# 开发环境
npm run dev

# 生产环境
npm run build
npm start
```

## 环境配置

### 数据库配置
```env
MONGODB_URI=mongodb://localhost:27017/保研加分小助手
```

### JWT配置
```env
JWT_SECRET=your-secret-key-here
```

### 文件上传配置
```env
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

## 生产环境部署

### 1. 构建项目
```bash
npm run build
```

### 2. 使用PM2管理进程
```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start server/dist/index.js --name "保研加分小助手-api"

# 查看状态
pm2 status

# 查看日志
pm2 logs
```

### 3. 使用Nginx反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /path/to/client/build;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 数据库初始化

### 1. 创建数据库
```bash
# 连接MongoDB
mongo

# 创建数据库
use 保研加分小助手
```

### 2. 创建索引
```javascript
// 在MongoDB shell中执行
db.users.createIndex({ "studentId": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.achievements.createIndex({ "studentId": 1, "type": 1 })
db.applications.createIndex({ "studentId": 1 })
```

## 系统配置

### 1. 创建管理员账户
```bash
# 使用MongoDB shell创建管理员
mongo 保研加分小助手
```

```javascript
db.users.insertOne({
  studentId: "admin001",
  name: "系统管理员",
  email: "admin@xmu.edu.cn",
  password: "$2a$10$...", // 使用bcrypt加密的密码
  role: "admin",
  department: "信息学院",
  major: "计算机科学与技术",
  grade: "2021级",
  class: "计算机1班",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 2. 配置规则引擎
```javascript
// 在管理后台或直接操作数据库
db.ruleconfigs.insertMany([
  {
    category: "paper",
    key: "paper_scores",
    value: { A: 10, B: 6, C: 1 },
    description: "论文计分规则",
    effectiveYear: "2024",
    version: "1.0",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    category: "contest",
    key: "contest_scores",
    value: { national_first: 8, national_second: 6, national_third: 4 },
    description: "竞赛计分规则",
    effectiveYear: "2024",
    version: "1.0",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

## 监控和日志

### 1. 日志配置
```bash
# 创建日志目录
mkdir -p server/logs

# 配置日志轮转
# 使用logrotate或类似工具
```

### 2. 监控配置
```bash
# 使用PM2监控
pm2 install pm2-logrotate

# 配置监控
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## 备份和恢复

### 1. 数据库备份
```bash
# 备份数据库
mongodump --db 保研加分小助手 --out ./backup/$(date +%Y%m%d)

# 恢复数据库
mongorestore --db 保研加分小助手 ./backup/20240915/保研加分小助手
```

### 2. 文件备份
```bash
# 备份上传文件
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz server/uploads/
```

## 故障排除

### 1. 常见问题

**问题：数据库连接失败**
```bash
# 检查MongoDB服务状态
systemctl status mongod

# 检查连接字符串
echo $MONGODB_URI
```

**问题：文件上传失败**
```bash
# 检查上传目录权限
ls -la server/uploads/

# 检查磁盘空间
df -h
```

**问题：前端构建失败**
```bash
# 清理缓存
rm -rf client/node_modules
npm install

# 检查Node.js版本
node --version
```

### 2. 日志查看
```bash
# 查看应用日志
tail -f server/logs/app.log

# 查看PM2日志
pm2 logs

# 查看Nginx日志
tail -f /var/log/nginx/access.log
```

## 性能优化

### 1. 数据库优化
```javascript
// 创建复合索引
db.achievements.createIndex({ "studentId": 1, "type": 1, "achievementDate": -1 })
db.applications.createIndex({ "status": 1, "academicYear": 1, "totalScore": -1 })
```

### 2. 缓存配置
```bash
# 安装Redis（可选）
sudo apt-get install redis-server

# 配置Redis连接
# 在.env文件中添加REDIS_URL
```

### 3. 静态资源优化
```bash
# 启用Gzip压缩
# 在Nginx配置中添加
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## 安全配置

### 1. HTTPS配置
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # 其他配置...
}
```

### 2. 防火墙配置
```bash
# 开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 3. 数据库安全
```javascript
// 创建只读用户
db.createUser({
  user: "readonly",
  pwd: "password",
  roles: [{ role: "read", db: "保研加分小助手" }]
})
```

## 更新和维护

### 1. 系统更新
```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
npm install

# 重新构建
npm run build

# 重启服务
pm2 restart 保研加分小助手-api
```

### 2. 定期维护
```bash
# 清理日志文件
pm2 flush

# 重启服务
pm2 restart all

# 检查系统状态
pm2 status
```

## 联系和支持

如有问题，请联系：
- 技术支持：tech-support@xmu.edu.cn
- 系统管理员：admin@xmu.edu.cn
- 项目文档：https://github.com/your-repo/docs
