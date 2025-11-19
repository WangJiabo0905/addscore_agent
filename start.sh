#!/bin/bash

# 保研加分小助手启动脚本

echo "🚀 启动保研加分小助手..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

# 安装根目录依赖
echo "📦 安装根目录依赖..."
npm install

# 安装后端依赖
echo "📦 安装后端依赖..."
cd server
npm install
cd ..

# 安装前端依赖
echo "📦 安装前端依赖..."
cd client
npm install
cd ..

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p server/uploads
mkdir -p server/logs

# 复制环境配置文件
if [ ! -f server/.env ]; then
    echo "📋 创建环境配置文件..."
    cp server/env.example server/.env
    echo "⚠️  请编辑 server/.env 文件配置数据库连接等信息"
fi

# 启动开发服务器
echo "🎯 启动开发服务器..."
npm run dev
