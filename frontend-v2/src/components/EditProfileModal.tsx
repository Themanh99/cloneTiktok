import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { CameraOutlined, CloseOutlined } from '@ant-design/icons';
import { z } from 'zod';
import { useAuthStore } from '@/stores';
import { useLanguageStore, useTranslation } from '@/i18n';
import * as http from '@/lib/http';
import { appToast } from '@/lib/toast';
import Portal from './Portal';

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
    register,
    handleSubmit,
    control,
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
  const bio = useWatch({ control, name: 'bio' });

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

  if (!isOpen || !user) return null;

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

  return (
    <Portal>
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
        <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" />
        <div className="relative z-10 max-h-[92vh] w-full max-w-[640px] overflow-y-auto rounded-2xl border border-border bg-bg-primary shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-divider bg-bg-primary px-6 py-4">
            <h2 className="text-xl font-bold text-text-primary">{t('profile.edit')}</h2>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-bg-hover" aria-label="Close">
              <CloseOutlined className="text-lg" />
            </button>
          </div>

          <form onSubmit={handleSubmit(submitProfile)} className="space-y-6 p-6">
            <section>
              <label className="mb-3 block text-sm font-bold">{t('profile.avatar')}</label>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-36 w-36 shrink-0 overflow-hidden rounded-full border-4 border-bg-secondary bg-bg-tertiary shadow-inner"
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
                    <span className="flex h-full items-center justify-center text-4xl font-bold">
                      {user.username[0].toUpperCase()}
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 py-2 text-xs font-bold text-white">
                    <span className="flex items-center justify-center gap-1.5">
                      <CameraOutlined />
                      {t('profile.chooseImage')}
                    </span>
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => selectAvatar(event.target.files?.[0])}
                />

                <div className={`flex-1 space-y-3 ${avatarFile ? '' : 'opacity-50'}`}>
                  {[
                    [t('profile.zoom'), zoom, 1, 2.5, 0.05, setZoom],
                    [t('profile.horizontal'), offsetX, -1, 1, 0.05, setOffsetX],
                    [t('profile.vertical'), offsetY, -1, 1, 0.05, setOffsetY],
                  ].map(([label, value, min, max, step, setter]) => (
                    <label key={String(label)} className="block text-xs font-semibold text-text-secondary">
                      {String(label)}
                      <input
                        type="range"
                        disabled={!avatarFile}
                        min={Number(min)}
                        max={Number(max)}
                        step={Number(step)}
                        value={Number(value)}
                        onChange={(event) => (setter as (value: number) => void)(Number(event.target.value))}
                        className="mt-1 block w-full accent-primary"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold">{t('profile.displayName')}</span>
                <input {...register('displayName')} maxLength={100} className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-3 outline-none focus:border-primary" />
                {errors.displayName && <span className="mt-1 block text-xs text-error">{t('profile.requiredName')}</span>}
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-semibold">{t('profile.birthday')}</span>
                <input type="date" {...register('dob')} className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-3 outline-none focus:border-primary" />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-semibold">{t('profile.gender')}</span>
                <select {...register('gender', { valueAsNumber: true })} className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-3 outline-none focus:border-primary">
                  <option value={0}>{t('profile.genderOther')}</option>
                  <option value={1}>{t('profile.genderMale')}</option>
                  <option value={2}>{t('profile.genderFemale')}</option>
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-semibold">Language</span>
                <select {...register('languageCode')} className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-3 outline-none focus:border-primary">
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold">{t('profile.bio')}</span>
                <textarea {...register('bio')} maxLength={200} rows={4} className="w-full resize-none rounded-lg border border-border bg-bg-secondary px-4 py-3 outline-none focus:border-primary" />
                <span className="block text-right text-xs text-text-tertiary">{bio.length}/200</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-divider pt-5">
              <button type="button" onClick={onClose} className="rounded-lg border border-border px-5 py-2.5 font-semibold hover:bg-bg-hover">{t('common.cancel')}</button>
              <button type="submit" disabled={updateProfileMutation.isPending || isSubmitting} className="rounded-lg bg-primary px-6 py-2.5 font-bold text-white hover:bg-primary-hover disabled:opacity-50">
                {updateProfileMutation.isPending || isSubmitting ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
