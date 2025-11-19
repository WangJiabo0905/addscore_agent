#!/bin/bash

echo "🚀 保研加分小助手 - 一键部署脚本"
echo "=================================="

# 检查是否安装了必要的工具
if ! command -v git &> /dev/null; then
    echo "❌ Git 未安装，请先安装 Git"
    exit 1
fi

echo "✅ Git 已安装"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "✅ 项目目录正确"

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 发现未提交的更改，正在提交..."
    git add .
    git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo "✅ 代码已提交"

# 显示部署选项
echo ""
echo "🎯 选择部署方式："
echo "1. Vercel (推荐) - 免费、快速、自动HTTPS"
echo "2. Netlify - 免费、简单"
echo "3. Railway - 支持数据库"
echo "4. 手动部署指南"
echo ""

read -p "请选择 (1-4): " choice

case $choice in
    1)
        echo "🚀 部署到 Vercel..."
        echo ""
        echo "📋 请按以下步骤操作："
        echo "1. 访问 https://vercel.com"
        echo "2. 使用 GitHub 登录"
        echo "3. 点击 'New Project'"
        echo "4. 选择你的仓库"
        echo "5. 点击 'Deploy'"
        echo ""
        echo "🔗 或者使用 Vercel CLI："
        echo "npm install -g vercel"
        echo "vercel --prod"
        ;;
    2)
        echo "🚀 部署到 Netlify..."
        echo ""
        echo "📋 请按以下步骤操作："
        echo "1. 访问 https://netlify.com"
        echo "2. 使用 GitHub 登录"
        echo "3. 点击 'New site from Git'"
        echo "4. 选择你的仓库"
        echo "5. 构建命令: npm run build"
        echo "6. 发布目录: .next"
        echo "7. 点击 'Deploy site'"
        ;;
    3)
        echo "🚀 部署到 Railway..."
        echo ""
        echo "📋 请按以下步骤操作："
        echo "1. 访问 https://railway.app"
        echo "2. 使用 GitHub 登录"
        echo "3. 点击 'New Project'"
        echo "4. 选择 'Deploy from GitHub repo'"
        echo "5. 选择你的仓库"
        echo "6. 等待自动部署"
        ;;
    4)
        echo "📖 手动部署指南："
        echo ""
        echo "1. 将代码推送到 GitHub："
        echo "   git remote add origin https://github.com/你的用户名/addscore-agent.git"
        echo "   git push -u origin main"
        echo ""
        echo "2. 选择部署平台："
        echo "   - Vercel: https://vercel.com (推荐)"
        echo "   - Netlify: https://netlify.com"
        echo "   - Railway: https://railway.app"
        echo "   - Heroku: https://heroku.com"
        echo ""
        echo "3. 连接 GitHub 仓库并部署"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "🎉 部署完成后，你将获得一个公网域名！"
echo "📱 用户可以通过这个域名访问所有功能"
echo ""
echo "🔧 测试账户："
echo "学号: 22920242203406"
echo "密码: 5201314wjb"
echo ""
echo "或者："
echo "学号: 1234567890"
echo "密码: 123456"