import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DownOutlined,
  HeartOutlined,
  UpOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n';
import { appToast } from '@/lib/toast';
import * as http from '@/lib/http';

export interface CommentUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  isLiked?: boolean;
  author?: CommentUser;
  user?: CommentUser;
  replyCount: number;
  parentId: string | null;
  replies?: CommentItem[];
}

interface CommentThreadProps {
  comment: CommentItem;
  onReply: (comment: CommentItem) => void;
  depth?: number;
}

export default function CommentThread({
  comment,
  onReply,
  depth = 0,
}: CommentThreadProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { language, t } = useTranslation();
  const repliesFailedMessage = t('video.repliesFailed');
  const commentUser = comment.author || comment.user;
  const preloadedReplies = comment.replies ?? [];

  const repliesQuery = useQuery<{ data: CommentItem[] }>({
    queryKey: ['comment-replies', comment.id],
    queryFn: () =>
      http.get(`/comments/${comment.id}/replies`, {
        params: { limit: 100 },
      }),
    enabled: expanded && preloadedReplies.length === 0 && comment.replyCount > 0,
    retry: 1,
  });

  const replies =
    preloadedReplies.length > 0 ? preloadedReplies : repliesQuery.data?.data ?? [];

  useEffect(() => {
    if (repliesQuery.error) {
      appToast.error(repliesQuery.error, repliesFailedMessage);
    }
  }, [repliesFailedMessage, repliesQuery.error]);

  const toggleReplies = () => {
    setExpanded((current) => !current);
  };

  return (
    <div
      className={depth === 0 ? 'space-y-3' : 'space-y-2 border-l border-divider pl-3'}
      style={{ marginLeft: depth > 0 ? Math.min(depth, 3) * 8 : 0 }}
    >
      <div className="group flex items-start gap-3">
        <button
          onClick={() => commentUser && navigate(`/@${commentUser.username}`)}
          className={`shrink-0 overflow-hidden rounded-full bg-bg-tertiary ${
            depth === 0 ? 'h-8 w-8' : 'h-7 w-7'
          }`}
        >
          {commentUser?.avatarUrl ? (
            <img src={commentUser.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center">
              <UserOutlined className={depth === 0 ? 'text-base' : 'text-sm'} />
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <button
            onClick={() => commentUser && navigate(`/@${commentUser.username}`)}
            className="text-xs font-bold hover:underline"
          >
            {commentUser?.username || 'user'}
          </button>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-normal text-text-primary">
            {comment.content}
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-text-tertiary">
            <span>
              {new Date(comment.createdAt).toLocaleDateString(
                language === 'vi' ? 'vi-VN' : 'en-US',
              )}
            </span>
            <button onClick={() => onReply(comment)} className="hover:underline">
              {t('common.reply')}
            </button>
          </div>
        </div>

        <button className="flex flex-col items-center text-text-tertiary hover:text-primary">
          <HeartOutlined />
          <span className="mt-0.5 text-[10px]">{comment.likeCount}</span>
        </button>
      </div>

      {comment.replyCount > 0 && (
        <div className={depth === 0 ? 'pl-11' : 'pl-10'}>
          <button
            onClick={toggleReplies}
            disabled={repliesQuery.isFetching}
            className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary"
          >
            {repliesQuery.isFetching ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-text-secondary border-t-transparent" />
            ) : expanded ? (
              <UpOutlined />
            ) : (
              <DownOutlined />
            )}
            {expanded
              ? t('video.hideReplies')
              : t('video.viewReplies', { count: comment.replyCount })}
          </button>
        </div>
      )}

      {expanded && replies.length > 0 && (
        <div className={depth === 0 ? 'space-y-3 pl-8' : 'space-y-3 pl-4'}>
          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
