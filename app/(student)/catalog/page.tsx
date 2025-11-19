import CatalogPage from '@/components/catalog/CatalogPage';

export const metadata = {
  title: '加分项目总目录 - 学生端',
};

export default function StudentCatalogPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <CatalogPage />
    </main>
  );
}
