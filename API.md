# 保研加分小助手 API 文档

## 概述

保研加分小助手提供RESTful API接口，支持用户认证、成果管理、申请审核等功能。

## 基础信息

- **Base URL**: `http://localhost:3001/api`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

### 登录
```http
POST /auth/login
```

**请求体**:
```json
{
  "studentId": "2021001001",
  "password": "password123"
}
```

**响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "_id": "64f8b2c1e4b0a1234567890a",
      "studentId": "2021001001",
      "name": "张三",
      "email": "zhangsan@xmu.edu.cn",
      "role": "student",
      "department": "信息学院",
      "major": "计算机科学与技术",
      "grade": "2021级",
      "class": "计算机1班",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 注册
```http
POST /auth/register
```

**请求体**:
```json
{
  "studentId": "2021001002",
  "name": "李四",
  "email": "lisi@xmu.edu.cn",
  "password": "password123",
  "department": "信息学院",
  "major": "软件工程",
  "grade": "2021级",
  "class": "软件1班"
}
```

### 刷新令牌
```http
POST /auth/refresh
```

**请求体**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 用户管理

### 获取用户信息
```http
GET /users/profile
Authorization: Bearer <token>
```

### 更新用户信息
```http
PUT /users/profile
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "name": "张三",
  "email": "zhangsan@xmu.edu.cn",
  "phone": "13800138000"
}
```

### 修改密码
```http
PUT /users/password
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

## 学生信息

### 获取学生信息
```http
GET /students/profile
Authorization: Bearer <token>
```

### 更新学生信息
```http
PUT /students/profile
Authorization: Bearer <token>
```

## 成果管理

### 获取成果列表
```http
GET /achievements?type=paper&status=verified&page=1&limit=10
Authorization: Bearer <token>
```

**查询参数**:
- `type`: 成果类型 (paper, patent, contest, innovation, volunteer, honor, position, sport)
- `status`: 审核状态 (pending, verified, rejected)
- `page`: 页码
- `limit`: 每页数量

### 获取成果详情
```http
GET /achievements/:id
Authorization: Bearer <token>
```

### 创建成果
```http
POST /achievements
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求体**:
```json
{
  "type": "paper",
  "title": "基于深度学习的图像识别算法研究",
  "achievementDate": "2024-08-15",
  "level": "A",
  "journal": "IEEE Transactions on Pattern Analysis and Machine Intelligence",
  "authors": [
    {
      "name": "张三",
      "position": 1,
      "isSupervisor": false,
      "affiliation": "厦门大学"
    }
  ],
  "isIndependentAuthor": true,
  "authorPosition": 1,
  "totalAuthors": 1,
  "supervisorCount": 0
}
```

### 更新成果
```http
PUT /achievements/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### 删除成果
```http
DELETE /achievements/:id
Authorization: Bearer <token>
```

### 上传证明材料
```http
POST /achievements/:id/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

## 申请管理

### 获取申请列表
```http
GET /applications?status=submitted&page=1&limit=10
Authorization: Bearer <token>
```

### 获取申请详情
```http
GET /applications/:id
Authorization: Bearer <token>
```

### 创建申请
```http
POST /connections
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "applicationType": "regular",
  "academicYear": "2024",
  "achievements": ["64f8b2c1e4b0a1234567890b", "64f8b2c1e4b0a1234567890c"],
  "academicScore": 85.5
}
```

### 更新申请
```http
PUT /applications/:id
Authorization: Bearer <token>
```

### 提交申请
```http
POST /applications/:id/submit
Authorization: Bearer <token>
```

## 计分系统

### 获取计分结果
```http
GET /scoring/:applicationId
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "academicScore": 85.5,
    "academicExcellenceScore": 12.5,
    "academicExcellenceDetails": [
      {
        "category": "学术专长",
        "item": "论文-A类",
        "score": 8.0,
        "maxScore": 10,
        "rule": "A类论文，独立作者，比例100%，得分8分",
        "evidence": ["paper1.pdf"]
      }
    ],
    "comprehensivePerformanceScore": 3.2,
    "comprehensivePerformanceDetails": [
      {
        "category": "综合表现",
        "item": "志愿服务",
        "score": 0.8,
        "maxScore": 1,
        "rule": "累计志愿服务300小时，省级表彰队长，得分0.8分",
        "evidence": ["volunteer1.pdf"]
      }
    ],
    "totalScore": 85.7,
    "calculationChain": "推免综合成绩 = 学业综合成绩85.5 × 80% + 学术专长成绩12.5 + 综合表现成绩3.2 = 85.7",
    "deduplicationNotes": ["C类论文共3篇，只取前2篇"],
    "ceilingNotes": ["学术专长成绩达到上限15分"],
    "warnings": ["C类论文已达到上限2篇"],
    "errors": []
  }
}
```

