import { lazy, Suspense, useState, useEffect } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import Navbar from './sections/Navbar.jsx';
import Footer from './sections/Footer.jsx';
import PageTransition from './components/PageTransition.jsx';
import HomePage from './pages/HomePage.jsx';

const pageLoaders = {
  about: () => import('./pages/AboutPage.jsx'),
  tracks: () => import('./pages/TracksPage.jsx'),
  event: () => import('./pages/EventDetailPage.jsx'),
  schedule: () => import('./pages/SchedulePage.jsx'),
  faq: () => import('./pages/FaqPage.jsx'),
  admin: () => import('./pages/admin/AdminPortal.jsx'),
  ambassador: () => import('./pages/ambassador/AmbassadorPortal.jsx'),
  ambassadorSetup: () => import('./pages/ambassador/AmbassadorSetup.jsx'),
};

const AboutPage = lazy(pageLoaders.about);
const TracksPage = lazy(pageLoaders.tracks);
const EventDetailPage = lazy(pageLoaders.event);
const SchedulePage = lazy(pageLoaders.schedule);
const FaqPage = lazy(pageLoaders.faq);
const AdminPortal = lazy(pageLoaders.admin);
const AmbassadorPortal = lazy(pageLoaders.ambassador);
const AmbassadorSetup = lazy(pageLoaders.ambassadorSetup);

export function prefetchPage(pageId) {
  const loader = pageLoaders[pageId];
  if (loader) loader();
}

const ROUTES = ['about', 'tracks', 'schedule', 'faq', 'admin', 'ambassador', 'ambassadorSetup'];

// Map a clean URL path to a page id (and optional event slug), with support for a deployed base path.
function getRouteFromPath() {
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  let path = window.location.pathname;

  if (basePath && path.startsWith(basePath)) {
    path = path.slice(basePath.length);
  }

  const segments = path.replace(/^\/+/, '').split('/').filter(Boolean);
  const first = (segments[0] || '').replace(/\.html$/, '');

  if (first === 'tracks' && segments[1]) {
    return { page: 'event', eventSlug: decodeURIComponent(segments[1]) };
  }

  if (first === 'ambassador' && segments[1] === 'setup') {
    return { page: 'ambassadorSetup', eventSlug: '' };
  }

  return { page: ROUTES.includes(first) ? first : 'home', eventSlug: '' };
}

export default function App() {
  const [route, setRoute] = useState(() => getRouteFromPath());
  const activePage = route.page;

  // Follow browser back/forward navigation.
  useEffect(() => {
    const handlePopState = () => {
      setRoute(getRouteFromPath());
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Prefetch public route chunks once the browser is idle so navigation feels instant.
  useEffect(() => {
    const publicRoutes = ['about', 'tracks', 'event', 'schedule', 'faq'];
    const prefetchAll = () => publicRoutes.forEach(prefetchPage);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetchAll, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(prefetchAll, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = (pageId, customPath) => {
    const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const target = customPath
      ? `${basePath}${customPath.startsWith('/') ? customPath : `/${customPath}`}`
      : pageId === 'home'
        ? `${basePath}/`
        : `${basePath}/${pageId}`;

    if (window.location.pathname !== target) {
      window.history.pushState({ page: pageId }, '', target);
    }

    if (pageId === 'event' && customPath) {
      const slug = customPath.split('/').filter(Boolean)[1] || '';
      setRoute({ page: 'event', eventSlug: slug });
    } else {
      setRoute({ page: pageId, eventSlug: '' });
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const isAdmin = activePage === 'admin';
  const isBareShell =
    isAdmin || activePage === 'ambassador' || activePage === 'ambassadorSetup';

  const renderPage = () => {
    switch (activePage) {
      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;
      case 'tracks':
        return <TracksPage onNavigate={handleNavigate} />;
      case 'event':
        return <EventDetailPage slug={route.eventSlug} onNavigate={handleNavigate} />;
      case 'schedule':
        return <SchedulePage onNavigate={handleNavigate} />;
      case 'faq':
        return <FaqPage onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminPortal onBackToSite={() => handleNavigate('home', '/')} />;
      case 'ambassador':
        return (
          <AmbassadorPortal
            onBackToSite={() => handleNavigate('home', '/')}
            onNavigate={handleNavigate}
          />
        );
      case 'ambassadorSetup':
        return (
          <AmbassadorSetup
            onBackToSite={() => handleNavigate('home', '/')}
            onGoToPortal={() => handleNavigate('ambassador', '/ambassador')}
            onComplete={() => handleNavigate('ambassador', '/ambassador')}
          />
        );
      case 'home':
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-arcade-ink text-arcade-bone flex flex-col justify-between selection:bg-arcade-lime selection:text-arcade-ink">
        {!isBareShell && <Navbar activePage={activePage === 'event' ? 'tracks' : activePage} onNavigate={handleNavigate} />}
        <main className="flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={activePage === 'event' ? `event-${route.eventSlug}` : activePage}>
              <Suspense fallback={<div className="min-h-[100vh] flex items-center justify-center font-mono text-xs text-ivory/50" aria-busy="true">Loading CITE...</div>}>
                {renderPage()}
              </Suspense>
            </PageTransition>
          </AnimatePresence>
        </main>
        {!isBareShell && <Footer onNavigate={handleNavigate} />}
      </div>
    </MotionConfig>
  );
}
