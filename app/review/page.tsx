'use client';

import { useEffect, useState } from 'react';
import { Card, Steps, Typography, message, Button, Space, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { clearAuth, getStoredToken, getStoredUser } from '@/lib/client';

const { Title, Paragraph } = Typography;

interface ApplicationStatus {
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  lastSubmittedAt?: string;
  reviewerRemarks?: string;
}

const reviewSteps = [
  { title: '学生提交', description: '完善申请材料并提交审核' },
  { title: '系工作小组预审', description: '对申请材料进行初步审核' },
  { title: '学院工作小组统筹', description: '统筹安排候选名单与答辩' },
  { title: '专家评审', description: '专家组进行综合评审与答辩' },
  { title: '公示与审定', description: '学院公示结果并报学校审定' },
];

const statusToStepIndex: Record<ApplicationStatus['status'], number> = {
  draft: 0,
  submitted: 1,
  under_review: 2,
  approved: 4,
  rejected: 1,
};

export default function ReviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationStatus | null>(null);

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
      } catch (error) {
        message.error((error as Error).message || '获取申请状态失败');
        clearAuth();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [router]);

  const currentStep = application ? statusToStepIndex[application.status] : 0;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Card loading={loading}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={3}>推免审核流程</Title>
            <Paragraph type="secondary">
              以下为学院内部的推免审核流程节点。当前系统仅开放学生端，后续审核节点由教务老师处理。
            </Paragraph>
            {application && (
              <Space>
                <Tag color={application.status === 'approved' ? 'green' : 'blue'}>
                  当前状态：{application.status}
                </Tag>
                {application.lastSubmittedAt && (
                  <Paragraph type="secondary" style={{ margin: 0 }}>
                    最近提交：{dayjs(application.lastSubmittedAt).format('YYYY-MM-DD HH:mm')}
                  </Paragraph>
                )}
              </Space>
            )}
          </div>

          <Steps
            current={currentStep}
            status={application?.status === 'rejected' ? 'error' : 'process'}
            direction="vertical"
            items={reviewSteps.map((step, index) => ({
              title: step.title,
              description: step.description,
              icon:
                index < currentStep ? undefined : undefined, // keep default icons
            }))}
          />

          {application?.reviewerRemarks && (
            <Card type="inner" title="审核备注">
              {application.reviewerRemarks}
            </Card>
          )}

          <Space>
            <Button type="primary" onClick={() => router.push('/application')}>
              返回修改申请材料
            </Button>
            <Button onClick={() => router.push('/dashboard')}>返回仪表盘</Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
}

