import { useState } from 'react';
import { navigate } from '../router';
import { useStore } from '../store';
import type { Post } from '../types';
import { compact, fullDate, richText, timeAgo } from '../utils';
import { Avatar, UserName } from './Avatar';
import { BookmarkIcon, ChartIcon, HeartIcon, ReplyIcon, RepostIcon, ShareIcon, TrashIcon } from './Icons';
import { Composer } from './Composer';
import { Modal } from './Modal';

interface Props {
  post: Post;
  repostedBy?: string; // user id
  detail?: boolean;
  showThreadLine?: boolean;
}

export function PostCard({ post, repostedBy, detail, showThreadLine }: Props) {
  const { state, dispatch, me, repliesTo } = useStore();
  const [replying, setReplying] = useState(false);
  const [toast, setToast] = useState('');
  const author = state.users[post.authorId];
  if (!author) return null;
  const parent = post.replyToId ? state.posts[post.replyToId] : undefined;
  const parentAuthor = parent ? state.users[parent.authorId] : undefined;
  const liked = post.likes.includes(me.id);
  const reposted = post.reposts.includes(me.id);
  const bookmarked = state.bookmarks.includes(post.id);
  const replyCount = repliesTo(post.id).length;
  const reposter = repostedBy ? state.users[repostedBy] : undefined;

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}#/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast('Link copied');
    } catch {
      setToast(url);
    }
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <article
      className={`post ${detail ? 'post-detail' : ''}`}
      onClick={detail ? undefined : () => navigate(`/post/${post.id}`)}
    >
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
          <Avatar user={author} size={detail ? 44 : 40} />
          {showThreadLine && <div className="thread-line" />}
        </div>
        <div className="post-main">
          <header className="post-header">
            <UserName user={author} />
            <span className="muted handle">@{author.handle}</span>
            {!detail && (
              <>
                <span className="muted">·</span>
                <time className="muted" dateTime={post.createdAt} title={fullDate(post.createdAt)}>
                  {timeAgo(post.createdAt)}
                </time>
              </>
            )}
            {author.id === me.id && (
              <button
                className="icon-btn danger post-delete"
                aria-label="Delete post"
                onClick={stop(() => {
                  if (confirm('Delete this post?')) {
                    dispatch({ type: 'delete', postId: post.id });
                    if (detail) navigate('/home');
                  }
                })}
              >
                <TrashIcon />
              </button>
            )}
          </header>
          {parentAuthor && !showThreadLine && (
            <div className="muted replying-to">
              Replying to{' '}
              <a className="link" href={`#/${parentAuthor.handle}`} onClick={(e) => e.stopPropagation()}>
                @{parentAuthor.handle}
              </a>
            </div>
          )}
          <div className={`post-text ${detail ? 'post-text-lg' : ''}`}>{richText(post.text)}</div>
          {detail && (
            <div className="muted post-meta">
              {fullDate(post.createdAt)} · <strong>{compact(post.views)}</strong> Views
            </div>
          )}
          <div className="post-actions">
            <button className="action reply" aria-label="Reply" onClick={stop(() => setReplying(true))}>
              <ReplyIcon />
              <span>{replyCount || ''}</span>
            </button>
            <button
              className={`action repost ${reposted ? 'active' : ''}`}
              aria-label={reposted ? 'Undo repost' : 'Repost'}
              aria-pressed={reposted}
              onClick={stop(() => dispatch({ type: 'repost', postId: post.id }))}
            >
              <RepostIcon />
              <span>{post.reposts.length || ''}</span>
            </button>
            <button
              className={`action like ${liked ? 'active' : ''}`}
              aria-label={liked ? 'Unlike' : 'Like'}
              aria-pressed={liked}
              onClick={stop(() => dispatch({ type: 'like', postId: post.id }))}
            >
              <HeartIcon filled={liked} />
              <span>{post.likes.length || ''}</span>
            </button>
            {!detail && (
              <span className="action views" title="Views">
                <ChartIcon />
                <span>{compact(post.views)}</span>
              </span>
            )}
            <div className="action-group">
              <button
                className={`action bookmark ${bookmarked ? 'active' : ''}`}
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                aria-pressed={bookmarked}
                onClick={stop(() => dispatch({ type: 'bookmark', postId: post.id }))}
              >
                <BookmarkIcon filled={bookmarked} width={18} height={18} />
              </button>
              <button className="action" aria-label="Copy link" onClick={stop(share)}>
                <ShareIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
      {replying && (
        <Modal onClose={() => setReplying(false)}>
          <div className="reply-preview">
            <PostPreview post={post} />
          </div>
          <Composer replyToId={post.id} placeholder="Post your reply" autoFocus onPosted={() => setReplying(false)} />
        </Modal>
      )}
    </article>
  );
}

function PostPreview({ post }: { post: Post }) {
  const { state } = useStore();
  const author = state.users[post.authorId];
  return (
    <div className="post-row">
      <div className="post-gutter">
        <Avatar user={author} />
        <div className="thread-line" />
      </div>
      <div className="post-main">
        <header className="post-header">
          <UserName user={author} />
          <span className="muted handle">@{author.handle}</span>
        </header>
        <div className="post-text">{richText(post.text)}</div>
        <div className="muted replying-to">
          Replying to <span className="link">@{author.handle}</span>
        </div>
      </div>
    </div>
  );
}
