import { useState } from 'react';
import { useStore } from '../store';

export function FollowButton({ userId }: { userId: string }) {
  const { me, dispatch } = useStore();
  const [hover, setHover] = useState(false);
  if (userId === me.id) return null;
  const following = me.following.includes(userId);
  return (
    <button
      className={`btn ${following ? 'btn-outline following' : 'btn-contrast'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        dispatch({ type: 'follow', userId });
      }}
    >
      {following ? (hover ? 'Unfollow' : 'Following') : 'Follow'}
    </button>
  );
}
