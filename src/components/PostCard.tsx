import { useState } from 'react';
import { navigate } from '../router';
import { useStore } from '../store';
import { KIND_LABEL, STANCE_LABEL, type Post } from '../types';
import { findVideo, fullDate, richText, timeAgo, traditionsInReplies, whyYouSee } from '../utils';
import { Avatar, TraditionTag, UserName } from './Avatar';
import { Composer } from './Composer';
import { ConfirmDialog, ReportDialog } from './Dialogs';
import { AmenIcon, BookmarkIcon, CandleIcon, FlagIcon, ReplyIcon, RepostIcon, ShareIcon, TrashIcon } from './Icons';
import { Modal } from './Modal';
import { VideoCard } from './VideoCard';

interface Props {
  post: Post;
  repostedBy?: string;
  detail?: boolean;
  showThreadLine?: boolean;
  showWhy?: boolean;
}

export function PostCard({ post, repostedBy, detail, showThreadLine, showWhy }: Props) {
  const { state, dispatch, me, repliesTo, myBookmarks, reportedByMe } = useStore();
  const [dialog, setDialog] = useState<'reply' | 'delete' | 'report' | null>(null);
  const [toast, setToast] = useState('');
  const [revealed, setRevealed] = useState(false);
  const author = state.users[post.authorId];
  if (!author) return null;

  const parent = post.replyToId ? state.posts[post.replyToId] : undefined;
  const parentAuthor = parent ? state.users[parent.authorId] : undefined;
  const replies = repliesTo(post.id);
  const replyTraditions = traditionsInReplies(replies, state.users).length;
  const amened = post.amens.includes(me.id);
  const praying = post.praying.includes(me.id);
  const reposted = post.reposts.includes(me.id);
  const bookmarked = myBookmarks.includes(post.id);
  const reported = reportedByMe(post.id);
  const reposter = repostedBy ? state.users[repostedBy] : undefined;
  const video = findVideo(post.text);
  const showPraying = post.kind === 'prayer' || post.kind === 'devotion';

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };
  const share = async () => {
    const url = `${location.origin}${location.pathname}#/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      flash('Link copied');
    } catch {
      flash('Copy this link: ' + url);
    }
  };

  if (reported && !revealed) {
    return (
      <div className="post post-hidden">
        <span className="muted">You reported this post. A moderator will review it.</span>
        <button className="link" onClick={() => setRevealed(true)}>
          Show anyway
        </button>
      </div>
    );
  }

  return (
    <article className={`post ${detail ? 'post-detail' : ''} ${showThreadLine ? 'post-ancestor' : ''}`} onClick={detail ? undefined : () => navigate(`/post/${post.id}`)}>
      {reposter && (
        <div className="post-context">
          <RepostIcon width={14} height={14} />
          <a href={`#/${reposter.handle}`} onClick={(e) => e.stopPropagation()}>
            {reposter.id === me.id ? 'You' : reposter.name} reposted
          </a>
        </div>
      )}
      <div className="post-row">
        <div className="post-gutter">
          <Avatar user={author} size={detail ? 46 : 40} />
          {showThreadLine && <div className="thread-line" />}
        </div>
        <div className="post-main">
          <header className="post-header">
            <UserName user={author} />
            <TraditionTag user={author} />
            {!detail && (
              <time className="muted" dateTime={post.createdAt} title={fullDate(post.createdAt)}>
                · {timeAgo(post.createdAt)}
              </time>
            )}
            <div className="post-menu">
              {author.id === me.id ? (
                <button className="icon-btn danger" aria-label="Delete post" title="Delete" onClick={stop(() => setDialog('delete'))}>
                  <TrashIcon />
                </button>
              ) : (
                <button className="icon-btn danger" aria-label="Report post" title="Report" onClick={stop(() => setDialog('report'))}>
                  <FlagIcon />
                </button>
              )}
            </div>
          </header>

          {(post.kind !== 'post' || post.stance || (parentAuthor && !showThreadLine)) && (
            <div className="post-labels">
              {post.kind !== 'post' && (
                <span className={`kind kind-${post.kind}`}>
                  {KIND_LABEL[post.kind]}
                  {post.verse ? ` · ${post.verse}` : ''}
                </span>
              )}
              {post.stance && <span className={`stance stance-${post.stance}`}>{STANCE_LABEL[post.stance]}</span>}
              {parentAuthor && !showThreadLine && (
                <span className="muted small">
                  Replying to{' '}
                  <a className="link" href={`#/${parentAuthor.handle}`} onClick={(e) => e.stopPropagation()}>
                    {parentAuthor.name}
                  </a>
                </span>
              )}
            </div>
          )}

          <div className={`post-text ${detail ? 'post-text-lg' : ''} ${post.kind === 'devotion' || post.kind === 'question' ? 'post-text-serif' : ''}`}>
            {richText(post.text)}
          </div>
          {video && <VideoCard video={video} />}
          {detail && <div className="muted post-meta">{fullDate(post.createdAt)}</div>}
          {showWhy && !post.replyToId && <div className="why">Why you see this: {whyYouSee(post, me, author, replyTraditions)}</div>}

          <div className="post-actions">
            <button className="action reply" aria-label={`Reply, ${replies.length} replies`} onClick={stop(() => setDialog('reply'))}>
              <ReplyIcon />
              <span>{replies.length || ''}</span>
            </button>
            <button className={`action amen ${amened ? 'active' : ''}`} aria-label="Amen" aria-pressed={amened} onClick={stop(() => dispatch({ type: 'amen', postId: post.id }))}>
              <AmenIcon filled={amened} />
              <span>Amen{post.amens.length ? ` ${post.amens.length}` : ''}</span>
            </button>
            {showPraying && (
              <button className={`action praying ${praying ? 'active' : ''}`} aria-label="Praying" aria-pressed={praying} onClick={stop(() => dispatch({ type: 'praying', postId: post.id }))}>
                <CandleIcon filled={praying} />
                <span>Praying{post.praying.length ? ` ${post.praying.length}` : ''}</span>
              </button>
            )}
            <button className={`action repost ${reposted ? 'active' : ''}`} aria-label={reposted ? 'Undo repost' : 'Repost'} aria-pressed={reposted} onClick={stop(() => dispatch({ type: 'repost', postId: post.id }))}>
              <RepostIcon />
              <span>{post.reposts.length || ''}</span>
            </button>
            <div className="action-group">
              <button className={`action bookmark ${bookmarked ? 'active' : ''}`} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'} aria-pressed={bookmarked} onClick={stop(() => dispatch({ type: 'bookmark', postId: post.id }))}>
                <BookmarkIcon filled={bookmarked} width={18} height={18} />
              </button>
              <button className="action" aria-label="Copy link" onClick={stop(share)}>
                <ShareIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}
      {dialog && (
        <div onClick={(e) => e.stopPropagation()}>
          {dialog === 'reply' && (
            <Modal onClose={() => setDialog(null)}>
              <div className="reply-preview">
                <div className="post-row">
                  <div className="post-gutter">
                    <Avatar user={author} link={false} />
                    <div className="thread-line" />
                  </div>
                  <div className="post-main">
                    <header className="post-header">
                      <strong>{author.name}</strong>
                      <TraditionTag user={author} />
                    </header>
                    <div className="post-text">{post.text}</div>
                  </div>
                </div>
              </div>
              <Composer replyToId={post.id} autoFocus onPosted={() => setDialog(null)} />
            </Modal>
          )}
          {dialog === 'delete' && (
            <ConfirmDialog
              title="Delete post?"
              body="This removes the post and its replies. It can’t be undone."
              confirmLabel="Delete"
              danger
              onClose={() => setDialog(null)}
              onConfirm={() => {
                dispatch({ type: 'delete', postId: post.id });
                if (detail) navigate('/home');
              }}
            />
          )}
          {dialog === 'report' && <ReportDialog onClose={() => setDialog(null)} onSubmit={(reason) => dispatch({ type: 'report', postId: post.id, reason })} />}
        </div>
      )}
    </article>
  );
}
