import { LiveSessionProvider } from '@/lib/live-session-context';
import { JoinRoute } from './join-route';

export default function JoinPage({
  params,
}: {
  params: { sessionId: string };
}) {
  return (
    <LiveSessionProvider>
      <JoinRoute sessionId={params.sessionId} />
    </LiveSessionProvider>
  );
}
