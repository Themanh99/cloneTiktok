import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import {
  CameraOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Modal,
  Input,
  Select,
  Slider,
  Button,
  Avatar,
  Typography,
  Divider,
  DatePicker,
  Space,
} from 'antd';
import dayjs from 'dayjs';
import { z } from 'zod';
import { useAuthStore } from '@/stores';
import { useLanguageStore, useTranslation } from '@/i18n';
import * as http from '@/lib/http';
import { appToast } from '@/lib/toast';

const { Text } = Typography;
const { TextArea } = Input;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const profileSchema = z.object({
  displayName: z.string().trim().min(3).max(100),
  bio: z.string().trim().max(200),
  dob: z.string(),
  gender: z.number().int().min(0).max(2),
  languageCode: z.enum(['vi', 'en']),
});

type ProfileForm = z.infer<typeof profileSchema>;

const createCroppedAvatar = async (
  file: File,
  zoom: number,
  offsetX: number,
  offsetY: number,
) => {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = imageUrl;
    await image.decode();

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available');

    const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const scale = baseScale * zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const overflowX = Math.max(0, width - size);
    const overflowY = Math.max(0, height - size);
    const x = -overflowX / 2 - (offsetX * overflowX) / 2;
    const y = -overflowY / 2 - (offsetY * overflowY) / 2;

    context.drawImage(image, x, y, width, height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('Could not crop image'))),
        'image/webp',
        0.9,
      ),
    );
    return blob;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
};

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      dob: user?.dob ? user.dob.slice(0, 10) : '',
      gender: user?.gender ?? 0,
      languageCode: user?.language?.code ?? 'vi',
    },
  });

  const bioValue = watch('bio');

  useEffect(
    () => () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    },
    [avatarPreview],
  );

  const previewSource = useMemo(
    () => avatarPreview || user?.avatarUrl || '',
    [avatarPreview, user?.avatarUrl],
  );

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileForm) => {
      let avatarFileKey: string | undefined;
      if (avatarFile) {
        const croppedBlob = await createCroppedAvatar(avatarFile, zoom, offsetX, offsetY);
        const presigned = await http.get<{ uploadUrl: string; fileKey: string }>(
          '/users/me/avatar-presigned-url',
          { params: { contentType: 'image/webp' } },
        );
        await axios.put(presigned.uploadUrl, croppedBlob, {
          headers: { 'Content-Type': 'image/webp' },
        });
        avatarFileKey = presigned.fileKey;
      }

      return http.patch<NonNullable<typeof user>>('/users/me', {
        displayName: values.displayName,
        bio: values.bio,
        dob: values.dob || undefined,
        gender: values.gender,
        languageCode: values.languageCode,
        avatarFileKey,
      });
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setLanguage(updatedUser.language?.code ?? 'vi');
      queryClient.setQueryData(['profile', updatedUser.username], (current: object | undefined) => ({
        ...current,
        ...updatedUser,
      }));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
      queryClient.invalidateQueries({ queryKey: ['video-comments'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      appToast.success(t('profile.updateSuccess'));
      onClose();
    },
    onError: (requestError: unknown) => {
      appToast.error(requestError, t('profile.updateFailed'));
    },
  });

  if (!user) return null;

  const selectAvatar = (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      appToast.warning(t('profile.invalidImage'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      appToast.warning(t('profile.imageTooLarge'));
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const submitProfile = async (values: ProfileForm) => {
    try {
      await updateProfileMutation.mutateAsync(values);
    } catch {
      // The mutation onError handler displays the shared toast.
    }
  };

  const isSaving = updateProfileMutation.isPending || isSubmitting;

  const genderOptions = [
    { value: 0, label: t('profile.genderOther') },
    { value: 1, label: t('profile.genderMale') },
    { value: 2, label: t('profile.genderFemale') },
  ];

  const languageOptions = [
    { value: 'vi' as const, label: 'Tiếng Việt' },
    { value: 'en' as const, label: 'English' },
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={<span className="text-lg font-bold">{t('profile.edit')}</span>}
      width={620}
      centered
      destroyOnHidden
      mask={{ closable: !isSaving }}
      closable={!isSaving}
      footer={
        <div className="flex justify-end gap-3 pt-1">
          <Button size="large" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button
            type="primary"
            size="large"
            loading={isSaving}
            onClick={handleSubmit(submitProfile)}
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <form className="space-y-5 pt-2">
        {/* ── Avatar Section ── */}
        <section>
          <Text strong className="mb-3 block text-sm">
            {t('profile.avatar')}
          </Text>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* Avatar preview + click-to-select */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative mx-auto h-[120px] w-[120px] shrink-0 overflow-hidden rounded-full border-4 border-gray-100 bg-gray-50 shadow-inner sm:mx-0 cursor-pointer"
            >
              {previewSource ? (
                <img
                  src={previewSource}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{
                    transform: avatarFile
                      ? `translate(${offsetX * -18}%, ${offsetY * -18}%) scale(${zoom})`
                      : undefined,
                  }}
                />
              ) : (
                <Avatar size={112} icon={<UserOutlined />} className="h-full w-full" />
              )}
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/55 py-1.5 text-[11px] font-bold text-white">
                <CameraOutlined />
                {t('profile.chooseImage')}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => selectAvatar(event.target.files?.[0])}
            />

            {/* Crop sliders */}
            <div className={`flex-1 space-y-2 ${avatarFile ? '' : 'opacity-40 pointer-events-none'}`}>
              <div>
                <Text type="secondary" className="text-xs font-semibold">
                  {t('profile.zoom')}
                </Text>
                <Slider
                  min={1}
                  max={2.5}
                  step={0.05}
                  value={zoom}
                  onChange={setZoom}
                  tooltip={{ formatter: (v) => `${((v ?? 1) * 100).toFixed(0)}%` }}
                />
              </div>
              <div>
                <Text type="secondary" className="text-xs font-semibold">
                  {t('profile.horizontal')}
                </Text>
                <Slider
                  min={-1}
                  max={1}
                  step={0.05}
                  value={offsetX}
                  onChange={setOffsetX}
                />
              </div>
              <div>
                <Text type="secondary" className="text-xs font-semibold">
                  {t('profile.vertical')}
                </Text>
                <Slider
                  min={-1}
                  max={1}
                  step={0.05}
                  value={offsetY}
                  onChange={setOffsetY}
                />
              </div>
            </div>
          </div>
        </section>

        <Divider className="my-1" />

        {/* ── Display Name ── */}
        <div>
          <Text strong className="mb-1.5 block text-sm">
            {t('profile.displayName')}
          </Text>
          <Controller
            name="displayName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                size="large"
                maxLength={100}
                showCount
                status={errors.displayName ? 'error' : undefined}
                placeholder={t('profile.displayName')}
              />
            )}
          />
          {errors.displayName && (
            <Text type="danger" className="mt-1 block text-xs">
              {t('profile.requiredName')}
            </Text>
          )}
        </div>

        {/* ── Birthday + Gender row ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Text strong className="mb-1.5 block text-sm">
              {t('profile.birthday')}
            </Text>
            <Controller
              name="dob"
              control={control}
              render={({ field }) => (
                <DatePicker
                  size="large"
                  className="w-full"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                  format="DD/MM/YYYY"
                  placeholder="dd/mm/yyyy"
                  allowClear
                />
              )}
            />
          </div>
          <div>
            <Text strong className="mb-1.5 block text-sm">
              {t('profile.gender')}
            </Text>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  size="large"
                  className="w-full"
                  options={genderOptions}
                />
              )}
            />
          </div>
        </div>

        {/* ── Language ── */}
        <div>
          <Text strong className="mb-1.5 block text-sm">
            Language
          </Text>
          <Controller
            name="languageCode"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                size="large"
                className="w-full sm:w-60"
                options={languageOptions}
              />
            )}
          />
        </div>

        {/* ── Bio ── */}
        <div>
          <Text strong className="mb-1.5 block text-sm">
            {t('profile.bio')}
          </Text>
          <Controller
            name="bio"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                rows={4}
                maxLength={200}
                showCount
                placeholder={t('profile.bio')}
              />
            )}
          />
        </div>
      </form>
    </Modal>
  );
}
