import { useEffect } from 'react';
import { canRead } from '../circles/chat';
import { planById } from '../circles/plans';
import { PageHeader } from '../components/PageHeader';
import { navigate } from '../router';
import { useStore } from '../store';
import { ChatList } from './circles/ChatList';
import { ChatView } from './circles/ChatView';
import { Finished } from './circles/Finished';
import { GroupInfo } from './circles/GroupInfo';
import { JoinFlow } from './circles/JoinFlow';
import { Reading } from './circles/Reading';

/**
 * Reading Circles as chats.
 *   #/circles              your chats
 *   #/circles/<chat id>    a group or private chat (?m= highlights a message, ?say= prefills the box)
 *   #/circles/<id>/info    group info
 *   #/circles/mine         your current circle's chat
 *   #/circles/read         today's reading
 *   #/circles/join         find a circle
 *   #/circles/next         what to read after finishing a plan
 */
export function Circles({ path, params }: { path: string[]; params: URLSearchParams }) {
  const { state, me, myCircle } = useStore();
  const [first, second] = path.map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });

  if (!first) return <ChatList />;

  const mine = myCircle?.members.find((m) => m.user.id === me.id)?.membership;
  const plan = mine ? planById(mine.planId) : undefined;
  const myChat = myCircle ? `/circles/${encodeURIComponent(myCircle.circle.id)}` : '/circles';

  if (first === 'join') {
    if (myCircle) return <Redirect from="/circles/join" to={myChat} />;
    return (
      <div className="rc">
        <PageHeader title="Find a circle" subtitle="Read the Bible daily, together" back />
        <JoinFlow onJoined={() => navigate('/circles/mine?welcome=1')} />
      </div>
    );
  }

  if (first === 'read' || first === 'next') {
    if (!myCircle || !mine || !plan) return <Redirect from={`/circles/${first}`} to="/circles" />;
    if (first === 'next' || mine.finishedOn)
      return (
        <div className="rc">
          <PageHeader title={myCircle.circle.name} subtitle={plan.title} back />
          <Finished view={myCircle} membership={mine} plan={plan} />
        </div>
      );
    const requested = Number(params.get('day'));
    const day = Number.isInteger(requested) && requested >= 1 && requested <= plan.days.length ? requested : (plan.days.findIndex((_, i) => !mine.reads.some((r) => r.day === i + 1)) + 1 || 1);
    return (
      <div className="rc">
        <Reading
          plan={plan}
          day={day}
          onBack={() => navigate(myChat)}
          onDone={() => navigate(`${myChat}?read=${day}`)}
        />
      </div>
    );
  }

  const chatId = first === 'mine' ? myCircle?.circle.id : first;
  if (!chatId || !canRead(state, chatId, me.id))
    return (
      <>
        <PageHeader title="Circles" back />
        <p className="pad muted">This chat isn't available. It may be private, or you may have left it.</p>
      </>
    );

  if (second === 'info') return <GroupInfo circleId={chatId} />;

  const read = Number(params.get('read'));
  return (
    <ChatView
      key={chatId}
      chatId={chatId}
      focusId={params.get('m') ?? undefined}
      initialDraft={params.get('say') ?? undefined}
      justRead={Number.isInteger(read) && read > 0 ? read : undefined}
      welcome={params.get('welcome') === '1'}
    />
  );
}

/** Sends the reader on, unless something (like finishing the join flow) has already moved them. */
function Redirect({ from, to }: { from: string; to: string }) {
  useEffect(() => {
    if (window.location.hash.startsWith(`#${from}`)) navigate(to);
  }, [from, to]);
  return null;
}
