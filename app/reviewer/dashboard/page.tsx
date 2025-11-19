'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { clearAuth, getStoredToken, getStoredUser } from '@/lib/client';

const { Title, Paragraph, Text } = Typography;

type AchievementStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

interface ReviewerAchievement {
  id: string;
  title: string;
  category: string;
  obtainedAt: string;
  score: number;
  description?: string;
  evidenceUrl?: string;
  status: AchievementStatus;
  metadata: Record<string, unknown>;
  reviewComment?: string;
  reviewedAt?: string;
  reviewer?: {
    id: string;
    name: string;
    studentId: string;
  } | null;
  student: {
    id: string;
    name: string;
    studentId: string;
    department?: string;
    major?: string;
    grade?: string;
  } | null;
}

interface ReviewerApplication {
  id: string;
  status: string;
  personalStatement: string;
  plan: string;
  lastSubmittedAt?: string;
  reviewerRemarks?: string;
  updatedAt?: string;
  student: {
    id: string;
    name: string;
    studentId: string;
    department?: string;
    major?: string;
    grade?: string;
    className?: string;
  } | null;
}

const categoryLabels: Record<string, string> = {
  paper: '论文成果',
  patent: '专利成果',
  contest: '竞赛获奖',
  innovation: '创新创业',
  volunteer: '志愿服务',
  honor: '荣誉称号',
  social: '社会工作',
  sports: '体育竞赛',
};

const statusColors: Record<AchievementStatus, string> = {
  draft: 'default',
  submitted: 'processing',
  approved: 'success',
  rejected: 'error',
};

const statusLabels: Record<AchievementStatus, string> = {
  draft: '草稿',
  submitted: '待审核',
  approved: '已通过',
  rejected: '已退回',
};
const applicationStatusLabels: Record<string, string> = {
  draft: '草稿',
  submitted: '学生已提交',
  under_review: '审核中',
  approved: '已通过',
  rejected: '已退回',
};

