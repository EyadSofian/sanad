import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, useLocale } from './lib/auth.jsx';
import { t } from './lib/i18n.js';
import DisclosureBanner from './components/DisclosureBanner.jsx';
import FirstRunModal from './components/FirstRunModal.jsx';
import { LoginPage, SignupPage } from './pages/AuthPages.jsx';
import ChatPage from './pages/ChatPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="flex h-full items-center justify-center text-sm text-slate-500">…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  const locale = useLocale();

  // Full RTL when Arabic (spec Section 11)
  useEffect(() => {
    const effective = user ? locale : localStorage.getItem('sanad_locale_guest') || 'ar';
    document.documentElement.dir = effective === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = effective;
    document.title = effective === 'ar' ? 'سند — Sanad' : 'Sanad — سند';
  }, [user, locale]);

  return (
    <div className="flex h-full flex-col">
      <DisclosureBanner locale={locale} />
      {user && <FirstRunModal locale={locale} />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <Protected>
              <ChatPage />
            </Protected>
          }
        />
        <Route
          path="/settings"
          element={
            <Protected>
              <SettingsPage />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <span className="sr-only">{t(locale, 'disclosureBanner')}</span>
    </div>
  );
}
