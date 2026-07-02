import { SimplePage } from '@/components/simple-page';

interface CommunityPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  const { slug } = await params;

  return (
    <SimplePage
      title={`Community: ${slug}`}
      description="Community detail and chat will be implemented in later phases."
    />
  );
}
