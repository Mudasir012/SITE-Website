import { lazy, Suspense, useState, useEffect } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import Navbar from './sections/Navbar.jsx';
import Footer from './sections/Footer.jsx';
import PageTransition from './components/PageTransition.jsx';
import HomePage from './pages/HomePage.jsx';

const pageLoaders = {
  about: () => import('./pages/AboutPage.jsx'),
  tracks: () => import('./pages/TracksPage.jsx'),
  schedule: () => import('./pages/SchedulePage.jsx'),
  faq: () => import('./pages/FaqPage.jsx'),
  admin: () => import('./pages/admin/AdminPortal.jsx'),
};

const AboutPage = lazy(pageLoaders.about);
const TracksPage = lazy(pageLoaders.tracks);
const SchedulePage = lazy(pageLoaders.schedule);
const FaqPage = lazy(pageLoaders.faq);
const AdminPortal = lazy(pageLoaders.admin);

export function prefetchPage(pageId) {
  const loader = pageLoaders[pageId];
  if (loader) loader();
}

const ROUTES = ['about', 'tracks', 'schedule', 'faq', 'admin'];

// Map a clean URL path to a page id, with support for a deployed base path.
function getPageFromPath() {
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  let path = window.location.pathname;

  if (basePath && path.startsWith(basePath)) {
    path = path.slice(basePath.length);
  }

  const clean = path.replace(/^\/+/, '').split('/')[0].replace(/\.html$/, '');
  return ROUTES.includes(clean) ? clean : 'home';
}

export default function App() {
  const [activePage, setActivePage] = useState(() => getPageFromPath());

  // Follow browser back/forward navigation.
  useEffect(() => {
    const handlePopState = () => {
      setActivePage(getPageFromPath());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Prefetch public route chunks once the browser is idle so navigation feels instant.
  useEffect(() => {
    const publicRoutes = ['about', 'tracks', 'schedule', 'faq'];
    const prefetchAll = () => publicRoutes.forEach(prefetchPage);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetchAll, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(prefetchAll, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = (pageId) => {
    const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const nextPath = pageId === 'home' ? `${basePath}/` : `${basePath}/${pageId}`;

    if (window.location.pathname !== nextPath) {
      window.history.pushState({ page: pageId }, '', nextPath);
    }

    setActivePage(pageId);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const isAdmin = activePage === 'admin';

  const renderPage = () => {
    switch (activePage) {
      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;
      case 'tracks':
        return <TracksPage onNavigate={handleNavigate} />;
      case 'schedule':
        return <SchedulePage onNavigate={handleNavigate} />;
      case 'faq':
        return <FaqPage onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminPortal onBackToSite={() => handleNavigate('home', '/')} />;
      case 'home':
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-arcade-ink text-arcade-bone flex flex-col justify-between selection:bg-arcade-lime selection:text-arcade-ink">
        {!isAdmin && <Navbar activePage={activePage} onNavigate={handleNavigate} />}
        <main className="flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={activePage}>
              <Suspense fallback={<div className="min-h-[100vh] flex items-center justify-center font-mono text-xs text-ivory/50" aria-busy="true">Loading CITE...</div>}>
                {renderPage()}
              </Suspense>
            </PageTransition>
          </AnimatePresence>
        </main>
        {!isAdmin && <Footer onNavigate={handleNavigate} />}
      </div>
    </MotionConfig>
  );
}
