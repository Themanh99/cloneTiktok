import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { useAuthStore, useAuthModalStore } from '@/stores';
import Portal from './Portal';
import { useTranslation } from '@/i18n';

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 14L34 34M34 14L14 34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {open ? (
      <path d="M24 11C13.2 11 5.5 24 5.5 24C5.5 24 13.2 37 24 37C34.8 37 42.5 24 42.5 24C42.5 24 34.8 11 24 11ZM24 30C20.6863 30 18 27.3137 18 24C18 20.6863 20.6863 18 24 18C27.3137 18 30 20.6863 30 24C30 27.3137 27.3137 30 24 30Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    ) : (
      <path d="M12.7 12.7L35.3 35.3M24 11C13.2 11 5.5 24 5.5 24C5.5 24 13.2 37 24 37C34.8 37 42.5 24 42.5 24M28.3 19.7C27.3 18.6 25.7 18 24 18C20.7 18 18 20.7 18 24C18 25.7 18.6 27.3 19.7 28.3" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    )}
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M21.643 12.23c0-.68-.06-1.34-.17-1.97H12v3.74h5.4c-.23 1.22-.91 2.25-1.94 2.94v2.44h3.14c1.84-1.69 2.9-4.18 2.9-7.15z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.14-2.44c-.87.58-1.99.93-3.48.93-2.68 0-4.96-1.81-5.77-4.24H3.07v2.52C4.73 17.06 8.08 22 12 22z" />
    <path fill="#FBBC05" d="M6.23 13.81a6.01 6.01 0 0 1 0-3.62V7.67H3.07a10.01 10.01 0 0 0 0 8.66l3.16-2.52z" />
    <path fill="#EA4335" d="M12 6.1c1.47 0 2.78.5 3.82 1.5l2.87-2.87C16.96 3.06 14.7 2.2 12 2.2 8.08 2.2 4.73 7.14 3.07 10.37l3.16 2.52c.81-2.43 3.09-4.24 5.77-4.24z" />
  </svg>
);

export default function LoginModal() {
  const { isOpen, mode, closeModal, setMode } = useAuthModalStore();
  const { login, register, loginWithGoogle, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      clearError();
    }
  }, [isOpen, mode, clearError]);

  useEffect(() => {
    if (!isOpen || !googleClientId || !googleButtonRef.current) {
      return;
    }

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }: { credential: string }) => {
          setSubmitError('');
          try {
            await loginWithGoogle(credential);
            closeModal();
          } catch (err) {
            setSubmitError((err as Error).message);
          }
        },
      });

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        width: Math.min(360, googleButtonRef.current.clientWidth || 360),
        text: mode === 'login' ? 'continue_with' : 'signup_with',
      });
    };

    const scriptUrl = 'https://accounts.google.com/gsi/client';
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`);

    if (existingScript) {
      initializeGoogle();
      existingScript.addEventListener('load', initializeGoogle, { once: true });
      return () => existingScript.removeEventListener('load', initializeGoogle);
    }

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', initializeGoogle, { once: true });
    document.head.appendChild(script);
    return () => script.removeEventListener('load', initializeGoogle);
  }, [isOpen, googleClientId, mode, loginWithGoogle, closeModal]);

  if (!isOpen) return null;

  const isLogin = mode === 'login';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ email, password, username, displayName });
      }
      closeModal();
    } catch (err) {
      setSubmitError((err as Error).message);
    }
  };

  const displayError = submitError || error;

  return (
    <Portal>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
      {/* Background Mask */}
      <div className="absolute inset-0 cursor-pointer" onClick={closeModal} />

      {/* Modal Box */}
      <div className="relative w-full max-w-[480px] bg-bg-primary rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[calc(100dvh-24px)] sm:max-h-[90vh]">
        {/* Accent Top Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#25F4EE] via-primary to-[#FE2C55]" />

        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 p-1 rounded-full text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors cursor-pointer"
        >
          <CloseIcon />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-10 sm:py-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-text-primary mb-2">
              {isLogin ? t('auth.loginTitle') : t('auth.signupTitle')}
            </h2>
            <p className="text-sm text-text-secondary">
              {isLogin
                ? t('auth.loginDescription')
                : t('auth.signupDescription')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                    {t('auth.displayName')}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('auth.displayNamePlaceholder')}
                    required
                    className="w-full h-11 px-4 border border-border rounded bg-bg-secondary text-sm text-text-primary placeholder:text-text-placeholder focus:bg-bg-primary focus:border-text-primary outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                    {t('auth.username')}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    required
                    minLength={3}
                    pattern="[a-zA-Z0-9._]+"
                    className="w-full h-11 px-4 border border-border rounded bg-bg-secondary text-sm text-text-primary placeholder:text-text-placeholder focus:bg-bg-primary focus:border-text-primary outline-none transition-colors"
                  />
                  <p className="text-[11px] text-text-tertiary mt-1">{t('auth.usernameHint')}</p>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full h-11 px-4 border border-border rounded bg-bg-secondary text-sm text-text-primary placeholder:text-text-placeholder focus:bg-bg-primary focus:border-text-primary outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? t('auth.passwordPlaceholder') : t('auth.passwordCreatePlaceholder')}
                  required
                  minLength={isLogin ? 1 : 8}
                  className="w-full h-11 pl-4 pr-12 border border-border rounded bg-bg-secondary text-sm text-text-primary placeholder:text-text-placeholder focus:bg-bg-primary focus:border-text-primary outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {displayError && (
              <div className="p-3 rounded bg-primary-light border border-primary/20 text-xs text-primary font-medium leading-relaxed">
                {displayError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-bold rounded shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLogin ? (
                t('auth.login')
              ) : (
                t('auth.signup')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-divider" />
            <span className="flex-shrink mx-4 text-xs text-text-tertiary font-bold uppercase tracking-wider bg-bg-primary">
              {t('auth.orGoogle')}
            </span>
            <div className="flex-grow border-t border-divider" />
          </div>

          {/* Google SSO Render Area */}
          <div className="flex justify-center min-h-[44px]">
            {googleClientId ? (
              <div ref={googleButtonRef} className="w-full max-w-[360px]" />
            ) : (
              <button
                disabled
                className="w-full max-w-[360px] h-11 flex items-center justify-center gap-3 px-4 border border-border rounded text-text-tertiary text-sm font-semibold bg-bg-secondary cursor-not-allowed"
              >
                <GoogleIcon />
                <span>Google OAuth requires VITE_GOOGLE_CLIENT_ID</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Switch mode footer */}
        <div className="bg-bg-secondary border-t border-divider px-5 py-4 sm:px-10 flex items-center justify-center gap-2 text-sm text-text-primary font-medium">
          <span>{isLogin ? t('auth.switchSignup') : t('auth.switchLogin')}</span>
          <button
            onClick={() => setMode(isLogin ? 'signup' : 'login')}
            className="text-primary hover:underline font-bold cursor-pointer"
          >
            {isLogin ? t('auth.signup') : t('auth.login')}
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}
