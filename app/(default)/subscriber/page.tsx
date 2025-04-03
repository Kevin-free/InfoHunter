import { redirect } from 'next/navigation';

export default async function SubscriberPage() {
  redirect('/subscriber/channels');
}
