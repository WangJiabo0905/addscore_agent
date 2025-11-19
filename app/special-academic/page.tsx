'use client';

import { Card, Timeline, Typography, Alert, Button, Space } from 'antd';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function SpecialAcademicPage() {
  const router = useRouter();

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={3}>特殊学术专长申请流程</Title>
            <Paragraph type="secondary">
              如满足学院《特殊学术专长推免实施办法》要求，可按以下步骤准备材料，并联系系工作小组启动流程。
            </Paragraph>
          </div>

          <Alert
            message="申报条件"
            description={
              <div>
                <p>1. 获得 3 位以上相关领域教授书面推荐；</p>
                <p>2. 拥有高水平科研成果（A/B 类论文、重要专利、国家级竞赛一等奖等）；</p>
                <p>3. 能够提供详实的成果证明材料，接受公开答辩。</p>
              </div>
            }
            type="info"
            showIcon
          />

          <Timeline
            items={[
              { children: '学生准备个人陈述、成果清单、证明材料' },
              { children: '联系3位教授出具推荐意见' },
              { children: '提交特殊学术专长申请表及相关材料至学院' },
              { children: '学院组织专家评审与公开答辩' },
              { children: '根据评审意见确定加分并公示结果' },
            ]}
          />

          <Alert
            message="材料清单"
            description={
              <div>
                <p>• 《特殊学术专长申请表》</p>
                <p>• 个人陈述与培养计划（可从系统导出）</p>
                <p>• 成果证明材料（论文录用通知、竞赛证书等）</p>
                <p>• 教授推荐信扫描件</p>
                <p>• 公示所需材料（个人简介、成果简介）</p>
              </div>
            }
            type="warning"
            showIcon
          />

          <Space>
            <Button type="primary" onClick={() => router.push('/achievements')}>
              去完善成果
            </Button>
            <Button onClick={() => router.push('/application')}>更新申请材料</Button>
            <Button onClick={() => router.push('/dashboard')}>返回仪表盘</Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
}

