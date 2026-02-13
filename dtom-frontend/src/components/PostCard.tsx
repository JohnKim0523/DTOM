import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { postComments, imageUrl } from '../api';
import Avatar from './Avatar';
import UserLink from './UserLink';

interface PostCardProps {
  post: any;
  currentUser: any;
  onDelete?: (postId: string) => void;
}

export default function PostCard({ post, currentUser, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentList, setCommentList] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState('');
  const commentImageRef = useRef<HTMLInputElement>(null);

  const loadComments = async () => {
    try {
      const list = await postComments.list(post.id);
      setCommentList(list);
      let total = list.length;
      list.forEach((c: any) => { total += (c.replies?.length || 0); });
      setCommentCount(total);
    } catch {}
  };

  const toggleComments = async () => {
    if (!showComments) {
      await loadComments();
    }
    setShowComments(!showComments);
  };

  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCommentImage(file);
    setCommentImagePreview(URL.createObjectURL(file));
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && !commentImage) return;
    try {
      if (commentImage) {
        await postComments.createWithImage(post.id, commentImage, newComment || ' ', replyingTo || undefined);
      } else {
        await postComments.create(post.id, newComment, replyingTo || undefined);
      }
      setNewComment('');
      setReplyingTo(null);
      setCommentImage(null);
      setCommentImagePreview('');
      await loadComments();
    } catch {}
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await postComments.remove(commentId);
      await loadComments();
    } catch {}
  };

  const author = post.author || currentUser;

  return (
    <div className="card post-card">
      <div className="post-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar user={author} size={36} />
          <div>
            <strong>{author?.displayName || author?.username}</strong>
            <small style={{ display: 'block', color: '#6b6348' }}>
              {new Date(post.createdAt).toLocaleDateString()}
            </small>
          </div>
        </div>
        {onDelete && (
          <button className="btn-danger btn-sm" onClick={() => onDelete(post.id)}>Delete</button>
        )}
      </div>
      {post.content && <p className="post-content">{post.content}</p>}
      {post.imageUrl && (
        <img src={imageUrl(post.imageUrl)} alt="Post" className="post-image" />
      )}
      {post.type === 'repost' && (
        post.event ? (
          <Link to={`/events/${post.event.id}`} className="post-repost-card">
            {post.event.imageUrl && (
              <img src={imageUrl(post.event.imageUrl)} alt={post.event.title} className="post-repost-image" />
            )}
            <div className="post-repost-body">
              <strong>{post.event.title}</strong>
              <p>{post.event.description?.substring(0, 120)}</p>
            </div>
          </Link>
        ) : (
          <div className="post-repost-card" style={{ color: '#6b6348', fontStyle: 'italic' }}>
            Event no longer available
          </div>
        )
      )}

      {/* Comments toggle */}
      <button
        className="btn-sm"
        style={{ marginTop: 8, background: 'transparent', color: '#a09878', border: '1px solid #33301e' }}
        onClick={toggleComments}
      >
        Comments{commentCount !== null ? ` (${commentCount})` : ''}
      </button>

      {/* Expandable comments section */}
      {showComments && (
        <div className="post-comments-section">
          {commentList.length === 0 && <p style={{ color: '#6b6348', fontSize: 13 }}>No comments yet.</p>}
          {commentList.map((c: any) => (
            <div key={c.id} className="post-comment">
              <div className="post-comment-main">
                <div style={{ display: 'flex', gap: 8 }}>
                  <Avatar user={c.author} size={24} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 13 }}><UserLink user={c.author} showAvatar={false} /></strong>
                    <p style={{ fontSize: 13, margin: '2px 0' }}>{c.content}</p>
                    {c.imageUrl && (
                      <img src={imageUrl(c.imageUrl)} alt="comment" className="comment-photo" />
                    )}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                      <small style={{ color: '#6b6348' }}>{new Date(c.createdAt).toLocaleString()}</small>
                      <button
                        className="btn-sm"
                        style={{ background: 'transparent', color: '#a09878', border: 'none', padding: '2px 4px', fontSize: 11 }}
                        onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                      >
                        Reply
                      </button>
                      {(c.authorId === currentUser?.id || post.authorId === currentUser?.id) && (
                        <button
                          className="btn-danger btn-sm"
                          style={{ padding: '2px 6px', fontSize: 11 }}
                          onClick={() => handleDeleteComment(c.id)}
                        >
                          X
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Replies */}
              {c.replies?.map((r: any) => (
                <div key={r.id} className="post-comment-reply">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Avatar user={r.author} size={20} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: 12 }}><UserLink user={r.author} showAvatar={false} /></strong>
                      <p style={{ fontSize: 13, margin: '2px 0' }}>{r.content}</p>
                      {r.imageUrl && (
                        <img src={imageUrl(r.imageUrl)} alt="comment" className="comment-photo" />
                      )}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                        <small style={{ color: '#6b6348', fontSize: 11 }}>{new Date(r.createdAt).toLocaleString()}</small>
                        {(r.authorId === currentUser?.id || post.authorId === currentUser?.id) && (
                          <button
                            className="btn-danger btn-sm"
                            style={{ padding: '2px 6px', fontSize: 11 }}
                            onClick={() => handleDeleteComment(r.id)}
                          >
                            X
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {/* Reply form inline */}
              {replyingTo === c.id && (
                <form onSubmit={handleSubmitComment} className="post-comment-form" style={{ marginLeft: 32 }}>
                  <small style={{ color: '#a09878' }}>Replying to {c.author?.displayName || c.author?.username}...</small>
                  <input
                    placeholder="Write a reply..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                  />
                  {commentImagePreview && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={commentImagePreview} alt="Preview" className="comment-photo" />
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        style={{ position: 'absolute', top: 2, right: 2, padding: '1px 4px', fontSize: 10 }}
                        onClick={() => { setCommentImage(null); setCommentImagePreview(''); }}
                      >X</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn-sm" onClick={() => commentImageRef.current?.click()}
                      style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #33301e' }}>
                      Photo
                    </button>
                    <input ref={commentImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCommentImageSelect} />
                    <button type="submit" className="btn-sm">Send</button>
                    <button type="button" className="btn-sm" onClick={() => { setReplyingTo(null); setNewComment(''); }} style={{ background: 'transparent', color: '#6b6348', border: '1px solid #33301e' }}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          ))}
          {/* Top-level comment form */}
          {!replyingTo && (
            <form onSubmit={handleSubmitComment} className="post-comment-form">
              <input
                placeholder="Write a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              {commentImagePreview && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={commentImagePreview} alt="Preview" className="comment-photo" />
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    style={{ position: 'absolute', top: 2, right: 2, padding: '1px 4px', fontSize: 10 }}
                    onClick={() => { setCommentImage(null); setCommentImagePreview(''); }}
                  >X</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="btn-sm" onClick={() => commentImageRef.current?.click()}
                  style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #33301e' }}>
                  Attach Photo
                </button>
                <input ref={commentImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCommentImageSelect} />
                <button type="submit" className="btn-sm">Send</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
