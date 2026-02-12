import { Link } from 'react-router-dom';
import Avatar from './Avatar';

interface UserLinkProps {
  user?: { id: string; avatarUrl?: string; displayName?: string; username?: string };
  showAvatar?: boolean;
  size?: number;
}

export default function UserLink({ user, showAvatar = true, size = 20 }: UserLinkProps) {
  if (!user) return <span>Unknown</span>;

  return (
    <Link
      to={`/users/${user.id}`}
      className="user-link"
      onClick={(e) => e.stopPropagation()}
    >
      {showAvatar && <Avatar user={user} size={size} />}
      <span>{user.displayName || user.username}</span>
    </Link>
  );
}
