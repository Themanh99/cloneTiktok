import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '@/stores';
import * as http from '@/lib/http';

export default function UploadPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY'>('PUBLIC');
  const [allowComments, setAllowComments] = useState(true);
  const [allowDownload, setAllowDownload] = useState(true);

  // Extracted metadata states
  const [duration, setDuration] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  // Upload progress / status states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'requesting' | 'uploading' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Guard against unauthenticated users
  useEffect(() => {
    if (!user) {
      // If not logged in, wait a moment then redirect to home
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Yêu cầu đăng nhập</h2>
        <p className="text-text-secondary">Vui lòng đăng nhập để thực hiện tải video lên. Đang chuyển hướng...</p>
      </div>
    );
  }

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      setErrorMessage('Vui lòng chỉ tải lên tệp video (mp4, webm, v.v.).');
      setUploadStatus('error');
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      setErrorMessage('Dung lượng video vượt quá giới hạn 100MB.');
      setUploadStatus('error');
      return;
    }

    setFile(selectedFile);
    setUploadStatus('idle');
    setErrorMessage('');

    // Generate local preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Extract metadata
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.onloadedmetadata = () => {
      setDuration(videoElement.duration);
      setWidth(videoElement.videoWidth);
      setHeight(videoElement.videoHeight);
      URL.revokeObjectURL(videoElement.src);
    };
    videoElement.src = url;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl('');
    setTitle('');
    setVisibility('PUBLIC');
    setAllowComments(true);
    setAllowDownload(true);
    setDuration(0);
    setWidth(0);
    setHeight(0);
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setIsUploading(true);
      setErrorMessage('');
      
      // Step 1: Request S3 pre-signed URL from NestJS backend
      setUploadStatus('requesting');
      const presignResponse = await http.get<{
        uploadUrl: string;
        fileKey: string;
        expiresInSeconds: number;
      }>(`/videos/presigned-url?contentType=${encodeURIComponent(file.type)}`);

      const { uploadUrl, fileKey } = presignResponse;

      // Step 2: Upload direct to S3/MinIO
      setUploadStatus('uploading');
      setUploadProgress(0);
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type || 'video/mp4',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      });

      // Step 3: Call NestJS backend to register video in database
      setUploadStatus('saving');
      await http.post('/videos', {
        fileKey,
        title,
        duration,
        width,
        height,
        sizeBytes: file.size,
        visibility,
        allowComments,
        allowDownload,
      });

      setUploadStatus('success');
      setTimeout(() => {
        navigate(`/@${user.username}`);
      }, 1500);

    } catch (err: any) {
      console.error('Lỗi tải video lên:', err);
      const errText = err.response?.data?.message || err.message || 'Có lỗi xảy ra trong quá trình tải lên.';
      setErrorMessage(Array.isArray(errText) ? errText.join(', ') : errText);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-[1080px] mx-auto py-8 px-4 min-h-[90vh]">
      <div className="bg-bg-secondary border border-border rounded-xl p-8 shadow-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-text-primary">Tải video lên</h1>
          <p className="text-text-secondary text-sm mt-1">Đăng video lên tài khoản của bạn</p>
        </div>

        {uploadStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg flex items-center gap-3 animate-fade-in">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" fill="currentColor" className="opacity-20" />
              <path d="M16 24L22 30L32 18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-bold">Đăng video thành công! Đang chuyển hướng về trang cá nhân...</span>
          </div>
        )}

        {uploadStatus === 'error' && errorMessage && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 text-primary rounded-lg flex items-center gap-3 animate-fade-in">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" fill="currentColor" className="opacity-20" />
              <path d="M24 12V28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <circle cx="24" cy="36" r="2" fill="currentColor" />
            </svg>
            <span className="font-semibold text-sm">{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* LEFT: DROPZONE / PREVIEW */}
          <div className="md:col-span-1 flex flex-col items-center justify-start">
            {!previewUrl ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={triggerSelectFile}
                className={`w-full aspect-[9/16] max-h-[480px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive
                    ? 'border-primary bg-primary/5 scale-102'
                    : 'border-border hover:border-primary/50 hover:bg-bg-primary/30'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  accept="video/*"
                  className="hidden"
                />
                
                {/* Cloud Icon */}
                <div className="w-14 h-14 bg-bg-primary rounded-full flex items-center justify-center mb-4 text-text-secondary shadow-md group-hover:text-primary transition-colors">
                  <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                    <path d="M12 28C7.58172 28 4 24.4183 4 20C4 16.2294 6.61981 13.071 10.1581 12.23C11.5976 7.42082 15.9863 4 21.2 4C27.0504 4 31.9022 8.02672 33.2 13.5C38.1 14.1 42 18.2576 42 23.3C42 28.5 37.8 32.7 32.6 32.7H29M24 22V42M24 22L17 29M24 22L31 29" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                
                <h3 className="text-base font-bold text-text-primary mb-1.5">Chọn video để tải lên</h3>
                <p className="text-text-secondary text-xs mb-4">Hoặc kéo và thả tệp của bạn tại đây</p>
                
                <div className="text-left text-xxs text-text-secondary space-y-1 bg-bg-primary/50 p-3 rounded-lg w-full max-w-[200px] border border-border/40">
                  <p>• Định dạng: MP4, WebM</p>
                  <p>• Dung lượng: Tối đa 100MB</p>
                  <p>• Độ dài: Dưới 3 phút</p>
                </div>

                <button
                  type="button"
                  className="mt-6 px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Chọn tệp
                </button>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                {/* Smartphone skin phone outline */}
                <div className="relative w-full max-w-[260px] aspect-[9/16] bg-black rounded-3xl overflow-hidden border-[6px] border-text-primary/10 shadow-2xl flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={previewUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isUploading}
                  className="mt-4 flex items-center gap-2 text-sm font-bold text-primary hover:underline cursor-pointer disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                    <path d="M9 10V44H39V10H9Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
                    <path d="M20 20V34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M28 20V34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 10H44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 10L19.2778 4H28.7222L32 10H16Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
                  </svg>
                  Hủy và chọn lại
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: METADATA FORM */}
          <div className="md:col-span-2">
            <form onSubmit={handleUpload} className="space-y-6">
              {/* Caption */}
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">Chú thích</label>
                <div className="relative">
                  <textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 150))}
                    placeholder="Viết chú thích cho video của bạn ở đây... Sử dụng # để thêm hashtag"
                    rows={3}
                    disabled={isUploading}
                    className="w-full bg-bg-primary border border-border text-text-primary rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none transition-colors"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-text-secondary">
                    {title.length} / 150
                  </div>
                </div>
              </div>

              {/* Visibility Select */}
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">Ai có thể xem video này</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  disabled={isUploading}
                  className="w-full md:w-60 bg-bg-primary border border-border text-text-primary rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary cursor-pointer transition-colors"
                >
                  <option value="PUBLIC">Mọi người (Công khai)</option>
                  <option value="FRIENDS_ONLY">Bạn bè (Chỉ người theo dõi lẫn nhau)</option>
                  <option value="PRIVATE">Chỉ mình tôi (Riêng tư)</option>
                </select>
              </div>

              {/* Interactions switches */}
              <div>
                <label className="block text-sm font-bold text-text-primary mb-3">Cho phép người dùng</label>
                <div className="flex flex-col sm:flex-row gap-6">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allowComments}
                      onChange={(e) => setAllowComments(e.target.checked)}
                      disabled={isUploading}
                      className="w-4.5 h-4.5 text-primary bg-bg-primary border-border rounded focus:ring-primary focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-text-primary">Bình luận</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allowDownload}
                      onChange={(e) => setAllowDownload(e.target.checked)}
                      disabled={isUploading}
                      className="w-4.5 h-4.5 text-primary bg-bg-primary border-border rounded focus:ring-primary focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-text-primary">Tải xuống</span>
                  </label>
                </div>
              </div>

              {/* Extracted Metadata Preview */}
              {file && (
                <div className="p-4 bg-bg-primary rounded-lg border border-border/60 flex flex-wrap gap-x-6 gap-y-2 text-xs text-text-secondary">
                  <div>
                    <span className="font-semibold text-text-primary">Thời lượng:</span> {duration.toFixed(1)}s
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary">Kích thước:</span> {width} × {height}
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary">Dung lượng:</span> {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              )}

              {/* Uploading progress status bar */}
              {isUploading && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-text-primary">
                      {uploadStatus === 'requesting' && 'Đang chuẩn bị phiên tải lên...'}
                      {uploadStatus === 'uploading' && `Đang gửi video đến máy chủ lưu trữ...`}
                      {uploadStatus === 'saving' && 'Đang tối ưu hóa và xuất bản video...'}
                    </span>
                    <span className="text-primary">{uploadProgress}%</span>
                  </div>
                  
                  <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(254,44,85,0.4)]"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex gap-4 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isUploading || !file}
                  className="flex-1 py-3 border border-border font-bold rounded-lg text-text-primary hover:bg-bg-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center text-sm"
                >
                  Hủy
                </button>
                
                <button
                  type="submit"
                  disabled={isUploading || !file}
                  className="flex-1 py-3 bg-primary hover:bg-primary-hover font-bold rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center text-sm shadow-md"
                >
                  {isUploading ? 'Đang xử lý...' : 'Đăng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
