'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { clearAuth, getStoredToken, getStoredUser } from '@/lib/client';
import PdfSmartImportDialog from '@/app/(student)/achievements/PdfSmartImportDialog';

const { Title, Text } = Typography;

type AchievementCategory =
  | 'paper'
  | 'patent'
  | 'contest'
  | 'innovation'
  | 'volunteer'
  | 'honor'
  | 'social'
  | 'sports';

interface ReviewDecision {
  reviewerId: string;
  reviewerName: string;
  reviewerStudentId: string;
  status: 'submitted' | 'approved' | 'rejected';
  comment?: string;
  reviewedAt?: string;
}

interface Achievement {
  id: string;
  title: string;
  category: AchievementCategory;
  obtainedAt: string;
  score: number;
  description?: string;
  evidenceUrl?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  metadata: Record<string, any>;
  reviews: ReviewDecision[];
}

interface AcademicRecord {
  gpa?: number;
  score?: number;
  evidenceUrl?: string;
  updatedAt?: string;
}

interface FormValues {
  id?: string;
  title: string;
  category: AchievementCategory;
  obtainedAt: dayjs.Dayjs;
  description?: string;
  evidenceUrl?: string;
  status: 'draft' | 'submitted';
  metadata: Record<string, any>;
}

const categoryLabels: Record<AchievementCategory, string> = {
  paper: '论文成果',
  patent: '专利成果',
  contest: '竞赛获奖',
  innovation: '创新创业',
  volunteer: '志愿服务',
  honor: '荣誉称号',
  social: '社会工作',
  sports: '体育竞赛',
};

const statusColors: Record<Achievement['status'], string> = {
  draft: 'default',
  submitted: 'processing',
  approved: 'success',
  rejected: 'error',
};

const reviewStatusMeta: Record<
  ReviewDecision['status'],
  { label: string; color: string }
