import { UkmDetailClient } from '@/components/admin/UkmDetailClient';

export default function UkmDetailPage({ params }: { params: { id: string } }) {
  return <UkmDetailClient id={params.id} />;
}
