"use client";

import { useState } from "react";
import { Button } from "antd";
import { FileExcelOutlined } from "@ant-design/icons";

export default function ExportRankingButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/export/ranking-excel');
      if (!response.ok) {
        throw new Error('导出失败');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '信息学院推免加分登记表.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert((error as Error).message || '导出失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      icon={<FileExcelOutlined />}
      onClick={handleExport}
      disabled={loading}
      style={{ borderRadius: 8 }}
    >
      {loading ? "导出中..." : "按学院模板导出 Excel"}
    </Button>
  );
}
