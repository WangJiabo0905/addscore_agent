'use client';

import { Card, Result, Button } from 'antd';
import { useRouter } from 'next/navigation';

export default function AdminPlaceholderPage() {
  const router = useRouter();

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Result
          status="403"
          title="当前账号暂无管理员权限"
          subTitle="管理员端功能将由学院推免工作小组使用，学生账号暂无法访问。"
          extra={
            <Button type="primary" onClick={() => router.push('/dashboard')}>
              返回仪表盘
            </Button>
          }
        />
      </Card>
    </div>
  );
}

