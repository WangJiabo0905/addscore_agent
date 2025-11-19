'use client';

import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Typography, message, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import { clearAuth, getStoredToken, getStoredUser } from '@/lib/client';

const { Title, Paragraph } = Typography;

interface ScoreDetail {
  achievementId: string;
  title: string;
  category: string;
  rawScore: number;
  appliedScore: number;
  bucket: 'academic' | 'comprehensive';
  notes?: string;
}

interface ScoreSummary {
  cappedAcademicScore: number;
  cappedComprehensiveScore: number;
  totalScore: number;
  details: ScoreDetail[];
}

export default function ScoringPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ScoreSummary | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    const loadSummary = async () => {
      try {
        const response = await fetch('/api/scoring', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || '加载失败');
        }
        setSummary(result.data);
      } catch (error) {
        message.error((error as Error).message || '获取积分失败');
        clearAuth();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [router]);

  const columns: ColumnsType<ScoreDetail> = [
    {
      title: '成果名称',
      dataIndex: 'title',
      key: 'title',
      render: (value: string) => <span style={{ fontWeight: 500 }}>{value}</span>,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '所属维度',
      dataIndex: 'bucket',
      key: 'bucket',
      render: (bucket: ScoreDetail['bucket']) => (
        <Tag color={bucket === 'academic' ? 'blue' : 'orange'}>
          {bucket === 'academic' ? '学术专长' : '综合表现'}
        </Tag>
      ),
    },
    {
      title: '原始分值',
      dataIndex: 'rawScore',
      key: 'rawScore',
      render: (value: number) => `${value.toFixed(2)} 分`,
    },
    {
      title: '计入分值',
      dataIndex: 'appliedScore',
      key: 'appliedScore',
      render: (value: number) => `${value.toFixed(2)} 分`,
    },
    {
      title: '计分说明',
      dataIndex: 'notes',
      key: 'notes',
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>积分详情</Title>
          <Paragraph type="secondary" style={{ maxWidth: 600 }}>
            根据学院加分细则自动计算学术专长与综合表现积分，系统会结合成果类型、等级、时长等信息自动限制封顶。
          </Paragraph>
        </Col>
        <Col>
          <Button onClick={() => router.push('/dashboard')}>返回仪表盘</Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card loading={loading}>
            <Statistic
              title="学术专长积分（封顶15）"
              value={summary?.cappedAcademicScore ?? 0}
              valueStyle={{ color: '#3f8600' }}
              suffix="分"
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={loading}>
            <Statistic
              title="综合表现积分（封顶5）"
              value={summary?.cappedComprehensiveScore ?? 0}
              valueStyle={{ color: '#fa8c16' }}
              suffix="分"
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={loading}>
            <Statistic
              title="当前总积分"
              value={summary?.totalScore ?? 0}
              valueStyle={{ color: '#1890ff' }}
              suffix="分"
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }}>
        <Table
          rowKey="achievementId"
          loading={loading}
          columns={columns}
          dataSource={summary?.details || []}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
}

