import { lazy, Suspense, useState, useEffect } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import Navbar from './sections/Navbar.jsx';
import Footer from './sections/Footer.jsx';
import PageTransition from './components/PageTransition.jsx';
import HomePage from './pages/HomePage.jsx';

const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const TracksPage = lazy(() => import('./pages/TracksPage.jsx'));
const SchedulePage = lazy(() => import('./pages/SchedulePage.jsx'));
const FaqPage = lazy(() => import('./pages/FaqPage.jsx'));
const AdminPortal = lazy(() => import('./pages/admin/AdminPortal.jsx'));

// Map hash to page id
function getPageFromHash() {
  const clean = window.location.hash.replace('#/', '').replace('#', '').trim().split('?')[0];
  if (['about', 'tracks', 'schedule', 'faq', 'admin'].includes(clean)) {
    return clean;
  }
  return 'home';
}

export default function App() {
  const [activePage, setActivePage] = useState(() => getPageFromHash());

  // Listen to hash changes (browser back/forward button)
  useEffect(() => {
    const handleHashChange = () => {
      const page = getPageFromHash();
      setActivePage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (pageId, path) => {
    setActivePage(pageId);
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        return <AdminPortal onBackToSite={() => handleNavigate('home', '#/')} />;
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
