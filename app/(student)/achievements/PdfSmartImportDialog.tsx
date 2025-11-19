"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";

type InferredAchievement = {
  category: string;
  title: string;
  description: string;
  sourcePages: number[];
  totalVolunteerHours?: number;
  rawMatchedText?: string;
  proofFileId?: string;
};

const categoryOptions: { label: string; value: string }[] = [
  { label: "科研成果", value: "research" },
  { label: "学业竞赛", value: "competition" },
  { label: "志愿服务", value: "volunteer" },
  { label: "荣誉称号", value: "honor" },
  { label: "社会工作", value: "socialWork" },
  { label: "语言考试", value: "languageExam" },
  { label: "其他", value: "other" },
];

function useToast() {
  return {
    success: (msg: string) => alert(msg),
    error: (msg: string) => alert(msg),
    info: (msg: string) => alert(msg),
  };
}

export default function PdfSmartImportDialog() {
  const router = useRouter();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<InferredAchievement[]>([]);
  const [proofFileId, setProofFileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type !== "application/pdf") {
      toast.error("请上传 PDF 文件");
      return;
    }
    setFile(selectedFile ?? null);
    setItems([]);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("请选择 PDF 文件");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const ingestResponse = await fetch("/api/pdf-ingest", {
        method: "POST",
        body: formData,
      });

      const ingestResult = await ingestResponse.json();
      if (!ingestResponse.ok || !ingestResult.success) {
        throw new Error(ingestResult.message || "上传失败");
      }

      const { fileId, pages } = ingestResult.data;
      setProofFileId(fileId);

      const inferResponse = await fetch("/api/pdf-infer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages }),
      });

      const inferResult = await inferResponse.json();
      if (!inferResponse.ok || !inferResult.success) {
        throw new Error(inferResult.message || "解析失败");
      }

      const inferred = inferResult.data as InferredAchievement[];
      setItems(
        inferred.map((item) => ({
          ...item,
          proofFileId: fileId,
        })),
      );
      toast.success("解析成功，请确认列表");
    } catch (err) {
      const message = err instanceof Error ? err.message : "上传解析失败";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleItemChange = (index: number, field: keyof InferredAchievement, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleDeleteRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = async () => {
    if (items.length === 0) {
      toast.info("没有可导入的成果");
      return;
    }
    try {
      const response = await fetch("/api/achievements/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            category: item.category,
            title: item.title,
            description: item.description,
            totalVolunteerHours: item.totalVolunteerHours,
            proofFileId: item.proofFileId,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "导入失败");
      }
      toast.success("成果导入成功");
      setIsOpen(false);
      setItems([]);
      setFile(null);
      setProofFileId(null);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "导入失败";
      toast.error(message);
    }
  };

  return (
    <>
      <Button
        icon={<UploadOutlined />}
        onClick={() => setIsOpen(true)}
        style={{ borderRadius: 8 }}
      >
        从 PDF 智能导入成果
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">智能识别 PDF 导入成果</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setIsOpen(false)}>
                关闭
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">上传 PDF 文件</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="mt-2 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-200"
                  disabled={!file || uploading}
                  onClick={handleUpload}
                >
                  {uploading ? "识别中..." : "上传并识别"}
                </button>
                {error && <p className="text-sm text-red-500">{error}</p>}
                {proofFileId && (
                  <span className="text-sm text-gray-500">已上传文件 ID：{proofFileId}</span>
                )}
              </div>
            </div>

            {items.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-medium text-gray-900">识别结果</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">类别</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">标题</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">描述</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">志愿时长</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <select
                              className="w-40 rounded border border-gray-300 px-2 py-1"
                              value={item.category}
                              onChange={(event) => handleItemChange(index, "category", event.target.value)}
                            >
                              {categoryOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              className="w-56 rounded border border-gray-300 px-2 py-1"
                              value={item.title}
                              onChange={(event) => handleItemChange(index, "title", event.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <textarea
                              className="w-full rounded border border-gray-300 px-2 py-1"
                              rows={3}
                              value={item.description}
                              onChange={(event) => handleItemChange(index, "description", event.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            {item.category === "volunteer" ? (
                              <input
                                type="number"
                                min={0}
                                className="w-24 rounded border border-gray-300 px-2 py-1"
                                value={item.totalVolunteerHours ?? ""}
                                onChange={(event) =>
                                  handleItemChange(index, "totalVolunteerHours", Number(event.target.value))
                                }
                              />
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              className="text-sm text-red-600 hover:underline"
                              onClick={() => handleDeleteRow(index)}
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
                    onClick={handleConfirmImport}
                  >
                    确认导入
                  </button>
                </div>
              </div>
            )}

            {items.length === 0 && (
              <div className="mt-6 rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                上传 PDF 并完成识别后将在此显示成果列表，您可以逐条编辑和导入。
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
