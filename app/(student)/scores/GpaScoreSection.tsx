'use client';

import { useEffect, useState } from 'react';
import { convertGpaToScores } from '@/lib/scoring/gpa';

interface StudentScoresResponse {
  academicSpecialtyScore: number;
  comprehensivePerformanceScore: number;
  gpa?: number;
}

export default function GpaScoreSection() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gpa, setGpa] = useState(0);
  const [academicSpecialtyScore, setAcademicSpecialtyScore] = useState(0);
  const [comprehensivePerformanceScore, setComprehensivePerformanceScore] = useState(0);
  const [academicScore, setAcademicScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadScores = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/student/scores');
        if (!response.ok) {
          throw new Error('加载失败');
        }
        const result = (await response.json()) as StudentScoresResponse;
        const initialGpa = result.gpa ?? 0;
        setGpa(initialGpa);
        setAcademicSpecialtyScore(result.academicSpecialtyScore);
        setComprehensivePerformanceScore(result.comprehensivePerformanceScore);
        const converted = convertGpaToScores({
          gpa: initialGpa,
          academicSpecialtyScore: result.academicSpecialtyScore,
          comprehensivePerformanceScore: result.comprehensivePerformanceScore,
        });
        setAcademicScore(converted.academicScore);
        setFinalScore(converted.finalScore);
      } catch (error) {
        setMessage((error as Error).message || '加载失败');
      } finally {
        setLoading(false);
      }
    };
    loadScores();
  }, []);

  useEffect(() => {
    const converted = convertGpaToScores({
      gpa,
      academicSpecialtyScore,
      comprehensivePerformanceScore,
    });
    setAcademicScore(converted.academicScore);
    setFinalScore(converted.finalScore);
  }, [gpa, academicSpecialtyScore, comprehensivePerformanceScore]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/student/gpa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gpa, academicScore, finalScore }),
      });
      if (!response.ok) {
        throw new Error('保存失败');
      }
      setMessage('保存成功');
    } catch (error) {
      setMessage((error as Error).message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">学习成绩</h2>
      {message && (
        <p className="mt-2 text-sm text-gray-600">
          {message}
        </p>
      )}
      {loading ? (
        <div className="mt-4 text-sm text-gray-500">加载中...</div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">当前 GPA (0~4)</label>
            <input
              type="number"
              min={0}
              max={4}
              step="0.01"
              className="mt-1 w-32 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              value={gpa}
              onChange={(event) => setGpa(Number(event.target.value))}
            />
            <p className="mt-1 text-xs text-gray-500">
              GPA × 25 = 学业综合成绩，学业成绩占推免综合成绩的 80%。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">学术专长总分</label>
              <input
                type="number"
                className="mt-1 w-full rounded border border-gray-200 bg-gray-100 px-3 py-2 text-gray-600"
                value={academicSpecialtyScore}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">综合表现总分</label>
              <input
                type="number"
                className="mt-1 w-full rounded border border-gray-200 bg-gray-100 px-3 py-2 text-gray-600"
                value={comprehensivePerformanceScore}
                readOnly
              />
            </div>
          </div>

          <div className="rounded bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">学业综合成绩（百分制）</span>
              <span className="text-xl font-semibold text-blue-600">{academicScore.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">推免综合成绩（预估）</span>
              <span className="text-xl font-semibold text-green-600">{finalScore.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      )}
    </section>
  );
}
