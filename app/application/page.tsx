'use client';

import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Space, Tag, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { clearAuth, getStoredToken, getStoredUser } from '@/lib/client';

const { Title, Text, Paragraph } = Typography;

interface ApplicationData {
  id: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  personalStatement: string;
  plan: string;
  lastSubmittedAt?: string;
}

export default function ApplicationPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<ApplicationData | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    const loadApplication = async () => {
      try {
        const response = await fetch('/api/application', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || '加载失败');
        }
        setApplication(result.data);
        form.setFieldsValue({
          personalStatement: result.data.personalStatement,
          plan: result.data.plan,
        });
      } catch (error) {
        message.error((error as Error).message || '加载申请信息失败');
        clearAuth();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [form, router]);

  const handleSave = async (values: any) => {
    const token = getStoredToken();
    if (!token) {
      clearAuth();
      router.push('/login');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/application', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '保存失败');
      }
      setApplication((prev) =>
        prev
          ? {
              ...prev,
              personalStatement: values.personalStatement,
              plan: values.plan,
              status: result.data.status,
            }
          : result.data
      );
      message.success('申请材料已保存');
    } catch (error) {
      message.error((error as Error).message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const token = getStoredToken();
    if (!token) {
      clearAuth();
      router.push('/login');
      return;
    }

    try {
      const values = await form.validateFields();
      await handleSave(values);
    } catch {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/application', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '提交失败');
      }
      setApplication((prev) =>
        prev
          ? {
              ...prev,
              status: 'submitted',
              lastSubmittedAt: result.data.lastSubmittedAt,
            }
          : result.data
      );
      message.success('申请已提交，请等待审核');
    } catch (error) {
      message.error((error as Error).message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Card loading={loading}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Space align="center" size="large">
              <div>
                <Title level={3} style={{ marginBottom: 0 }}>
                  推免申请材料
                </Title>
                <Text type="secondary">
                  请认真填写个人陈述和培养计划，提交后可再次修改并重新提交。
                </Text>
              </div>
              {application && (
                <Tag color={application.status === 'submitted' ? 'green' : 'blue'}>
                  当前状态：{application.status === 'submitted' ? '已提交' : '草稿'}
                </Tag>
              )}
            </Space>
            {application?.lastSubmittedAt && (
              <Paragraph type="secondary" style={{ marginTop: 8 }}>
                最近提交时间：{dayjs(application.lastSubmittedAt).format('YYYY-MM-DD HH:mm')}
              </Paragraph>
            )}
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              personalStatement: '',
              plan: '',
            }}
          >
            <Form.Item
              label="个人陈述"
              name="personalStatement"
              rules={[
                { required: true, message: '请填写个人陈述' },
                { min: 100, message: '至少填写100字，说明学习成绩、科研实践等情况' },
              ]}
            >
              <Input.TextArea rows={8} placeholder="建议包括：学业成绩、科研实践、竞赛获奖、社会工作、未来规划等。" />
            </Form.Item>

            <Form.Item
              label="攻读研究生期间的学习与科研计划"
              name="plan"
              rules={[
                { required: true, message: '请填写培养计划' },
                { min: 100, message: '至少填写100字，说明研究方向、学习计划等' },
              ]}
            >
              <Input.TextArea rows={8} placeholder="阐述拟研究方向、预期目标、学习安排以及个人发展规划。" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={saving}>
                  保存草稿
                </Button>
                <Button type="default" onClick={handleSubmit} loading={submitting}>
                  提交审核
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

