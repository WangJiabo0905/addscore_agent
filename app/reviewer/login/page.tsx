/* eslint-disable jsx-a11y/anchor-is-valid */
'use client';

import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Alert,
  message,
} from 'antd';
import {
  SafetyOutlined,
  LockOutlined,
  LoginOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { saveAuth } from '@/lib/client';

const { Title, Text } = Typography;

interface ReviewerLoginForm {
  accountId: string;
  password: string;
}

export default function ReviewerLoginPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<ReviewerLoginForm>();
  const router = useRouter();

  const handleSubmit = async (values: ReviewerLoginForm) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reviewer-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: values.accountId,
          password: values.password,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const { user, token } = data.data;
        saveAuth(user, token);
        message.success('登录成功');
        router.push('/reviewer/dashboard');
      } else {
        message.error(data.message || '登录失败');
      }
    } catch (error) {
      message.error('登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          borderRadius: 16,
          border: 'none',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SafetyOutlined style={{ fontSize: 32, color: 'white' }} />
          </div>
          <Title level={2} style={{ margin: 0, color: '#2b5876' }}>
            审核员工作台
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            学院推免成果审核入口
          </Text>
        </div>

        <Form
          form={form}
          name="reviewer-login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="accountId"
            rules={[{ required: true, message: '请输入审核员账号' }]}
          >
            <Input
              prefix={<SafetyOutlined />}
              placeholder="审核员账号"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }, { min: 6 }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
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
          description={
            <div>
              <div>账号：reviewer001，姓名：李审核，密码：checker2024</div>
              <div>账号：reviewer002，姓名：王审核，密码：checker2024</div>
              <div>账号：reviewer003，姓名：陈审核，密码：checker2024</div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space direction="vertical" size="small">
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/login')}
            >
              返回学生登录
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              © 2024 厦门大学信息学院
            </Text>
          </Space>
        </div>
      </Card>
    </div>
  );
}
