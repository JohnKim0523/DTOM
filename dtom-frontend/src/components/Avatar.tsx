import { BACKEND_URL } from '../api';

interface AvatarProps {
  user?: { avatarUrl?: string; displayName?: string; username?: string };
  size?: number;
}

function getInitials(user?: AvatarProps['user']): string {
  const name = user?.displayName || user?.username || '?';
  return name.charAt(0).toUpperCase();
}

export default function Avatar({ user, size = 36 }: AvatarProps) {
  if (user?.avatarUrl) {
    return (
      <img
        src={`${BACKEND_URL}${user.avatarUrl}`}
        alt={user.displayName || user.username || 'avatar'}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#33301e',
        color: '#d4a520',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.45,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {getInitials(user)}
    </div>
  );
}
