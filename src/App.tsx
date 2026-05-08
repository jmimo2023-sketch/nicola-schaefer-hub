/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Calendar,
  PenTool,
  TrendingUp,
  Globe,
  Moon,
  Sun,
  Palette,
  Image as ImageIcon,
  Settings,
  Menu,
  X,
  BarChart3,
  Home,
  Sparkles,
  Film,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  PlusCircle,
  Brain,
  Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { cn } from './lib/utils';
import { TranslationProvider, useTranslation } from './lib/TranslationContext';
import { DATA } from './constants';
import { useFirebase } from './lib/FirebaseProvider';
import { signIn, signOut, db, handleFirestoreError, OperationType, currentAccessToken } from './services/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { initGoogleLibraries } from './services/googleAssetsService';
import { ConnectionsPanel } from './panels/ConnectionsPanel';
import { CalendarPanel } from './panels/CalendarPanel';
import { HomePanel } from './panels/HomePanel';
import { GeneratorPanel } from './panels/GeneratorPanel';
import { DesignStudioPanel } from './panels/DesignStudioPanel';
import { AIStudioPanel } from './panels/AIStudioPanel';
import { OnboardingWizard } from './components/OnboardingWizard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardPanel } from './panels/DashboardPanel';
import { BackgroundGenerator } from './panels/BackgroundGenerator';
import { ShamanicTemplateEngine } from './panels/ShamanicTemplateEngine';
import { VideoStudioPanel } from './panels/VideoStudioPanel';
import { StrategyInsightsPanel } from './panels/StrategyInsightsPanel';
import { NavItem, BottomNavItem } from './components/SharedComponents';
import { AssetLibraryPanel } from './panels/AssetLibraryPanel';

// ─── Section / Sub-tab type definitions ───────────────────────────────────────

type Section = 'home' | 'create' | 'plan' | 'insights' | 'ai-lab' | 'settings';

interface SubTabDef {
  id: string;
  label: string;
  badge?: string;
}

const SECTION_SUBTABS: Record<string, SubTabDef[]> = {
  create: [
    { id: 'generator', label: 'Generator', badge: 'AI' },
    { id: 'design', label: 'Design Studio', badge: 'NEW' },
    { id: 'video', label: 'Video Studio', badge: 'PRO' },
    { id: 'assets', label: 'Assets', badge: 'NEW' },
  ],
  insights: [
    { id: 'analytics', label: 'Analytics' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'dach', label: 'DACH' },
  ],
  'ai-lab': [
    { id: 'ai-studio', label: 'AI Studio', badge: 'NEW' },
    { id: 'generator-bg', label: 'Background Gen', badge: 'NEW' },
    { id: 'shamanic', label: 'Shamanic', badge: '🔮' },
  ],
};

// Panels that render fullscreen (no padding/margin)
const FULLSCREEN_PANELS = new Set([
  'design', 'ai-studio', 'generator-bg', 'shamanic', 'video',
]);

// ─── App Root ─────────────────────────────────────────────────────────────────

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

// ─── MainApp ──────────────────────────────────────────────────────────────────

