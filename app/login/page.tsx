'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Alert, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { saveAuth } from '@/lib/client';

const { Title, Text } = Typography;

interface LoginForm {
  studentId: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: values.studentId,
          password: values.password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const { user, token } = data.data;
        saveAuth(user, token);
        message.success('登录成功');
        router.push('/dashboard');
      } else {
        message.error(data.message || '登录失败');
      }
    } catch (error: any) {
      message.error('登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          border: 'none'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserOutlined style={{ fontSize: 32, color: 'white' }} />
          </div>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            保研加分小助手
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            厦门大学信息学院推免申请管理平台
          </Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="studentId"
            rules={[
              { required: true, message: '请输入账号' },
              {
                pattern: /^[A-Za-z0-9_-]{6,18}$/,
                message: '账号需为6-18位字母、数字或下划线组合'
              }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入账号"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<LoginOutlined />}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Alert
          message="默认账号"
          description="账号：student_demo，密码：student2024"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space direction="vertical" size="small">
            <Button
              type="link"
              icon={<SafetyCertificateOutlined />}
              onClick={() => router.push('/reviewer/login')}
            >
              审核员登录入口
            </Button>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              系统版本：v1.0.0
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              © 2024 厦门大学信息学院
            </Text>
          </Space>
        </div>
      </Card>
    </div>
  );
}
