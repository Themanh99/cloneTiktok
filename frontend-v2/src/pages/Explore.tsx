import { useTranslation } from '@/i18n';

export default function ExplorePage() {
  const { t } = useTranslation();
  return (
    <div className="flex h-[calc(100vh-108px)] items-center justify-center">
      <div className="text-center animate-fade-in">
        <h1 className="mb-2 text-3xl font-bold text-text-primary">{t('sidebar.explore')}</h1>
        <p className="text-base text-text-secondary">{t('misc.comingSoon')}</p>
      </div>
    </div>
  );
}
