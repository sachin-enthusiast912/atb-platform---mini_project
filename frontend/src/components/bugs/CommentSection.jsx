import { useState } from 'react';
import { bugService } from '../../services/bugService';
import { formatDate } from '../../utils/helpers';
import { Button } from '../common/Button';
import { FaPaperPlane } from 'react-icons/fa';

export const CommentSection = ({ bugId, comments, onCommentAdded }) => {
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await bugService.addComment(bugId, newComment);
      setNewComment('');
      onCommentAdded();
    } catch (err) {
      alert('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>Comments ({comments.length})</h2>

      {comments.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          {comments.map((comment, index) => (
            <div key={index} style={{ 
              borderLeft: '3px solid var(--gray-300)',
              paddingLeft: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <strong>{comment.userId?.name || 'Unknown'}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  {formatDate(comment.timestamp)}
                </span>
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{comment.text}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <textarea
            className="form-textarea"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
        </div>
        <Button type="submit" variant="primary" loading={loading} icon={<FaPaperPlane />}>
          Add Comment
        </Button>
      </form>
    </div>
  );
};