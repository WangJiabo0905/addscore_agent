'use client';

import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { useRouter } from 'next/navigation';
import { clearAuth, getStoredToken, getStoredUser, saveAuth } from '@/lib/client';

const { Title, Text } = Typography;

interface ProfileFormValues {
  name: string;
  department: string;
  major: string;
  grade: string;
  className: string;
  phone: string;
  email: string;
}

export default function ProfilePage() {
  const [form] = Form.useForm<ProfileFormValues>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || '加载失败');
        }

        const { data } = result;
        form.setFieldsValue({
          name: data.name,
          department: data.profile.department,
          major: data.profile.major,
          grade: data.profile.grade,
          className: data.profile.className,
          phone: data.profile.phone,
          email: data.profile.email,
        });
      } catch (error) {
        message.error((error as Error).message || '加载个人信息失败');
        clearAuth();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [form, router]);

  const handleSubmit = async (values: ProfileFormValues) => {
    const token = getStoredToken();
    if (!token) {
      clearAuth();
      router.push('/login');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          profile: {
            department: values.department,
            major: values.major,
            grade: values.grade,
            className: values.className,
            phone: values.phone,
            email: values.email,
          },
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '保存失败');
      }

      const storedUser = getStoredUser();
      if (storedUser && token) {
        saveAuth(
          {
            ...storedUser,
            name: values.name,
            profile: {
              department: values.department,
              major: values.major,
              grade: values.grade,
              className: values.className,
              phone: values.phone,
              email: values.email,
            },
          },
          token
        );
      }

      message.success('个人信息已更新');
    } catch (error) {
      message.error((error as Error).message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <Card loading={loading}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={3}>个人信息</Title>
            <Text type="secondary">
              请核对信息，确保联系电话、邮箱等保持最新，以便及时获取通知。
            </Text>
          </div>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="姓名"
              name="name"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>
            <Form.Item
              label="学院"
              name="department"
              rules={[{ required: true, message: '请输入学院' }]}
            >
              <Input placeholder="信息学院" />
            </Form.Item>
            <Form.Item
              label="专业"
              name="major"
              rules={[{ required: true, message: '请输入专业' }]}
            >
              <Input placeholder="计算机科学与技术" />
            </Form.Item>
            <Form.Item
              label="年级"
              name="grade"
              rules={[{ required: true, message: '请输入年级' }]}
            >
              <Input placeholder="2021级" />
            </Form.Item>
            <Form.Item
              label="班级"
              name="className"
              rules={[{ required: true, message: '请输入班级' }]}
            >
              <Input placeholder="计算机1班" />
            </Form.Item>
            <Form.Item
              label="联系电话"
              name="phone"
              rules={[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1\d{10}$/, message: '请输入11位手机号' },
              ]}
            >
              <Input placeholder="13800000000" />
            </Form.Item>
            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入正确的邮箱格式' },
              ]}
            >
              <Input placeholder="example@xmu.edu.cn" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={saving}>
                  保存
                </Button>
                <Button onClick={() => router.push('/dashboard')}>返回仪表盘</Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
