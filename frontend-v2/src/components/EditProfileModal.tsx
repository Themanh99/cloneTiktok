import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import * as http from '@/lib/http';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [error, setError] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: (data: { displayName: string; bio: string; avatarUrl: string }) =>
      http.patch('/users/me', data),
    onSuccess: (data: any) => {
      // Update global auth store user
      setUser(data);
      // Invalidate queries to reload profile info
      queryClient.invalidateQueries({ queryKey: ['profile', user?.username] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Không thể cập nhật hồ sơ');
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Tên hiển thị không được để trống');
      return;
    }
    updateProfileMutation.mutate({
      displayName,
      bio,
      avatarUrl,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-bg-primary w-full max-w-[600px] rounded-xl border border-border p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-divider mb-6">
          <h2 className="text-xl font-bold text-text-primary">Sửa hồ sơ</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-1"
          >
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
              <path d="M14 14L34 34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 34L34 14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300'}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-border group-hover:opacity-85 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" className="text-white">
                  <path d="M39.3 6H8.7C7.21 6 6 7.21 6 8.7V39.3C6 40.79 7.21 42 8.7 42H39.3C40.79 42 42 40.79 42 39.3V8.7C42 7.21 40.79 6 39.3 6Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
                  <path d="M16 21C17.6569 21 19 19.6569 19 18C19 16.3431 17.6569 15 16 15C14.3431 15 13 16.3431 13 18C13 19.6569 14.3431 21 16 21Z" fill="currentColor"/>
                  <path d="M6 36L18 24L29 35L35 29L42 36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="w-full max-w-sm">
              <label className="block text-xs font-semibold text-text-secondary mb-1">Đường dẫn ảnh đại diện (URL)</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Nhập link ảnh (ví dụ: Unsplash, Imgur...)"
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-secondary text-text-primary text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* TikTok ID (Readonly username) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-secondary">TikTok ID</label>
            <input
              type="text"
              value={`@${user?.username}`}
              disabled
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg-tertiary text-text-tertiary text-sm cursor-not-allowed"
            />
            <p className="text-xs text-text-tertiary">TikTok ID không thể thay đổi tại đây.</p>
          </div>

          {/* Display Name */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-text-secondary">Tên</label>
              <span className="text-xs text-text-tertiary">{displayName.length}/100</span>
            </div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 100))}
              placeholder="Nhập tên của bạn"
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg-secondary text-text-primary text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-text-secondary">Tiểu sử</label>
              <span className="text-xs text-text-tertiary">{bio.length}/200</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              placeholder="Thêm tiểu sử vào hồ sơ của bạn"
              maxLength={200}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg-secondary text-text-primary text-sm focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-divider mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-border text-text-primary font-semibold text-sm hover:bg-bg-hover transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-6 py-2 rounded-md bg-primary text-white font-semibold text-sm hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