> = {
  submitted: { label: '待审核', color: 'default' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已退回', color: 'error' },
};

const MAX_IMAGE_SIZE = 50 * 1024 * 1024;

function MetadataFields({
  category,
}: {
  category?: AchievementCategory;
}) {
  if (!category) return null;

  switch (category) {
    case 'paper':
      return (
        <Form.Item
          label="论文等级"
          name={['metadata', 'level']}
          rules={[{ required: true, message: '请选择论文等级' }]}
        >
          <Select
            options={[
              { value: 'A', label: 'A类' },
              { value: 'B', label: 'B类' },
              { value: 'C', label: 'C类' },
            ]}
          />
        </Form.Item>
      );
    case 'patent':
      return (
        <Form.Item
          label="专利类型"
          name={['metadata', 'type']}
          rules={[{ required: true, message: '请输入专利类型' }]}
        >
          <Input placeholder="例如：发明专利授权" />
        </Form.Item>
      );
    case 'contest':
      return (
        <>
          <Form.Item
            label="竞赛级别"
            name={['metadata', 'level']}
            rules={[{ required: true, message: '请选择竞赛级别' }]}
          >
            <Select
              options={[
                { value: '国际级', label: '国际级' },
                { value: '国家级', label: '国家级' },
                { value: '省级', label: '省级' },
                { value: '校级', label: '校级' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="获奖等级"
            name={['metadata', 'award']}
            rules={[{ required: true, message: '请选择获奖等级' }]}
          >
            <Select
              options={[
                { value: '特等奖', label: '特等奖' },
                { value: '一等奖', label: '一等奖' },
                { value: '二等奖', label: '二等奖' },
                { value: '三等奖', label: '三等奖' },
                { value: '其他', label: '其他' },
              ]}
            />
          </Form.Item>
        </>
      );
    case 'innovation':
      return (
        <Form.Item
          label="立项级别"
          name={['metadata', 'level']}
          rules={[{ required: true, message: '请选择立项级别' }]}
        >
          <Select
            options={[
              { value: '国家级', label: '国家级' },
              { value: '省级', label: '省级' },
              { value: '校级', label: '校级' },
            ]}
          />
        </Form.Item>
      );
    case 'volunteer':
      return (
        <Form.Item
          label="志愿时长（小时）"
          name={['metadata', 'hours']}
          rules={[{ required: true, message: '请输入志愿时长' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      );
    case 'honor':
      return (
        <Form.Item
          label="荣誉级别"
          name={['metadata', 'level']}
          rules={[{ required: true, message: '请选择荣誉级别' }]}
        >
          <Select
            options={[
              { value: '国家级', label: '国家级' },
              { value: '省级', label: '省级' },
              { value: '校级', label: '校级' },
            ]}
          />
        </Form.Item>
      );
    case 'social':
      return (
        <Form.Item
          label="任职月数"
          name={['metadata', 'months']}
          rules={[{ required: true, message: '请输入任职月数' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      );
    case 'sports':
      return (
        <>
          <Form.Item
            label="比赛级别"
            name={['metadata', 'level']}
            rules={[{ required: true, message: '请选择比赛级别' }]}
          >
            <Select
              options={[
                { value: '国际级', label: '国际级' },
                { value: '国家级', label: '国家级' },
                { value: '省级', label: '省级' },
                { value: '校级', label: '校级' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="名次"
            name={['metadata', 'rank']}
            rules={[{ required: true, message: '请输入名次' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </>
      );
    default:
      return null;
  }
}

export default function AchievementsPage() {
  const router = useRouter();
  const [form] = Form.useForm<FormValues>();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [academicRecord, setAcademicRecord] = useState<AcademicRecord | null>(null);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [recordSaving, setRecordSaving] = useState(false);
  const [recordFileList, setRecordFileList] = useState<UploadFile[]>([]);
  const [recordForm] = Form.useForm<{ gpa?: number; evidenceUrl?: string }>();
  const [recordEvidenceUrl, setRecordEvidenceUrl] = useState<string | undefined>(undefined);
  const watchedRecordGpa = Form.useWatch('gpa', recordForm);
  const derivedRecordScore = useMemo(() => {
    const value = typeof watchedRecordGpa === 'number' ? watchedRecordGpa : 0;
    const clamped = Math.min(Math.max(value, 0), 4);
    return Number((clamped * 25).toFixed(2));
  }, [watchedRecordGpa]);

  const token = useMemo(() => getStoredToken(), []);
  const uploadHeaders: Record<string, string> | undefined = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  const handleUploadChange = (info: UploadChangeParam<UploadFile>) => {
    let newFileList = info.fileList.slice(-1);
    const { status } = info.file;

    if (status === 'done') {
      const response = info.file.response as
        | { success?: boolean; url?: string; message?: string }
        | undefined;

      if (response?.success && response.url) {
        newFileList = newFileList.map((item) =>
          item.uid === info.file.uid
            ? { ...item, status: 'done', url: response.url, name: item.name || info.file.name }
            : item
        );
        form.setFieldsValue({ evidenceUrl: response.url });
        message.success('图片上传成功');
      } else {
        message.error(response?.message || '图片上传失败');
        newFileList = [];
      }
    } else if (status === 'error') {
      const response = info.file.response as { message?: string } | undefined;
      message.error(response?.message || '图片上传失败');
      newFileList = [];
    }

    setFileList(newFileList);
  };

  const handleUploadRemove = () => {
    form.setFieldsValue({ evidenceUrl: undefined });
    setFileList([]);
    return true;
  };

  const handleRecordUploadChange = (info: UploadChangeParam<UploadFile>) => {
    let newFileList = info.fileList.slice(-1);
    const { status } = info.file;
    if (status === 'done') {
      const response = info.file.response as
        | { success?: boolean; url?: string; message?: string }
        | undefined;
      if (response?.success && response.url) {
        newFileList = newFileList.map((item) =>
          item.uid === info.file.uid
            ? { ...item, status: 'done', url: response.url, name: item.name || info.file.name }
            : item
        );
        setRecordEvidenceUrl(response.url);
        recordForm.setFieldsValue({ evidenceUrl: response.url });
        message.success('绩点佐证上传成功');
      } else {
        message.error(response?.message || '绩点佐证上传失败');
        newFileList = [];
      }
    } else if (status === 'error') {
      const response = info.file.response as { message?: string } | undefined;
      message.error(response?.message || '绩点佐证上传失败');
      newFileList = [];
    }
    setRecordFileList(newFileList);
  };

  const handleRecordUploadRemove = () => {
    setRecordEvidenceUrl(undefined);
    recordForm.setFieldsValue({ evidenceUrl: undefined });
    setRecordFileList([]);
    return true;
  };

  const resetModalState = () => {
    form.resetFields();
    setEditingAchievement(null);
    setFileList([]);
  };

  const loadAchievements = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/achievements', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '获取成果失败');
      }
      const enriched = (result.data as Achievement[]).map((item) => ({
        ...item,
        reviews: item.reviews || [],
      }));
      setAchievements(enriched);
    } catch (error) {
      message.error((error as Error).message || '获取成果失败');
      clearAuth();
      router.push('/login');
    }
  };

  const loadAcademicRecord = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/academic-record', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '加载学习成绩失败');
      }
      if (result.data) {
        setAcademicRecord(result.data as AcademicRecord);
        setRecordEvidenceUrl(result.data.evidenceUrl);
      } else {
        setAcademicRecord(null);
        setRecordEvidenceUrl(undefined);
      }
    } catch (error) {
      message.error((error as Error).message || '加载学习成绩失败');
    }
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadAchievements(), loadAcademicRecord()]);
      setLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, token]);

  const openCreateModal = () => {
    resetModalState();
    form.setFieldsValue({
      status: 'draft',
      obtainedAt: dayjs(),
    });
    setModalOpen(true);
  };

  const openEditModal = (record: Achievement) => {
    form.resetFields();
    setEditingAchievement(record);
    form.setFieldsValue({
      id: record.id,
      title: record.title,
      category: record.category,
      obtainedAt: dayjs(record.obtainedAt),
      description: record.description,
      evidenceUrl: record.evidenceUrl,
      status:
        record.status === 'approved'
          ? 'submitted'
          : record.status === 'rejected'
          ? 'draft'
          : record.status,
      metadata: record.metadata,
    });
    const existingUrl = record.evidenceUrl;
    const isUploadedImage =
      typeof existingUrl === 'string' &&
      (existingUrl.startsWith('/uploads/') ||
        /\.(png|jpe?g|gif|webp|bmp)$/i.test(existingUrl));
    setFileList(
      isUploadedImage && existingUrl
        ? [
            {
              uid: record.id,
              name: existingUrl.split('/').pop() || '已上传图片',
              status: 'done',
              url: existingUrl,
            },
          ]
        : []
    );
    setModalOpen(true);
  };

  const handleDelete = async (record: Achievement) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/achievements/${record.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '删除失败');
      }
      message.success('已删除');
      setAchievements((prev) => prev.filter((item) => item.id !== record.id));
    } catch (error) {
      message.error((error as Error).message || '删除失败');
    }
  };

  const openRecordModal = () => {
    recordForm.resetFields();
    recordForm.setFieldsValue({
      gpa: academicRecord?.gpa,
      evidenceUrl: academicRecord?.evidenceUrl,
    });
    setRecordEvidenceUrl(academicRecord?.evidenceUrl);
    setRecordFileList(
      academicRecord?.evidenceUrl
        ? [
            {
              uid: '-1',
              name: '已上传的佐证',
              status: 'done',
              url: academicRecord.evidenceUrl,
            },
          ]
        : []
    );
    setRecordModalOpen(true);
  };

  const handleRecordSubmit = async (values: { gpa?: number }) => {
    if (!token) return;
    const evidenceUrl = recordEvidenceUrl || recordForm.getFieldValue('evidenceUrl');
    if (!evidenceUrl) {
      message.error('请先上传绩点佐证图片');
      return;
    }
    const gpaValue = typeof values.gpa === 'number' ? values.gpa : 0;
    const clampedGpa = Math.min(Math.max(gpaValue, 0), 4);
    setRecordSaving(true);
    try {
      const response = await fetch('/api/academic-record', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gpa: clampedGpa,
          evidenceUrl,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '保存失败');
      }
      setAcademicRecord(result.data as AcademicRecord);
      setRecordModalOpen(false);
      message.success('学习成绩已保存');
    } catch (error) {
      message.error((error as Error).message || '保存失败');
    } finally {
      setRecordSaving(false);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!token) {
      clearAuth();
      router.push('/login');
      return;
    }

    setSaving(true);
    const payload = {
      title: values.title,
      category: values.category,
      obtainedAt: values.obtainedAt.toISOString(),
      description: values.description,
      evidenceUrl: values.evidenceUrl,
      status: values.status,
      metadata: values.metadata || {},
    };

    try {
      const response = await fetch(
        editingAchievement ? `/api/achievements/${editingAchievement.id}` : '/api/achievements',
        {
          method: editingAchievement ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '保存失败');
      }

      message.success(editingAchievement ? '成果已更新' : '成果已创建');
      setModalOpen(false);
      const normalizedAchievement: Achievement = {
        ...result.data,
        reviews: result.data.reviews || [],
      };

      if (editingAchievement) {
        setAchievements((prev) =>
          prev.map((item) => (item.id === editingAchievement.id ? normalizedAchievement : item))
        );
      } else {
        setAchievements((prev) => [normalizedAchievement, ...prev]);
      }
      resetModalState();
    } catch (error) {
      message.error((error as Error).message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<Achievement> = [
    {
      title: '成果名称',
      dataIndex: 'title',
      key: 'title',
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (value: AchievementCategory) => categoryLabels[value],
    },
    {
      title: '取得日期',
      dataIndex: 'obtainedAt',
      key: 'obtainedAt',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '当前积分',
      dataIndex: 'score',
      key: 'score',
      render: (value: number) => `${value.toFixed(2)} 分`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: Achievement['status']) => (
        <Tag color={statusColors[value]}>{value}</Tag>
      ),
    },
    {
      title: '审核进度',
      key: 'reviewProgress',
      render: (_, record) =>
        record.reviews && record.reviews.length > 0 ? (
          <Space direction="vertical" size={4}>
            {record.reviews.map((review) => {
              const meta = reviewStatusMeta[review.status] || reviewStatusMeta.submitted;
              return (
                <Tag key={`${record.id}-${review.reviewerId}`} color={meta.color}>
                  {review.reviewerName}：{meta.label}
                </Tag>
              );
            })}
          </Space>
        ) : (
          <Text type="secondary">尚未分配审核员</Text>
        ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="删除成果"
            description="确定要删除这条成果记录吗？"
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
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
                成果管理
              </Title>
              <Text type="secondary">
                录入科研、竞赛、志愿等成果，系统将自动计算对应加分。
              </Text>
            </div>
            <Space>
              <Button onClick={() => router.push('/dashboard')}>返回仪表盘</Button>
              <Button type="primary" onClick={openCreateModal}>
                新增成果
              </Button>
              <PdfSmartImportDialog />
            </Space>
          </div>

          <Card
            type="inner"
            title="学习成绩（草稿记录）"
            extra={
              <Button type="link" onClick={openRecordModal}>
                {academicRecord ? '编辑成绩' : '记录成绩'}
              </Button>
            }
          >
            {academicRecord ? (
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="绩点">
                  {typeof academicRecord.gpa === 'number'
                    ? academicRecord.gpa.toFixed(2)
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="折算分">
                  {typeof academicRecord.score === 'number'
                    ? `${academicRecord.score.toFixed(2)} 分`
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="佐证材料">
                  {academicRecord.evidenceUrl ? (
                    <Button
                      type="link"
                      href={academicRecord.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      查看图片
                    </Button>
                  ) : (
                    <Text type="secondary">未上传</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  {academicRecord.updatedAt
                    ? dayjs(academicRecord.updatedAt).format('YYYY-MM-DD HH:mm')
                    : '—'}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Text type="secondary">
                目前还没有记录绩点，点击右上角按钮录入绩点、折算分和佐证材料，方便与加分成绩一起统计。
              </Text>
            )}
          </Card>

          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={achievements}
            pagination={{ pageSize: 6 }}
          />
        </Space>
      </Card>

      <Modal
        title={editingAchievement ? '编辑成果' : '新增成果'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          resetModalState();
        }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnClose
        width={600}
      >
        {editingAchievement && editingAchievement.reviews?.length > 0 && (
          <Alert
            type={
              editingAchievement.status === 'rejected'
                ? 'warning'
                : editingAchievement.status === 'approved'
                ? 'success'
                : 'info'
            }
            showIcon
            message="审核进度"
            description={
              <Space direction="vertical" size={8}>
                {editingAchievement.reviews.map((review) => {
                  const meta = reviewStatusMeta[review.status] || reviewStatusMeta.submitted;
                  return (
                    <div key={`review-${review.reviewerId}`}>
                      <div>
                        <strong>{review.reviewerName}</strong>：{meta.label}
                      </div>
                      {review.comment && <div>审核说明：{review.comment}</div>}
                      {review.reviewedAt && (
                        <div>
                          审核时间：{dayjs(review.reviewedAt).format('YYYY-MM-DD HH:mm')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </Space>
            }
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'draft',
            obtainedAt: dayjs(),
            metadata: {},
          }}
        >
          <Form.Item
            label="成果名称"
            name="title"
            rules={[{ required: true, message: '请输入成果名称' }]}
          >
            <Input placeholder="请输入成果名称" />
          </Form.Item>
          <Form.Item
            label="成果类别"
            name="category"
            rules={[{ required: true, message: '请选择成果类别' }]}
          >
            <Select
              placeholder="请选择成果类别"
              options={Object.entries(categoryLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Form.Item>
          <MetadataFields category={Form.useWatch('category', form)} />
          <Form.Item
            label="取得日期"
            name="obtainedAt"
            rules={[{ required: true, message: '请选择取得日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="补充说明该成果的详细情况" />
          </Form.Item>
          <Form.Item label="佐证材料图片">
            <Upload
              action="/api/uploads"
              name="file"
              listType="picture-card"
              fileList={fileList}
              headers={uploadHeaders}
              onChange={handleUploadChange}
              onRemove={handleUploadRemove}
              accept="image/*"
              maxCount={1}
              beforeUpload={(file) => {
                if (file.size > MAX_IMAGE_SIZE) {
                  message.error('单张图片大小不能超过 50MB');
                  return Upload.LIST_IGNORE;
                }
                return true;
              }}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item label="佐证材料链接" name="evidenceUrl">
            <Input placeholder="如有可填写网盘或公开链接" />
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select
              options={[
                { value: 'draft', label: '草稿' },
                { value: 'submitted', label: '待审核' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="记录学习成绩"
        open={recordModalOpen}
        onCancel={() => setRecordModalOpen(false)}
        onOk={() => recordForm.submit()}
        confirmLoading={recordSaving}
        destroyOnClose
      >
        <Form form={recordForm} layout="vertical" onFinish={handleRecordSubmit}>
          <Form.Item
            label="当前绩点"
            name="gpa"
            rules={[{ required: true, message: '请输入绩点' }]}
          >
            <InputNumber min={0} max={5} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="折算分（自动计算）">
            <Input value={`${derivedRecordScore.toFixed(2)} 分`} readOnly />
          </Form.Item>
          <Form.Item
            label="佐证图片（必传）"
            required
            tooltip="上传绩点截图，支持单张 50MB 以下图片"
          >
            <Upload
              action="/api/uploads"
              name="file"
              listType="picture-card"
              fileList={recordFileList}
              headers={uploadHeaders}
              onChange={handleRecordUploadChange}
              onRemove={handleRecordUploadRemove}
              accept="image/*"
              maxCount={1}
              beforeUpload={(file) => {
                if (file.size > MAX_IMAGE_SIZE) {
                  message.error('单张图片大小不能超过 50MB');
                  return Upload.LIST_IGNORE;
                }
                return true;
              }}
            >
              {recordFileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="evidenceUrl" hidden>
            <Input type="hidden" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
