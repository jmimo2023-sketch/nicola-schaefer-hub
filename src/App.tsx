/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Home,
  Sparkles,
  Palette,
  Film,
  Calendar,
  TrendingUp,
  Image as ImageIcon,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  BarChart3,
  FolderOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { cn } from './lib/utils';
import { TranslationProvider, useTranslation } from './lib/TranslationContext';
import { useFirebase } from './lib/FirebaseProvider';
import { signIn, signOut, db, handleFirestoreError, OperationType, currentAccessToken } from './services/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { initGoogleLibraries } from './services/googleAssetsService';

// Core modules (consolidated from 19 → 8)
import { HomePanel } from './panels/HomePanel';
import { ContentStudioPanel } from './panels/ContentStudioPanel';
import { DesignEditorPanel } from './panels/DesignEditorPanel';
import { VideoStudioPanel } from './panels/VideoStudioPanel';
import { CalendarPanel } from './panels/CalendarPanel';
import { AnalyticsPanel } from './panels/AnalyticsPanel';
import { AssetLibraryPanel } from './panels/AssetLibraryPanel';
import { SettingsPanel } from './panels/SettingsPanel';

import { OnboardingWizard } from './components/OnboardingWizard';
import { ErrorBoundary } from './components/ErrorBoundary';

// Tab type
type TabId = 'home' | 'content' | 'design' | 'video' | 'calendar' | 'analytics' | 'assets' | 'settings';

const NAV_ITEMS: { id: TabId; labelKey: string; icon: React.ReactNode; badge?: string; fullWidth?: boolean }[] = [
  { id: 'home', labelKey: 'navHome', icon: <Home size={18} /> },
  { id: 'content', labelKey: 'navContent', icon: <Sparkles size={18} />, badge: 'AI' },
  { id: 'design', labelKey: 'navDesign', icon: <Palette size={18} />, badge: 'NEW' },
  { id: 'video', labelKey: 'navVideo', icon: <Film size={18} />, badge: 'NEW' },
  { id: 'calendar', labelKey: 'navCalendar', icon: <Calendar size={18} /> },
  { id: 'analytics', labelKey: 'navAnalytics', icon: <BarChart3 size={18} /> },
  { id: 'assets', labelKey: 'navAssets', icon: <FolderOpen size={18} /> },
  { id: 'settings', labelKey: 'navSettings', icon: <Settings size={18} /> },
];

// Panels that use full-width (no padding)
const FULLSCREEN_PANELS: TabId[] = ['design', 'video'];

export default function App() {
  const { user, loading } = useFirebase();

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <MainApp />;
}

