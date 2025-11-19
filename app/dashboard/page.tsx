'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Button,
  Space,
  Typography,
  message,
  List,
  Tag,
} from 'antd';
import {
  UserOutlined,
  TrophyOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { clearAuth, getStoredToken, getStoredUser } from '@/lib/client';

const { Title, Text, Paragraph } = Typography;

interface DashboardData {
  user: {
    name: string;
    studentId: string;
    profile: {
      department: string;
      major: string;
      grade: string;
      className: string;
    };
  };
  achievements: {
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    rejected: number;
  };
  application: {
    status: string;
    lastSubmittedAt?: string;
  };
  scoring: {
    cappedAcademicScore: number;
    cappedComprehensiveScore: number;
    totalScore: number;
    details: {
      achievementId: string;
      title: string;
      category: string;
      appliedScore: number;
      notes?: string;
      bucket: string;
    }[];
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/summary', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || '加载失败');
        }

        setData(result.data);
      } catch (error) {
        message.error((error as Error).message || '加载仪表盘失败');
        clearAuth();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    message.success('已退出登录');
    router.push('/login');
  };

  if (loading) {
    return <div style={{ padding: 32 }}>仪表盘加载中...</div>;
  }

  if (!data) {
    return null;
  }

  const { user, achievements, application, scoring } = data;
  const progress = Math.min(
    Math.round(
      ((achievements.submitted + achievements.approved) /
        Math.max(achievements.total, 1)) *
        100
    ),
    100
  );

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>欢迎回来，{user.name}！</Title>
          <Text type="secondary">
            学号：{user.studentId} | {user.profile.department} {user.profile.major} |{' '}
            {user.profile.grade} {user.profile.className}
          </Text>
        </Col>
        <Col>
          <Space>
            <Button onClick={() => router.push('/profile')} icon={<UserOutlined />}>
              个人信息
            </Button>
            <Button danger onClick={handleLogout} icon={<LogoutOutlined />}>
              退出登录
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="成果总数"
              value={achievements.total}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Button type="link" onClick={() => router.push('/achievements')}>
              管理成果
            </Button>
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="申请状态"
              value={application.status}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Button type="link" onClick={() => router.push('/application')}>
              查看详情
            </Button>
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="学术专长积分"
              value={scoring.cappedAcademicScore}
              prefix={<CalculatorOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <Button type="link" onClick={() => router.push('/scoring')}>
              积分详情
            </Button>
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="综合表现积分"
              value={scoring.cappedComprehensiveScore}
              prefix={<CalculatorOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <Button type="link" onClick={() => router.push('/scoring')}>
              查看贡献
            </Button>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="申请进度" extra={<Text>保持信息及时更新</Text>} loading={loading}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Tag color={application.status === 'submitted' ? 'green' : 'blue'}>
                  {application.status === 'submitted' ? '已提交' : '草稿'}
                </Tag>
                {application.lastSubmittedAt && (
                  <Text type="secondary">
                    最近提交：{new Date(application.lastSubmittedAt).toLocaleString()}
                  </Text>
                )}
              </div>
              <Progress percent={progress} status="active" />
              <Space>
                <Button type="primary" onClick={() => router.push('/application')}>
                  更新申请材料
                </Button>
                <Button onClick={() => router.push('/catalog')}>
                  查看加分项目
                </Button>
                <Button onClick={() => router.push('/special-academic')}>
                  特殊学术专长流程
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="积分亮点" loading={loading}>
            {scoring.details.length === 0 ? (
              <Paragraph>暂无积分数据，先去录入成果吧。</Paragraph>
            ) : (
              <List
                dataSource={scoring.details.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                      title={`${item.title}（${item.category}）`}
                      description={
                        <Space direction="vertical">
                          <Text>计入积分：{item.appliedScore.toFixed(2)}分</Text>
                          {item.notes && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.notes}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
