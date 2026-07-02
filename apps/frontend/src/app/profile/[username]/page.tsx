import { SimplePage } from '@/components/simple-page';

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  return (
    <SimplePage
      title={`Profile: ${username}`}
      description="Public profile details will be connected in a later frontend pass."
    />
  );
}
