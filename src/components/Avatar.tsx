import { VerifiedBadge } from './Icons';
import type { User } from '../types';

export function Avatar({ user, size = 40 }: { user: User; size?: number }) {
  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <a
      href={`#/${user.handle}`}
      className="avatar"
      style={{ width: size, height: size, background: user.avatarColor, fontSize: size * 0.4 }}
      onClick={(e) => e.stopPropagation()}
      aria-label={`${user.name}'s profile`}
    >
      {initials}
    </a>
  );
}

export function UserName({ user }: { user: User }) {
  return (
    <span className="user-name">
      <a href={`#/${user.handle}`} onClick={(e) => e.stopPropagation()} className="name">
        {user.name}
      </a>
      {user.verified && <VerifiedInline />}
    </span>
  );
}

const VerifiedInline = () => <VerifiedBadge style={{ marginLeft: 2, flexShrink: 0 }} />;
