import { GroupDataProvider } from './group-data-provider';

export default async function GroupDetailsPage({
  params
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  return (
    <GroupDataProvider
      chatId={chatId}
      backLink="/subscriber/channels"
      backLabel="Back to Channels"
    />
  );
}