function MainApp() {
  // ── Navigation state ──
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [createTab, setCreateTab] = useState('generator');
  const [insightsTab, setInsightsTab] = useState('analytics');
  const [aiLabTab, setAiLabTab] = useState('ai-studio');

  // ── UI state ──
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Initialize theme from localStorage or default to 'light'
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nicola-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      // Set initial theme on document
      document.documentElement.setAttribute('data-theme', 'light');
    }
    return 'light';
  });
  const [scheduledPosts, setScheduledPosts] = useState<{ id: string; date: string; type: string; content: string; status: string }[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState<Record<string, boolean>>({
    create: true,
    insights: true,
    'ai-lab': true,
  });

  const { lang, setLang, t } = useTranslation();
  const { user } = useFirebase();

  // ── Derived: active sub-tab per section ──
  const sectionSubTabMap: Record<Section, string> = useMemo(() => ({
    home: 'home',
    create: createTab,
    plan: 'calendar',
    insights: insightsTab,
    'ai-lab': aiLabTab,
    settings: 'connections',
  }), [createTab, insightsTab, aiLabTab]);

  const activeSubTab = sectionSubTabMap[activeSection];

  // ── Theme initialization ──
  useEffect(() => {
    const saved = localStorage.getItem('nicola-theme');
    const initial = saved || 'light';
    document.documentElement.setAttribute('data-theme', initial);
    if (saved && saved !== theme) setTheme(saved as 'light' | 'dark');
  }, []);

  // ── Google / Firestore init ──
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

  // ── Theme toggle ──
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('nicola-theme', newTheme);
  };

  // ── Navigation helpers ──
  const navigateToSection = (section: Section) => {
    setActiveSection(section);
  };

  const navigateToSubTab = (section: Section, subTabId: string) => {
    // Update the section's active sub-tab
    if (section === 'create') setCreateTab(subTabId);
    else if (section === 'insights') setInsightsTab(subTabId);
    else if (section === 'ai-lab') setAiLabTab(subTabId);

    // Also switch to that section if not already there
    if (activeSection !== section) {
      setActiveSection(section);
    }
  };

  const toggleSidebarSection = (section: string) => {
    setSidebarExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ── Render active panel ──
  const renderPanel = () => {
    switch (activeSection) {
      case 'home':
        return <ErrorBoundary><HomePanel onNavigate={(tab: string) => {
          // Map old tab IDs to new nav structure
          if (['generator', 'design', 'video'].includes(tab)) { navigateToSubTab('create', tab); }
          else if (['analytics', 'strategy', 'dach'].includes(tab)) { navigateToSubTab('insights', tab); }
          else if (['ai-studio', 'generator-bg', 'shamanic'].includes(tab)) { navigateToSubTab('ai-lab', tab); }
          else if (tab === 'calendar') { navigateToSection('plan'); }
          else if (tab === 'connections') { navigateToSection('settings'); }
        }} /></ErrorBoundary>;

      case 'create':
        switch (createTab) {
          case 'generator':
            return <ErrorBoundary><GeneratorPanel onNavigate={(tab: string) => navigateToSubTab('create', tab)} /></ErrorBoundary>;
          case 'design':
            return <ErrorBoundary><DesignStudioPanel /></ErrorBoundary>;
          case 'video':
            return <ErrorBoundary><VideoStudioPanel /></ErrorBoundary>;
          case 'assets':
            return <ErrorBoundary><AssetLibraryPanel /></ErrorBoundary>;
          default:
            return <ErrorBoundary><GeneratorPanel onNavigate={(tab: string) => navigateToSubTab('create', tab)} /></ErrorBoundary>;
        }

      case 'plan':
        return <ErrorBoundary><CalendarPanel /></ErrorBoundary>;

      case 'insights':
        switch (insightsTab) {
          case 'analytics':
            return <ErrorBoundary><DashboardPanel /></ErrorBoundary>;
          case 'strategy':
            return <ErrorBoundary><StrategyInsightsPanel /></ErrorBoundary>;
          case 'dach':
            return <ErrorBoundary><StrategyInsightsPanel /></ErrorBoundary>;
          default:
            return <ErrorBoundary><DashboardPanel /></ErrorBoundary>;
        }

      case 'ai-lab':
        switch (aiLabTab) {
          case 'ai-studio':
            return <ErrorBoundary><AIStudioPanel /></ErrorBoundary>;
          case 'generator-bg':
            return <ErrorBoundary><BackgroundGenerator /></ErrorBoundary>;
          case 'shamanic':
            return <ErrorBoundary><ShamanicTemplateEngine /></ErrorBoundary>;
          default:
            return <ErrorBoundary><AIStudioPanel /></ErrorBoundary>;
        }

      case 'settings':
        return <ErrorBoundary><ConnectionsPanel /></ErrorBoundary>;

      default:
        return <ErrorBoundary><HomePanel onNavigate={() => {}} /></ErrorBoundary>;
    }
  };

  // ── Sub-tab bar for sections with sub-tabs ──
  const renderSubTabBar = () => {
    const subTabs = SECTION_SUBTABS[activeSection];
    if (!subTabs) return null;

    const currentTabId = sectionSubTabMap[activeSection];

    return (
      <div className="flex items-center gap-1 bg-paper border border-brd rounded-2xl p-1.5 mb-4 overflow-x-auto">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => navigateToSubTab(activeSection, tab.id)}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5",
              currentTabId === tab.id
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "text-ink-muted hover:text-ink hover:bg-brd/50"
            )}
          >
            {tab.label}
            {tab.badge && (
              <span className={cn(
                "text-[8px] font-bold px-1.5 py-0.5 rounded-full",
                currentTabId === tab.id ? "bg-white/20 text-white" : "bg-accent/10 text-accent"
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  };

  const isFullscreen = FULLSCREEN_PANELS.has(activeSubTab);

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
        {/* ── Sidebar - Desktop ─────────────────────────────────────────── */}
        <aside className={cn(
          "bg-card border border-brd flex-col z-20 m-2 md:m-4 rounded-2xl lg:rounded-3xl shadow-custom",
          isFullscreen ? "hidden" : "hidden md:flex w-full md:w-64 lg:w-72"
        )}>
          <SidebarContent
            activeSection={activeSection}
            activeSubTab={activeSubTab}
            navigateToSection={navigateToSection}
            navigateToSubTab={navigateToSubTab}
            sidebarExpanded={sidebarExpanded}
            toggleSidebarSection={toggleSidebarSection}
            user={user}
            theme={theme}
            toggleTheme={toggleTheme}
            lang={lang}
            setLang={setLang}
          />
        </aside>

        {/* ── Mobile Header ─────────────────────────────────────────────── */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-brd z-30 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center font-bold text-sm text-white">N</div>
            <span className="font-bold text-sm">{t('appTitle')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border border-brd bg-paper flex items-center justify-center"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-full border border-brd bg-paper flex items-center justify-center"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </header>

        {/* ── Mobile Menu Overlay ───────────────────────────────────────── */}
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

        {/* ── Mobile Menu (Slide-in) ────────────────────────────────────── */}
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
                {/* Home */}
                <NavItem
                  active={activeSection === 'home'}
                  onClick={() => { navigateToSection('home'); setMobileMenuOpen(false); }}
                  icon={<Home size={18} />}
                  label={t('navHome')}
                />

                {/* Create */}
                <div className="nav-section-title">CREATE</div>
                <NavItem
                  active={activeSection === 'create' && createTab === 'generator'}
                  onClick={() => { navigateToSubTab('create', 'generator'); setMobileMenuOpen(false); }}
                  icon={<PenTool size={18} />}
                  label="Generator"
                  badge="AI"
                />
                <NavItem
                  active={activeSection === 'create' && createTab === 'design'}
                  onClick={() => { navigateToSubTab('create', 'design'); setMobileMenuOpen(false); }}
                  icon={<Palette size={18} />}
                  label="Design Studio"
                  badge="NEW"
                />
                <NavItem
                  active={activeSection === 'create' && createTab === 'video'}
                  onClick={() => { navigateToSubTab('create', 'video'); setMobileMenuOpen(false); }}
                  icon={<Film size={18} />}
                  label="Video Studio"
                  badge="PRO"
                />

                {/* Plan */}
                <div className="nav-section-title">PLAN</div>
                <NavItem
                  active={activeSection === 'plan'}
                  onClick={() => { navigateToSection('plan'); setMobileMenuOpen(false); }}
                  icon={<Calendar size={18} />}
                  label={t('navCalendar')}
                />

                {/* Insights */}
                <div className="nav-section-title">INSIGHTS</div>
                <NavItem
                  active={activeSection === 'insights' && insightsTab === 'analytics'}
                  onClick={() => { navigateToSubTab('insights', 'analytics'); setMobileMenuOpen(false); }}
                  icon={<BarChart3 size={18} />}
                  label="Analytics"
                />
                <NavItem
                  active={activeSection === 'insights' && insightsTab === 'strategy'}
                  onClick={() => { navigateToSubTab('insights', 'strategy'); setMobileMenuOpen(false); }}
                  icon={<TrendingUp size={18} />}
                  label="Strategy"
                />
                <NavItem
                  active={activeSection === 'insights' && insightsTab === 'dach'}
                  onClick={() => { navigateToSubTab('insights', 'dach'); setMobileMenuOpen(false); }}
                  icon={<Globe size={18} />}
                  label="DACH"
                />

                {/* AI Lab */}
                <div className="nav-section-title">AI LAB</div>
                <NavItem
                  active={activeSection === 'ai-lab' && aiLabTab === 'ai-studio'}
                  onClick={() => { navigateToSubTab('ai-lab', 'ai-studio'); setMobileMenuOpen(false); }}
                  icon={<Sparkles size={18} />}
                  label="AI Studio"
                  badge="NEW"
                />
                <NavItem
                  active={activeSection === 'ai-lab' && aiLabTab === 'generator-bg'}
                  onClick={() => { navigateToSubTab('ai-lab', 'generator-bg'); setMobileMenuOpen(false); }}
                  icon={<Palette size={18} />}
                  label="Background Gen"
                  badge="NEW"
                />
                <NavItem
                  active={activeSection === 'ai-lab' && aiLabTab === 'shamanic'}
                  onClick={() => { navigateToSubTab('ai-lab', 'shamanic'); setMobileMenuOpen(false); }}
                  icon={<Sparkles size={18} />}
                  label="Shamanic"
                  badge="🔮"
                />

                {/* Settings */}
                <div className="nav-section-title">{t('navSettings').toUpperCase()}</div>
                <NavItem
                  active={activeSection === 'settings'}
                  onClick={() => { navigateToSection('settings'); setMobileMenuOpen(false); }}
                  icon={<Settings size={18} />}
                  label={t('navConnections')}
                />
              </nav>

              {/* Mobile menu user card */}
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

        {/* ── Bottom Navigation - Mobile ────────────────────────────────── */}
        <nav className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-brd z-30 flex items-center justify-around px-2 pb-safe",
          isFullscreen ? "hidden" : ""
        )}>
          <BottomNavItem
            active={activeSection === 'home'}
            onClick={() => navigateToSection('home')}
            icon={<Home size={20} />}
            label="Home"
          />
          <BottomNavItem
            active={activeSection === 'create'}
            onClick={() => navigateToSection('create')}
            icon={<PlusCircle size={20} />}
            label="Create"
          />
          <BottomNavItem
            active={activeSection === 'plan'}
            onClick={() => navigateToSection('plan')}
            icon={<Calendar size={20} />}
            label="Calendar"
          />
          <BottomNavItem
            active={activeSection === 'insights'}
            onClick={() => navigateToSection('insights')}
            icon={<BarChart3 size={20} />}
            label="Insights"
          />
          <BottomNavItem
            active={activeSection === 'ai-lab' || activeSection === 'settings'}
            onClick={() => navigateToSection('ai-lab')}
            icon={<MoreHorizontal size={20} />}
            label="More"
          />
        </nav>

        {/* ── Main Content Area ──────────────────────────────────────────── */}
        <main className={cn(
          "flex-1 flex flex-col overflow-hidden",
          isFullscreen ? "m-0 p-0" : "m-2 md:m-4 ml-0 md:ml-0 pt-14 md:pt-0 pb-20 md:pb-0"
        )}>
          {/* Desktop Top bar */}
          <header className={cn(
            "hidden md:flex h-14 lg:h-16 items-center justify-between px-4 lg:px-8 bg-card border border-brd rounded-2xl lg:rounded-3xl mb-3 lg:mb-4 shadow-custom",
            isFullscreen ? "hidden" : ""
          )}>
            <div className="flex items-center gap-4">
              <h2 className="text-xs lg:text-sm font-bold uppercase tracking-widest text-ink-muted font-mono opacity-80">
                {activeSection === 'home' && t('navHome').toUpperCase()}
                {activeSection === 'create' && 'CREATE'}
                {activeSection === 'plan' && t('navCalendar').toUpperCase()}
                {activeSection === 'insights' && 'INSIGHTS'}
                {activeSection === 'ai-lab' && 'AI LAB'}
                {activeSection === 'settings' && t('navConnections').toUpperCase()}
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

          {/* Panel Container */}
          <div className={cn(
            "flex-1 overflow-y-auto",
            isFullscreen ? "p-0" : "p-3 md:p-6 lg:p-8 xl:p-10"
          )}>
            {/* Sub-tab bar for sections with multiple tabs */}
            {!isFullscreen && renderSubTabBar()}

            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeSection}-${activeSubTab}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-7xl mx-auto"
              >
                {renderPanel()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </motion.div>

      {/* ── Onboarding ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Sidebar Content (Desktop) ────────────────────────────────────────────────

function SidebarContent({
  activeSection,
  activeSubTab,
  navigateToSection,
  navigateToSubTab,
  sidebarExpanded,
  toggleSidebarSection,
  user,
  theme,
  toggleTheme,
  lang,
  setLang,
}: {
  activeSection: Section;
  activeSubTab: string;
  navigateToSection: (s: Section) => void;
  navigateToSubTab: (s: Section, tab: string) => void;
  sidebarExpanded: Record<string, boolean>;
  toggleSidebarSection: (s: string) => void;
  user: any;
  theme: string;
  toggleTheme: () => void;
  lang: string;
  setLang: (l: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      {/* Logo */}
      <div className="p-4 lg:p-6 flex items-center gap-4">
        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-accent rounded-2xl flex items-center justify-center font-bold text-lg lg:text-xl text-white shadow-lg shadow-accent/20">N</div>
        <div>
          <h1 className="font-sans text-base lg:text-lg font-bold tracking-tight">{t('appTitle')}</h1>
          <p className="text-[9px] lg:text-[10px] text-ink-muted uppercase tracking-widest font-bold font-mono">Creator Hub</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {/* ── Home ───────────────────── */}
        <NavItem
          active={activeSection === 'home'}
          onClick={() => navigateToSection('home')}
          icon={<Home size={18} />}
          label={t('navHome')}
        />

        {/* ── Create (collapsible) ───── */}
        <SidebarSection
          id="create"
          icon={<PlusCircle size={18} />}
          label="Create"
          active={activeSection === 'create'}
          expanded={sidebarExpanded['create'] ?? true}
          onToggleExpand={() => toggleSidebarSection('create')}
          onClickHeader={() => navigateToSection('create')}
        >
          <NavItem
            active={activeSection === 'create' && activeSubTab === 'generator'}
            onClick={() => navigateToSubTab('create', 'generator')}
            icon={<PenTool size={16} />}
            label="Generator"
            badge="AI"
            indent
          />
          <NavItem
            active={activeSection === 'create' && activeSubTab === 'design'}
            onClick={() => navigateToSubTab('create', 'design')}
            icon={<Palette size={16} />}
            label="Design Studio"
            badge="NEW"
            indent
          />
          <NavItem
            active={activeSection === 'create' && activeSubTab === 'video'}
            onClick={() => navigateToSubTab('create', 'video')}
            icon={<Film size={16} />}
            label="Video Studio"
            badge="PRO"
            indent
          />
        </SidebarSection>

        {/* ── Plan ────────────────────── */}
        <NavItem
          active={activeSection === 'plan'}
          onClick={() => navigateToSection('plan')}
          icon={<Calendar size={18} />}
          label={t('navCalendar')}
        />

        {/* ── Insights (collapsible) ─── */}
        <SidebarSection
          id="insights"
          icon={<BarChart3 size={18} />}
          label="Insights"
          active={activeSection === 'insights'}
          expanded={sidebarExpanded['insights'] ?? true}
          onToggleExpand={() => toggleSidebarSection('insights')}
          onClickHeader={() => navigateToSection('insights')}
        >
          <NavItem
            active={activeSection === 'insights' && activeSubTab === 'analytics'}
            onClick={() => navigateToSubTab('insights', 'analytics')}
            icon={<BarChart3 size={16} />}
            label="Analytics"
            indent
          />
          <NavItem
            active={activeSection === 'insights' && activeSubTab === 'strategy'}
            onClick={() => navigateToSubTab('insights', 'strategy')}
            icon={<TrendingUp size={16} />}
            label="Strategy"
            indent
          />
          <NavItem
            active={activeSection === 'insights' && activeSubTab === 'dach'}
            onClick={() => navigateToSubTab('insights', 'dach')}
            icon={<Globe size={16} />}
            label="DACH"
            indent
          />
        </SidebarSection>

        {/* ── AI Lab (collapsible) ────── */}
        <SidebarSection
          id="ai-lab"
          icon={<Brain size={18} />}
          label="AI Lab"
          active={activeSection === 'ai-lab'}
          expanded={sidebarExpanded['ai-lab'] ?? true}
          onToggleExpand={() => toggleSidebarSection('ai-lab')}
          onClickHeader={() => navigateToSection('ai-lab')}
        >
          <NavItem
            active={activeSection === 'ai-lab' && activeSubTab === 'ai-studio'}
            onClick={() => navigateToSubTab('ai-lab', 'ai-studio')}
            icon={<Sparkles size={16} />}
            label="AI Studio"
            badge="NEW"
            indent
          />
          <NavItem
            active={activeSection === 'ai-lab' && activeSubTab === 'generator-bg'}
            onClick={() => navigateToSubTab('ai-lab', 'generator-bg')}
            icon={<Wand2 size={16} />}
            label="Background Gen"
            badge="NEW"
            indent
          />
          <NavItem
            active={activeSection === 'ai-lab' && activeSubTab === 'shamanic'}
            onClick={() => navigateToSubTab('ai-lab', 'shamanic')}
            icon={<Sparkles size={16} />}
            label="Shamanic"
            badge="🔮"
            indent
          />
        </SidebarSection>

        {/* ── Settings ─────────────────── */}
        <NavItem
          active={activeSection === 'settings'}
          onClick={() => navigateToSection('settings')}
          icon={<Settings size={18} />}
          label={t('navConnections')}
        />
      </nav>

      {/* ── User card ────────────────── */}
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

// ─── SidebarSection (collapsible group) ───────────────────────────────────────

function SidebarSection({
  id,
  icon,
  label,
  active,
  expanded,
  onToggleExpand,
  onClickHeader,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onClickHeader: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all group",
          active ? "bg-accent/10 text-accent" : "hover:bg-brd/50 text-ink-muted hover:text-ink"
        )}
        onClick={onClickHeader}
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className="flex-1 text-sm font-bold truncate">{label}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          className="flex-shrink-0 p-0.5 rounded hover:bg-brd/50 transition-colors"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pl-3 space-y-0.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}