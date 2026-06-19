import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Button,
  Input,
  Select,
  Switch,
  Progress,
  Alert,
  Result,
  Spin,
  Card,
  Typography,
  Divider,
  Descriptions,
  Upload as AntUpload,
} from 'antd';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  ExpandOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores';
import * as http from '@/lib/http';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/i18n';
import { appToast } from '@/lib/toast';

const { TextArea } = Input;
const { Text, Title } = Typography;

type UploadStatus = 'idle' | 'requesting' | 'uploading' | 'saving' | 'success' | 'error';
type Visibility = 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';

export default function UploadPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [allowComments, setAllowComments] = useState(true);
  const [allowDownload, setAllowDownload] = useState(true);

  // Extracted metadata states
  const [duration, setDuration] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  // Upload progress / status states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);

  // Guard against unauthenticated users
  useEffect(() => {
    if (!user) {
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
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Result
          icon={<Spin size="large" />}
          title={t('upload.authRequired')}
          subTitle={t('upload.authDescription')}
        />
      </div>
    );
  }

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      appToast.error(new Error(t('upload.invalidFile')), t('upload.invalidFile'));
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      appToast.error(new Error(t('upload.tooLarge')), t('upload.tooLarge'));
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

  const handleUpload = async () => {
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

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile-videos', user.username] }),
        queryClient.invalidateQueries({ queryKey: ['videos'] }),
        queryClient.invalidateQueries({ queryKey: ['profile', user.username] }),
      ]);
      setUploadStatus('success');
      appToast.success(t('upload.success'));
      setTimeout(() => {
        navigate(`/@${user.username}`);
      }, 1500);

    } catch (err: unknown) {
      console.error('Lỗi tải video lên:', err);
      const errText = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : err instanceof Error
          ? err.message
          : t('upload.failed');
      const msg = Array.isArray(errText) ? errText.join(', ') : errText;
      setErrorMessage(msg);
      setUploadStatus('error');
      appToast.error(new Error(msg), t('upload.failed'));
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusLabel = () => {
    switch (uploadStatus) {
      case 'requesting': return t('upload.requesting');
      case 'uploading': return t('upload.uploading');
      case 'saving': return t('upload.saving');
      default: return '';
    }
  };

  const visibilityOptions = [
    { value: 'PUBLIC' as const, label: t('upload.public') },
    { value: 'FRIENDS_ONLY' as const, label: t('upload.friends') },
    { value: 'PRIVATE' as const, label: t('upload.private') },
  ];

  return (
    <div className="mx-auto min-h-[90vh] max-w-[1080px] px-0 py-0 sm:px-2 sm:py-5 lg:px-4 lg:py-8">
      <Card
        className="shadow-xl"
        styles={{ body: { padding: 'clamp(16px, 4vw, 32px)' } }}
      >
        {/* Header */}
        <div className="mb-6">
          <Title level={3} className="!mb-1">{t('upload.title')}</Title>
          <Text type="secondary">{t('upload.subtitle')}</Text>
        </div>

        {/* Status Alerts */}
        {uploadStatus === 'success' && (
          <Alert
            type="success"
            showIcon
            message={t('upload.success')}
            className="mb-6"
          />
        )}
        {uploadStatus === 'error' && errorMessage && (
          <Alert
            type="error"
            showIcon
            message={errorMessage}
            closable
            onClose={() => setErrorMessage('')}
            className="mb-6"
          />
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {/* ── LEFT: DROPZONE / PREVIEW ── */}
          <div className="md:col-span-1 flex flex-col items-center justify-start">
            {!previewUrl ? (
              <AntUpload.Dragger
                accept="video/*"
                showUploadList={false}
                beforeUpload={(uploadFile) => {
                  handleFileChange(uploadFile as unknown as File);
                  return false; // Prevent automatic upload
                }}
                className="!w-full !border-2"
                style={{ minHeight: 'min(400px, 58vh)', display: 'flex', alignItems: 'center' }}
              >
                <div className="flex flex-col items-center px-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <CloudUploadOutlined className="text-3xl text-gray-400" />
                  </div>
                  <p className="text-base font-bold text-text-primary mb-1">
                    {t('upload.choose')}
                  </p>
                  <p className="text-text-secondary text-xs mb-4">
                    {t('upload.drop')}
                  </p>
                  <div className="text-left text-xs text-text-secondary space-y-1 bg-gray-50 p-3 rounded-lg w-full max-w-[200px]">
                    <p>• {t('upload.format')}</p>
                    <p>• {t('upload.maxSize')}</p>
                    <p>• {t('upload.maxDuration')}</p>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    icon={<VideoCameraOutlined />}
                    className="mt-5"
                  >
                    {t('upload.chooseFile')}
                  </Button>
                </div>
              </AntUpload.Dragger>
            ) : (
              <div className="w-full flex flex-col items-center">
                {/* Phone-frame video preview */}
                <div className="relative w-full max-w-[260px] aspect-[9/16] bg-black rounded-3xl overflow-hidden border-[6px] border-gray-200 shadow-2xl flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={previewUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>

                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={isUploading}
                  onClick={handleReset}
                  className="mt-4"
                >
                  {t('upload.chooseAgain')}
                </Button>
              </div>
            )}
          </div>

          {/* ── RIGHT: METADATA FORM ── */}
          <div className="md:col-span-2 space-y-6">
            {/* Caption */}
            <div>
              <Text strong className="mb-2 block text-sm">
                {t('upload.caption')}
              </Text>
              <TextArea
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 150))}
                placeholder={t('upload.captionPlaceholder')}
                rows={3}
                maxLength={150}
                showCount
                disabled={isUploading}
              />
            </div>

            {/* Visibility */}
            <div>
              <Text strong className="mb-2 block text-sm">
                {t('upload.visibility')}
              </Text>
              <Select
                value={visibility}
                onChange={setVisibility}
                options={visibilityOptions}
                disabled={isUploading}
                size="large"
                className="w-full sm:w-60"
              />
            </div>

            {/* Permissions */}
            <div>
              <Text strong className="mb-3 block text-sm">
                {t('upload.permissions')}
              </Text>
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={allowComments}
                    onChange={setAllowComments}
                    disabled={isUploading}
                  />
                  <Text className="text-sm font-medium">{t('upload.comments')}</Text>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={allowDownload}
                    onChange={setAllowDownload}
                    disabled={isUploading}
                  />
                  <Text className="text-sm font-medium">{t('upload.download')}</Text>
                </div>
              </div>
            </div>

            {/* File Metadata */}
            {file && (
              <>
                <Divider className="!my-2" />
                <Descriptions
                  size="small"
                  column={{ xs: 1, sm: 3 }}
                  items={[
                    {
                      key: 'duration',
                      label: (
                        <span className="flex items-center gap-1">
                          <ClockCircleOutlined /> {t('upload.duration')}
                        </span>
                      ),
                      children: `${duration.toFixed(1)}s`,
                    },
                    {
                      key: 'dimensions',
                      label: (
                        <span className="flex items-center gap-1">
                          <ExpandOutlined /> {t('upload.dimensions')}
                        </span>
                      ),
                      children: `${width} × ${height}`,
                    },
                    {
                      key: 'size',
                      label: (
                        <span className="flex items-center gap-1">
                          <FileOutlined /> {t('upload.size')}
                        </span>
                      ),
                      children: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                    },
                  ]}
                />
              </>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="animate-fade-in">
                <div className="flex justify-between mb-1">
                  <Text strong className="text-xs">{getStatusLabel()}</Text>
                  <Text type="secondary" className="text-xs">{uploadProgress}%</Text>
                </div>
                <Progress
                  percent={uploadProgress}
                  showInfo={false}
                  strokeColor="#FE2C55"
                  size="small"
                />
              </div>
            )}

            {/* Action Buttons */}
            <Divider className="!my-2" />
            <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 -mx-4 flex flex-col-reverse gap-2 border-t border-divider bg-bg-primary/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:gap-4 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
              <Button
                size="large"
                block
                onClick={handleReset}
                disabled={isUploading || !file}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="primary"
                size="large"
                block
                loading={isUploading}
                disabled={!file}
                onClick={handleUpload}
              >
                {isUploading ? t('upload.processing') : t('common.post')}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