function MainApp() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, setLang, t } = useTranslation();
  const { user } = useFirebase();

  useEffect(() => {
    initGoogleLibraries().catch(err => console.error('Failed to init Google libs:', err));
  }, []);

  useEffect(() => {
    if (!user) return;

    const qPosts = query(
      collection(db, 'posts'),
      where('authorId', '==', user.uid),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(qPosts, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setScheduledPosts(posts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, [user]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const isFullscreen = FULLSCREEN_PANELS.includes(activeTab);

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <motion.div
        key={theme}
        initial={{ filter: 'blur(20px)', opacity: 0.9 }}
        animate={{ filter: 'blur(0px)', opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col md:flex-row min-h-screen bg-paper text-ink overflow-hidden"
      >
        {/* Sidebar - Desktop */}
        <aside className={cn(
          "bg-card border border-brd flex-col z-20 m-2 md:m-4 rounded-2xl lg:rounded-3xl shadow-custom",
          isFullscreen ? "hidden" : "hidden md:flex w-full md:w-64 lg:w-72"
        )}>
          <SidebarContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            theme={theme}
            toggleTheme={toggleTheme}
            lang={lang}
            setLang={setLang}
          />
        </aside>

        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-brd z-30 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center font-bold text-sm text-white">N</div>
            <span className="font-bold text-sm">{t('appTitle')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-10 h-10 rounded-full border border-brd bg-paper flex items-center justify-center">
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-10 h-10 rounded-full border border-brd bg-paper flex items-center justify-center">
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/80 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card border-l border-brd z-50 overflow-y-auto"
            >
              <div className="p-4 border-b border-brd flex items-center justify-between">
                <span className="font-bold">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-brd rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <nav className="p-3 space-y-1">
                {NAV_ITEMS.map(item => (
                  <NavButton
                    key={item.id}
                    active={activeTab === item.id}
                    onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                    icon={item.icon}
                    label={t(item.labelKey)}
                    badge={item.badge}
                  />
                ))}
              </nav>
              <div className="p-4 border-t border-brd">
                <div className="flex items-center gap-3 p-3 bg-paper border border-brd rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">NS</div>
                  <div className="flex flex-col">
                    <p className="text-xs font-bold truncate">{user?.displayName || 'Nicola Schaefer'}</p>
                    <button onClick={() => signOut()} className="text-[9px] text-ink-muted font-mono font-bold uppercase hover:text-rose-500">
                      LOGOUT
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Bottom Navigation - Mobile */}
        <nav className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-brd z-30 flex items-center justify-around px-2 pb-safe",
          isFullscreen ? "hidden" : ""
        )}>
          <MobileNavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={20} />} label="Home" />
          <MobileNavButton active={activeTab === 'content'} onClick={() => setActiveTab('content')} icon={<Sparkles size={20} />} label="Create" />
          <MobileNavButton active={activeTab === 'design'} onClick={() => setActiveTab('design')} icon={<Palette size={20} />} label="Design" />
          <MobileNavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<Calendar size={20} />} label="Plan" />
          <MobileNavButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 size={20} />} label="Stats" />
        </nav>

        {/* Main Content Area */}
        <main className={cn(
          "flex-1 flex flex-col overflow-hidden",
          isFullscreen ? "m-0 p-0" : "m-2 md:m-4 ml-0 md:ml-0 pt-14 md:pt-0 pb-20 md:pb-0"
        )}>
          {/* Desktop Top bar (hidden on fullscreen panels) */}
          {!isFullscreen && (
            <header className="hidden md:flex h-14 lg:h-16 items-center justify-between px-4 lg:px-8 bg-card border border-brd rounded-2xl lg:rounded-3xl mb-3 lg:mb-4 shadow-custom">
              <div className="flex items-center gap-4">
                <h2 className="text-xs lg:text-sm font-bold uppercase tracking-widest text-ink-muted font-mono opacity-80">
                  {t(activeTab + 'Title').toUpperCase()}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-paper border border-brd rounded-full overflow-hidden p-1">
                  <button
                    onClick={() => setLang('es')}
                    className={cn("px-3 lg:px-4 py-1.5 text-[10px] font-bold rounded-full transition-all", lang === 'es' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-ink-muted hover:text-ink")}
                  >ES</button>
                  <button
                    onClick={() => setLang('de')}
                    className={cn("px-3 lg:px-4 py-1.5 text-[10px] font-bold rounded-full transition-all", lang === 'de' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-ink-muted hover:text-ink")}
                  >DE</button>
                </div>
              </div>
            </header>
          )}

          {/* Panel Container */}
          <div className={cn(
            "flex-1 overflow-y-auto",
            isFullscreen ? "p-0" : "p-3 md:p-6 lg:p-8 xl:p-10"
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-7xl mx-auto"
              >
                {activeTab === 'home' && <ErrorBoundary><HomePanel onNavigate={(tab: string) => setActiveTab(tab as TabId)} /></ErrorBoundary>}
                {activeTab === 'content' && <ErrorBoundary><ContentStudioPanel /></ErrorBoundary>}
                {activeTab === 'design' && <ErrorBoundary><DesignEditorPanel /></ErrorBoundary>}
                {activeTab === 'video' && <ErrorBoundary><VideoStudioPanel /></ErrorBoundary>}
                {activeTab === 'calendar' && <ErrorBoundary><CalendarPanel /></ErrorBoundary>}
                {activeTab === 'analytics' && <ErrorBoundary><AnalyticsPanel /></ErrorBoundary>}
                {activeTab === 'assets' && <ErrorBoundary><AssetLibraryPanel /></ErrorBoundary>}
                {activeTab === 'settings' && <ErrorBoundary><SettingsPanel /></ErrorBoundary>}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </motion.div>
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// Navigation components
function NavButton({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
        active
          ? "bg-accent text-white shadow-lg shadow-accent/20"
          : "text-ink-muted hover:bg-paper hover:text-ink"
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className={cn(
          "text-[8px] font-bold px-2 py-0.5 rounded-full",
          active ? "bg-white/20 text-white" : "bg-accent/10 text-accent"
        )}>{badge}</span>
      )}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all",
        active ? "text-accent" : "text-ink-muted"
      )}
    >
      {icon}
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  );
}

function SidebarContent({ activeTab, setActiveTab, user, theme, toggleTheme, lang, setLang }: { activeTab: TabId; setActiveTab: (tab: TabId) => void; user: any; theme: string; toggleTheme: () => void; lang: string; setLang: (lang: any) => void }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="p-4 lg:p-6 flex items-center gap-4">
        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-accent rounded-2xl flex items-center justify-center font-bold text-lg lg:text-xl text-white shadow-lg shadow-accent/20">N</div>
        <div>
          <h1 className="font-sans text-base lg:text-lg font-bold tracking-tight">{t('appTitle')}</h1>
          <p className="text-[9px] lg:text-[10px] text-ink-muted uppercase tracking-widest font-bold font-mono">Creator Hub</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavButton
            key={item.id}
            active={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
            icon={item.icon}
            label={t(item.labelKey)}
            badge={item.badge}
          />
        ))}
      </nav>

      <div className="p-3 lg:p-4 bg-transparent mt-auto">
        <div className="flex items-center gap-3 p-3 bg-paper border border-brd rounded-xl lg:rounded-2xl">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">NS</div>
          <div className="flex flex-col">
            <p className="text-xs font-bold truncate">{user?.displayName || 'Nicola Schaefer'}</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-custom rounded-full animate-pulse shadow-[0_0_8px_#467a49]"></div>
              <button
                onClick={() => signOut()}
                className="text-[9px] text-ink-muted font-mono font-bold uppercase tracking-tighter hover:text-rose-500"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between px-3">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-1 h-1 rounded-full", currentAccessToken ? "bg-green-custom shadow-[0_0_4px_#467a49]" : "bg-ink-muted/30")}></div>
            <span className="text-[7px] font-mono font-bold uppercase tracking-widest opacity-40">Google</span>
          </div>
          <span className="text-[7px] font-mono font-bold uppercase tracking-widest text-accent">{currentAccessToken ? 'SYNCED' : 'OFFLINE'}</span>
        </div>
      </div>
    </>
  );
}