### 重新计算分数
```http
POST /scoring/:applicationId/recalculate
Authorization: Bearer <token>
```

## 管理员功能

### 获取用户列表
```http
GET /admin/users?role=student&department=信息学院&page=1&limit=10
Authorization: Bearer <token>
```

### 更新用户角色
```http
PUT /admin/users/:id/role
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "role": "department_workgroup"
}
```

### 启用/禁用用户
```http
PUT /admin/users/:id/status
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "isActive": false
}
```

## 错误处理

### 错误响应格式
```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

### 常见错误码

| 状态码 | 描述 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证或令牌无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |

### 错误示例

**认证失败**:
```json
{
  "success": false,
  "message": "访问被拒绝，请提供令牌",
  "error": "Token required"
}
```

**权限不足**:
```json
{
  "success": false,
  "message": "权限不足",
  "error": "Insufficient permissions"
}
```

**资源不存在**:
```json
{
  "success": false,
  "message": "成果不存在",
  "error": "Achievement not found"
}
```

## 数据模型

### 用户模型
```json
{
  "_id": "ObjectId",
  "studentId": "string",
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "string",
  "department": "string",
  "major": "string",
  "grade": "string",
  "class": "string",
  "phone": "string",
  "avatar": "string",
  "isActive": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 成果模型
```json
{
  "_id": "ObjectId",
  "studentId": "ObjectId",
  "type": "string",
  "title": "string",
  "achievementDate": "Date",
  "evidenceFiles": ["string"],
  "isBeforeDeadline": "boolean",
  "verificationStatus": "string",
  "verificationNotes": "string",
  "score": "number",
  "deduplicationGroupId": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 申请模型
```json
{
  "_id": "ObjectId",
  "studentId": "ObjectId",
  "applicationType": "string",
  "status": "string",
  "academicYear": "string",
  "achievements": ["ObjectId"],
  "academicScore": "number",
  "academicExcellenceScore": "number",
  "comprehensivePerformanceScore": "number",
  "totalScore": "number",
  "ranking": "number",
  "isEligible": "boolean",
  "eligibilityReasons": ["string"],
  "warnings": ["string"],
  "errors": ["string"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## 文件上传

### 支持的文件类型
- 图片：JPG, JPEG, PNG
- 文档：PDF, DOC, DOCX

### 文件大小限制
- 单个文件最大：10MB
- 总文件大小：100MB

### 上传示例
```javascript
const formData = new FormData();
formData.append('files', file);
formData.append('type', 'paper');

fetch('/api/achievements/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

## 分页

### 分页参数
- `page`: 页码（从1开始）
- `limit`: 每页数量（默认10，最大100）

### 分页响应
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## 排序

### 排序参数
- `sort`: 排序字段
- `order`: 排序方向（asc/desc）

### 排序示例
```http
GET /achievements?sort=achievementDate&order=desc
```

## 过滤

### 过滤参数
- `type`: 成果类型过滤
- `status`: 状态过滤
- `dateFrom`: 开始日期
- `dateTo`: 结束日期

### 过滤示例
```http
GET /achievements?type=paper&status=verified&dateFrom=2024-01-01&dateTo=2024-12-31
```

## 限流

### 限流规则
- 认证接口：每分钟最多10次请求
- 其他接口：每分钟最多100次请求

### 限流响应
```json
{
  "success": false,
  "message": "请求过于频繁，请稍后再试",
  "error": "Rate limit exceeded"
}
```

## 版本控制

### API版本
当前版本：v1.0.0

### 版本兼容性
- 向后兼容：是
- 废弃接口：会提前30天通知
- 新功能：通过版本号区分

## 测试

### 测试环境
- 基础URL：`http://localhost:3001/api`
- 测试用户：test@xmu.edu.cn
- 测试密码：test123

### 测试工具
推荐使用Postman或curl进行API测试。

### 测试示例
```bash
# 登录测试
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"studentId":"2021001001","password":"password123"}'

# 获取成果列表
curl -X GET http://localhost:3001/api/achievements \
  -H "Authorization: Bearer <token>"
```

## 更新日志

### v1.0.0 (2024-09-15)
- 初始版本发布
- 支持用户认证和成果管理
- 支持申请审核和计分计算
- 支持管理员功能
