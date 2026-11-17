import { lazy, Suspense, useState, useEffect } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import Dock from './sections/Dock.jsx';
import Footer from './sections/Footer.jsx';
import PageTransition from './components/PageTransition.jsx';
import HomePage from './pages/HomePage.jsx';

const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const TracksPage = lazy(() => import('./pages/TracksPage.jsx'));
const PrizesPage = lazy(() => import('./pages/PrizesPage.jsx'));
const SchedulePage = lazy(() => import('./pages/SchedulePage.jsx'));
const JudgesPage = lazy(() => import('./pages/JudgesPage.jsx'));
const SponsorsPage = lazy(() => import('./pages/SponsorsPage.jsx'));
const FaqPage = lazy(() => import('./pages/FaqPage.jsx'));

// Map hash to page id
function getPageFromHash() {
  const hash = window.location.hash.replace('#/', '').replace('#', '').trim();
  if (['about', 'tracks', 'prizes', 'schedule', 'judges', 'sponsors', 'faq'].includes(hash)) {
    return hash;
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

  const renderPage = () => {
    switch (activePage) {
      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;
      case 'tracks':
        return <TracksPage onNavigate={handleNavigate} />;
      case 'prizes':
        return <PrizesPage onNavigate={handleNavigate} />;
      case 'schedule':
        return <SchedulePage onNavigate={handleNavigate} />;
      case 'judges':
        return <JudgesPage onNavigate={handleNavigate} />;
      case 'sponsors':
        return <SponsorsPage onNavigate={handleNavigate} />;
      case 'faq':
        return <FaqPage onNavigate={handleNavigate} />;
      case 'home':
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-navy-900 text-ivory flex flex-col justify-between selection:bg-navy-500 selection:text-white">
        <main className="flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={activePage}>
              <Suspense fallback={<div className="min-h-[200vh]" aria-busy="true" />}>
                {renderPage()}
              </Suspense>
            </PageTransition>
          </AnimatePresence>
        </main>
        <Footer onNavigate={handleNavigate} />
        <Dock activePage={activePage} setActivePage={setActivePage} />
      </div>
    </MotionConfig>
  );
}
