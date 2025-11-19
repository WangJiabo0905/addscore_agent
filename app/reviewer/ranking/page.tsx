'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Table, Typography, message, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import { clearAuth, getStoredToken, getStoredUser } from '@/lib/client';
import ExportRankingButton from './ExportRankingButton';

const { Title, Text, Paragraph } = Typography;

interface RankingEntry {
  rank: number;
  student: {
    id: string;
    name: string;
    studentId: string;
    profile: {
      department: string;
      major: string;
      grade: string;
      className: string;
    };
  };
  academicScore: number;
  comprehensiveScore: number;
  totalScore: number;
  gpaWeightedScore: number;
  reasonSummary: string;
  gpa?: number;
  gpaScore?: number;
  evidenceUrl?: string;
}

interface RankingResponse {
  ranking: RankingEntry[];
  generatedAt: string;
}

export default function ReviewerRankingPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);

  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();
    if (!storedToken || !storedUser) {
      router.push('/reviewer/login');
      return;
    }
    if (storedUser.role !== 'reviewer') {
      message.error('仅审核员可访问该页面');
      clearAuth();
      router.push('/reviewer/login');
      return;
    }
    setToken(storedToken);

    const loadRanking = async () => {
      try {
        const response = await fetch('/api/reviewer/ranking', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });
        if (response.status === 401 || response.status === 403) {
          throw new Error('无权查看排名，请重新登录');
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || '加载排名失败');
        }
        const data = result.data as RankingResponse;
        setRanking(data.ranking);
        setGeneratedAt(data.generatedAt);
      } catch (error) {
        message.error((error as Error).message || '加载排名失败');
        clearAuth();
        router.push('/reviewer/login');
      } finally {
        setLoading(false);
      }
    };

    loadRanking();
  }, [router]);

  const columns: ColumnsType<RankingEntry> = [
    {
      title: '排名',
      dataIndex: 'rank',
      width: 80,
    },
    {
      title: '学生信息',
      key: 'student',
      render: (_, record) => (
        <div>
          <Text strong>{record.student.name}</Text>
          <div>
            <Text type="secondary">{record.student.studentId}</Text>
          </div>
          <div style={{ fontSize: 12 }}>
            {record.student.profile.department} / {record.student.profile.major}
          </div>
          <div style={{ fontSize: 12 }}>
            {record.student.profile.grade} · {record.student.profile.className}
          </div>
        </div>
      ),
    },
    {
      title: '学术积分',
      dataIndex: 'academicScore',
      render: (value: number) => `${value.toFixed(2)} 分`,
      width: 140,
    },
    {
      title: '综合积分',
      dataIndex: 'comprehensiveScore',
      render: (value: number) => `${value.toFixed(2)} 分`,
      width: 140,
    },
    {
      title: '学业成绩（80%）',
      dataIndex: 'gpaWeightedScore',
      render: (value: number) => `${value.toFixed(2)} 分`,
      width: 160,
    },
    {
      title: '绩点',
      dataIndex: 'gpa',
      render: (value?: number) => (typeof value === 'number' ? value.toFixed(2) : '—'),
      width: 120,
    },
    {
      title: '绩点折算分（满分100）',
      dataIndex: 'gpaScore',
      render: (value?: number) => (typeof value === 'number' ? `${value.toFixed(2)} 分` : '—'),
      width: 160,
    },
    {
      title: '总积分',
      dataIndex: 'totalScore',
      render: (value: number) => `${value.toFixed(2)} 分`,
      width: 140,
    },
    {
      title: '绩点附件',
      dataIndex: 'evidenceUrl',
      render: (value?: string) =>
        value ? (
          <Button type="link" href={value} target="_blank" rel="noopener noreferrer">
            查看
          </Button>
        ) : (
          <Text type="secondary">—</Text>
        ),
      width: 140,
    },
    {
      title: '加分原因',
      dataIndex: 'reasonSummary',
      ellipsis: true,
      render: (value: string) =>
        value ? (
          <Paragraph style={{ marginBottom: 0 }} ellipsis={{ rows: 3, expandable: true }}>
            {value}
          </Paragraph>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  const handleExport = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/reviewer/ranking/export', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('导出失败，请稍后重试');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ranking-${new Date().toISOString().slice(0, 10)}.xls`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('排名导出成功');
    } catch (error) {
      message.error((error as Error).message || '导出失败');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space
          direction="vertical"
          size="large"
          style={{ width: '100%' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={3} style={{ marginBottom: 0 }}>
                学生加分排名
              </Title>
              <Text type="secondary">
                自动汇总已审批通过的成果积分，支持导出 Excel 便于存档。
                {generatedAt && ` 更新于：${new Date(generatedAt).toLocaleString()}`}
              </Text>
            </div>
            <Space>
              <Button onClick={() => router.push('/reviewer/dashboard')}>返回审核台</Button>
              <Button type="primary" onClick={handleExport} disabled={loading || ranking.length === 0}>
                导出 Excel
              </Button>
              <ExportRankingButton />
            </Space>
          </div>

          <Table
            rowKey={(record) => record.student.id}
            loading={loading}
            columns={columns}
            dataSource={ranking}
            pagination={{ pageSize: 10 }}
          />
        </Space>
      </Card>
    </div>
  );
}
