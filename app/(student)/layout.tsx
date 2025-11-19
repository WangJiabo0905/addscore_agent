import type { ReactNode } from 'react';
import FeedbackDrawer from '@/components/feedback/FeedbackDrawer';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-slate-50/80">
      {children}
      <FeedbackDrawer />
    </div>
  );
}
