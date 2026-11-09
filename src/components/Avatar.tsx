import type { User } from '../types';

export function Avatar({ user, size = 40, link = true }: { user: User; size?: number; link?: boolean }) {
  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const style = { width: size, height: size, background: user.avatarColor, fontSize: size * 0.38 };
  if (!link)
    return (
      <span className="avatar" style={style} aria-hidden="true">
        {initials}
      </span>
    );
  return (
    <a href={`#/${user.handle}`} className="avatar" style={style} onClick={(e) => e.stopPropagation()} aria-label={`${user.name}'s profile`}>
      {initials}
    </a>
  );
}

export function UserName({ user }: { user: User }) {
  return (
    <a href={`#/${user.handle}`} onClick={(e) => e.stopPropagation()} className="user-name">
      {user.name}
    </a>
  );
}

export function TraditionTag({ user }: { user: User }) {
  return <span className="tradition">{user.tradition}</span>;
}
