import { useTranslation } from '@/i18n';

export default function LivePage() {
  const { t } = useTranslation();
  return (
    <div className="flex h-[calc(100vh-108px)] items-center justify-center">
      <div className="text-center animate-fade-in">
        <h1 className="mb-2 text-3xl font-bold text-text-primary">LIVE</h1>
        <p className="text-base text-text-secondary">{t('misc.liveSoon')}</p>
      </div>
    </div>
  );
}
