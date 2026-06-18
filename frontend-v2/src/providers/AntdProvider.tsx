import { type ReactNode, useEffect } from 'react';
import { App as AntApp, ConfigProvider, theme as antTheme } from 'antd';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import { useLanguageStore } from '@/i18n';
import { useThemeStore } from '@/stores';
import { registerMessageApi } from '@/lib/toast';

function FeedbackBridge() {
  const { message } = AntApp.useApp();

  useEffect(() => registerMessageApi(message), [message]);
  return null;
}

export default function AntdProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  const language = useLanguageStore((state) => state.language);

  return (
    <ConfigProvider
      locale={language === 'vi' ? viVN : enUS}
      theme={{
        algorithm:
          theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#FE2C55',
          colorInfo: '#20D5EC',
          colorSuccess: '#0BE09B',
          borderRadius: 8,
          fontFamily:
            "'Inter', 'Proxima Nova', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        components: {
          Message: {
            contentBg: theme === 'dark' ? '#242424' : '#ffffff',
          },
          Modal: {
            contentBg: theme === 'dark' ? '#1f1f1f' : '#ffffff',
            headerBg: theme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
        },
      }}
    >
      <AntApp>
        <FeedbackBridge />
        {children}
      </AntApp>
    </ConfigProvider>
  );
}