export default function ReviewerDashboardPage() {
  const router = useRouter();
  const token = useMemo(() => getStoredToken(), []);
  const storedUser = useMemo(() => getStoredUser(), []);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<ReviewerAchievement[]>([]);
  const [statusFilter, setStatusFilter] = useState<'submitted' | 'approved' | 'rejected' | 'all'>(
    'submitted'
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<ReviewerAchievement | null>(null);
  const [decisionState, setDecisionState] = useState<{
    open: boolean;
    status: 'approved' | 'rejected' | null;
    record: ReviewerAchievement | null;
  }>({ open: false, status: null, record: null });
  const [decisionComment, setDecisionComment] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [applications, setApplications] = useState<ReviewerApplication[]>([]);
  const [applicationModal, setApplicationModal] = useState<{
    open: boolean;
    record: ReviewerApplication | null;
  }>({ open: false, record: null });

  const isReviewer = storedUser?.role === 'reviewer';

  const fetchAchievements = async (filter: typeof statusFilter = statusFilter) => {
    if (!token) return;
    setLoading(true);
    try {
      const query = filter === 'all' ? '' : `?status=${filter}`;
      const response = await fetch(`/api/reviewer/achievements${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401 || response.status === 403) {
        clearAuth();
        router.push('/reviewer/login');
        return;
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '加载失败');
      }
      setAchievements(result.data);
    } catch (error) {
      message.error((error as Error).message || '加载成果失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/reviewer/applications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401 || response.status === 403) {
        clearAuth();
        router.push('/reviewer/login');
        return;
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '加载申请失败');
      }
      setApplications(result.data);
    } catch (error) {
      message.error((error as Error).message || '加载申请失败');
    }
  };

  useEffect(() => {
    if (!token || !storedUser) {
      router.push('/reviewer/login');
      return;
    }
    if (!isReviewer) {
      message.error('当前账号无审核权限');
      router.push('/login');
      return;
    }

    fetchAchievements();
    fetchApplications();
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDecisionModal = (
    record: ReviewerAchievement,
    status: 'approved' | 'rejected'
  ) => {
    setDecisionState({ open: true, status, record });
    setDecisionComment(
      status === 'rejected' ? '' : record.reviewComment?.toString() ?? ''
    );
  };

  const handleDecisionSubmit = async () => {
    if (!token || !decisionState.status || !decisionState.record) {
      return;
    }
    const trimmedComment = decisionComment.trim();
    if (decisionState.status === 'rejected' && trimmedComment.length === 0) {
      message.warning('退回时请填写审核说明');
      return;
    }

    setDecisionLoading(true);
    try {
      const response = await fetch(`/api/reviewer/achievements/${decisionState.record.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: decisionState.status,
          comment: trimmedComment.length > 0 ? trimmedComment : undefined,
        }),
      });
      if (response.status === 401 || response.status === 403) {
        clearAuth();
        router.push('/reviewer/login');
        return;
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '更新失败');
      }
      const updated: ReviewerAchievement = result.data;
      message.success('审核结果已保存');
      setAchievements((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
      );
      setSelectedAchievement((prev) =>
        prev && prev.id === updated.id ? { ...prev, ...updated } : prev
      );
      setDecisionState({ open: false, status: null, record: null });
      setDecisionComment('');
    } catch (error) {
      message.error((error as Error).message || '更新失败');
    } finally {
      setDecisionLoading(false);
    }
  };

  const columns: ColumnsType<ReviewerAchievement> = [
    {
      title: '学生',
      dataIndex: ['student', 'name'],
      key: 'student',
      render: (_, record) =>
        record.student ? (
          <Space direction="vertical" size={0}>
            <Text strong>{record.student.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.student.studentId}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">已注销</Text>
        ),
    },
    {
      title: '审核说明',
      dataIndex: 'reviewComment',
      key: 'reviewComment',
      ellipsis: true,
      render: (value?: string) =>
        value ? <Text>{value}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: '成果名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (value: string) => categoryLabels[value] || value,
    },
    {
      title: '取得日期',
      dataIndex: 'obtainedAt',
      key: 'obtainedAt',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '积分',
      dataIndex: 'score',
      key: 'score',
      render: (value: number) => `${value.toFixed(2)} 分`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: AchievementStatus) => <Tag color={statusColors[value]}>{statusLabels[value]}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openDetail(record)}>
            查看详情
          </Button>
          {record.status !== 'approved' && (
            <Button type="link" onClick={() => openDecisionModal(record, 'approved')}>
              通过
            </Button>
          )}
          {record.status !== 'rejected' && (
            <Button danger type="link" onClick={() => openDecisionModal(record, 'rejected')}>
              退回
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const openDetail = (record: ReviewerAchievement) => {
    setSelectedAchievement(record);
    setDetailOpen(true);
  };

  const metadataEntries = selectedAchievement
    ? Object.entries(selectedAchievement.metadata || {})
    : [];

  const applicationColumns: ColumnsType<ReviewerApplication> = [
    {
      title: '学生',
      dataIndex: 'student',
      key: 'student',
      render: (_, record) =>
        record.student ? (
          <Space direction="vertical" size={0}>
            <Text strong>{record.student.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.student.studentId}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">已注销</Text>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => (
        <Tag color="blue">{applicationStatusLabels[value] || value}</Tag>
      ),
    },
    {
      title: '最近提交/更新',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value?: string) =>
        value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '—',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => setApplicationModal({ open: true, record })}>
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={3} style={{ marginBottom: 0 }}>
                成果审核工作台
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                审核学生提交的成果材料，支持查阅附件并快速给出审核结论。
              </Paragraph>
            </div>
            <Space>
              <Button onClick={() => router.push('/reviewer/ranking')}>查看加分排名</Button>
              <Button type="primary" onClick={() => fetchAchievements(statusFilter)}>
                刷新列表
              </Button>
            </Space>
          </div>

          <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Select
              value={statusFilter}
              style={{ width: 200 }}
              onChange={(value) => {
                setStatusFilter(value);
                fetchAchievements(value);
              }}
              options={[
                { value: 'submitted', label: '待审核' },
                { value: 'approved', label: '已通过' },
                { value: 'rejected', label: '已退回' },
                { value: 'all', label: '全部记录' },
              ]}
            />
          </Space>

          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={achievements}
            pagination={{ pageSize: 8 }}
          />
        </Space>
      </Card>
      <Card style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={4} style={{ marginBottom: 0 }}>
                推免申请材料
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                查看学生提交的个人陈述与培养计划，便于综合预审。
              </Paragraph>
            </div>
          </div>
          <Table
            rowKey="id"
            columns={applicationColumns}
            dataSource={applications}
            pagination={{ pageSize: 6 }}
          />
        </Space>
      </Card>

      <Modal
        title="成果详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            关闭
          </Button>,
        ]}
        width={640}
      >
        {selectedAchievement && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="学生">
                {selectedAchievement.student ? (
                  <Space direction="vertical" size={0}>
                    <Text strong>{selectedAchievement.student.name}</Text>
                    <Text type="secondary">{selectedAchievement.student.studentId}</Text>
                  </Space>
                ) : (
                  '已注销'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="成果名称">
                {selectedAchievement.title}
              </Descriptions.Item>
              <Descriptions.Item label="类别">
                {categoryLabels[selectedAchievement.category] || selectedAchievement.category}
              </Descriptions.Item>
              <Descriptions.Item label="取得日期">
                {dayjs(selectedAchievement.obtainedAt).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="积分">
                {selectedAchievement.score.toFixed(2)} 分
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[selectedAchievement.status]}>
                  {statusLabels[selectedAchievement.status]}
                </Tag>
              </Descriptions.Item>
              {selectedAchievement.reviewer && (
                <Descriptions.Item label="审核人">
                  {selectedAchievement.reviewer.name}（{selectedAchievement.reviewer.studentId}）
                </Descriptions.Item>
              )}
              {selectedAchievement.reviewedAt && (
                <Descriptions.Item label="审核时间">
                  {dayjs(selectedAchievement.reviewedAt).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
              {selectedAchievement.reviewComment && (
                <Descriptions.Item label="审核说明">
                  {selectedAchievement.reviewComment}
                </Descriptions.Item>
              )}
              {selectedAchievement.description && (
                <Descriptions.Item label="描述">
                  {selectedAchievement.description}
                </Descriptions.Item>
              )}
              {metadataEntries.length > 0 && (
                <Descriptions.Item label="补充信息">
                  <Space direction="vertical" size={4}>
                    {metadataEntries.map(([key, value]) => (
                      <Text key={key}>
                        {key}：{String(value)}
                      </Text>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
              {selectedAchievement.evidenceUrl && (
                <Descriptions.Item label="佐证材料">
                  <Button
                    type="link"
                    href={selectedAchievement.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    查看附件
                  </Button>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Space>
        )}
      </Modal>

      <Modal
        title="推免申请详情"
        open={applicationModal.open}
        onCancel={() => setApplicationModal({ open: false, record: null })}
        footer={[
          <Button key="close" onClick={() => setApplicationModal({ open: false, record: null })}>
            关闭
          </Button>,
        ]}
        width={720}
      >
        {applicationModal.record && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="学生">
                {applicationModal.record.student ? (
                  <Space direction="vertical" size={0}>
                    <Text strong>{applicationModal.record.student.name}</Text>
                    <Text type="secondary">{applicationModal.record.student.studentId}</Text>
                    <Text type="secondary">
                      {applicationModal.record.student.department} /{' '}
                      {applicationModal.record.student.major} ·{' '}
                      {applicationModal.record.student.grade}{' '}
                      {applicationModal.record.student.className}
                    </Text>
                  </Space>
                ) : (
                  '已注销'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                {applicationStatusLabels[applicationModal.record.status] ||
                  applicationModal.record.status}
              </Descriptions.Item>
              {applicationModal.record.lastSubmittedAt && (
                <Descriptions.Item label="最近提交时间">
                  {dayjs(applicationModal.record.lastSubmittedAt).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="个人陈述">
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                  {applicationModal.record.personalStatement || '—'}
                </Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="学习与科研计划">
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                  {applicationModal.record.plan || '—'}
                </Paragraph>
              </Descriptions.Item>
              {applicationModal.record.reviewerRemarks && (
                <Descriptions.Item label="审核备注">
                  {applicationModal.record.reviewerRemarks}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Space>
        )}
      </Modal>

      <Modal
        title={
          decisionState.status === 'approved'
            ? '确认通过该成果'
            : '退回该成果'
        }
        open={decisionState.open}
        onCancel={() => {
          if (decisionLoading) return;
          setDecisionState({ open: false, status: null, record: null });
          setDecisionComment('');
        }}
        onOk={handleDecisionSubmit}
        okText={decisionState.status === 'approved' ? '通过' : '退回'}
        cancelText="取消"
        confirmLoading={decisionLoading}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            {decisionState.status === 'approved'
              ? '如有必要，可补充审核说明。'
              : '请填写退回原因，方便学生修改完善。'}
          </Text>
          <Input.TextArea
            rows={4}
            value={decisionComment}
            onChange={(event) => setDecisionComment(event.target.value)}
            placeholder={
              decisionState.status === 'approved'
                ? '可选项：输入审核说明'
                : '必填项：请说明退回原因'
            }
            maxLength={500}
            showCount
            disabled={decisionLoading}
          />
        </Space>
      </Modal>
    </div>
  );
}
