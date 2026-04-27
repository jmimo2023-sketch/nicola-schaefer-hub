/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  PenTool, 
  Video, 
  Smartphone, 
  TrendingUp, 
  User, 
  Globe, 
  Moon, 
  Sun,
  LayoutGrid,
  ChevronRight,
  Plus,
  Copy,
  RefreshCcw,
  PlusCircle,
  Zap,
  Check,
  ChevronLeft,
  Search,
  ExternalLink,
  Workflow,
  Palette,
  Image as ImageIcon,
  HardDrive,
  Trash2,
  Upload,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { Toaster, toast } from 'sonner';
import { cn } from './lib/utils';
import { TranslationProvider, useTranslation } from './lib/TranslationContext';
import { geminiService } from './services/geminiService';
import { DATA, CLIENTS, DACH_PHASES, STORIES_DATA } from './constants';
import { useFirebase } from './lib/FirebaseProvider';
import { signIn, signOut, db, handleFirestoreError, OperationType, currentAccessToken } from './services/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { initGoogleLibraries, openAssetPicker } from './services/googleAssetsService';
import { initCanva, createDesignWithMedia } from './services/canvaService';
import { StudioPanel } from './panels/StudioPanel';
import { ConnectionsPanel } from './panels/ConnectionsPanel';
import { CalendarPanel } from './panels/CalendarPanel';
import { ScriptsPanel } from './panels/ScriptsPanel';
import { StoriesPanel } from './panels/StoriesPanel';
import { HomePanel } from './panels/HomePanel';
import { GeneratorPanel } from './panels/GeneratorPanel';

export default function App() {
  const { user, loading } = useFirebase();

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // if (!user) {
  //   return <LoginScreen />;
  // }

  return <MainApp />;
}

function LoginScreen() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-brd p-10 rounded-custom shadow-custom text-center space-y-8">
        <div className="w-20 h-20 bg-accent rounded-3xl mx-auto flex items-center justify-center font-bold text-4xl text-white shadow-xl shadow-accent/20">N</div>
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink">Nicola Hub</h1>
          <p className="text-ink-muted text-sm font-medium">Bilingual Content Intelligence Hub v2.0</p>
        </div>
        <button 
          onClick={() => signIn()}
          className="w-full py-4 bg-accent text-white rounded-2xl font-bold text-sm tracking-widest uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-3"
        >
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
             <div className="w-2.5 h-2.5 bg-accent rounded-full"></div>
          </div>
          Login with Google
        </button>
      </div>
    </div>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [scheduledPosts, setScheduledPosts] = useState<{ id: string, date: string, type: string, content: string, status: string }[]>([]);
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
      {/* Simplified Sidebar */}
      <aside className="w-full md:w-[260px] bg-card border-r border-brd flex flex-col z-20 m-4 rounded-3xl shadow-custom">
        <div className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-accent/20">N</div>
          <div>
            <h1 className="font-sans text-xl font-bold tracking-tight">{t('appTitle')}</h1>
            <p className="text-[10px] text-ink-muted uppercase tracking-widest font-bold font-mono">Creator Hub</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <div className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-ink-muted opacity-60 font-mono">Menu</div>
          <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<LayoutDashboard size={18} />} label="Home" />
          <NavItem active={activeTab === 'studio'} onClick={() => setActiveTab('visuals')} icon={<Palette size={18} />} label="Studio" />
          <NavItem active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<Calendar size={18} />} label="Calendar" />
          <NavItem active={activeTab === 'generator'} onClick={() => setActiveTab('generator')} icon={<PenTool size={18} />} label="AI Generator" badge="AI" />

          <div className="px-4 py-3 mt-6 text-[10px] uppercase tracking-widest font-bold text-ink-muted opacity-60 font-mono">Analytics</div>
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<TrendingUp size={18} />} label="Instagram" />

          <div className="px-4 py-3 mt-6 text-[10px] uppercase tracking-widest font-bold text-ink-muted opacity-60 font-mono">Strategy</div>
          <NavItem active={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')} icon={<TrendingUp size={18} />} label="Simulator" />
          <NavItem active={activeTab === 'methodology'} onClick={() => setActiveTab('methodology')} icon={<LayoutGrid size={18} />} label="Methodology" />
          <NavItem active={activeTab === 'dach'} onClick={() => setActiveTab('dach')} icon={<Globe size={18} />} label="DACH Market" />

          <div className="px-4 py-3 mt-6 text-[10px] uppercase tracking-widest font-bold text-ink-muted opacity-60 font-mono">Settings</div>
          <NavItem active={activeTab === 'connections'} onClick={() => setActiveTab('connections')} icon={<Settings size={18} />} label="Connections" />
        </nav>

        <div className="p-4 bg-transparent mt-auto">
          <div className="flex items-center gap-3 p-3 bg-paper border border-brd rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">NS</div>
            <div className="flex flex-col">
              <p className="text-xs font-bold truncate">{user?.displayName || 'Nicola Schaefer'}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-custom rounded-full animate-pulse shadow-[0_0_8px_#467a49]"></div>
                <button
                  onClick={() => signOut()}
                  className="text-[9px] text-ink-muted font-mono font-bold tracking-tighter uppercase hover:text-rose-500"
                >
                  LOGOUT
                </button>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between px-3">
            <div className="flex items-center gap-1.5">
              <div className={cn("w-1 h-1 rounded-full", currentAccessToken ? "bg-green-custom shadow-[0_0_4px_#467a49]" : "bg-ink-muted/30")}></div>
              <span className="text-[7px] font-mono font-bold uppercase tracking-widest opacity-40">Google_Asset_Link</span>
            </div>
            <span className="text-[7px] font-mono font-bold uppercase tracking-widest text-accent font-bold">{currentAccessToken ? 'SYNCED' : 'OFFLINE'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden m-4 ml-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-8 bg-card border border-brd rounded-3xl mb-4 shadow-custom">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-muted font-mono opacity-80">{t(activeTab).toUpperCase()}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-paper border border-brd rounded-full overflow-hidden p-1">
              <button 
                onClick={() => setLang('es')} 
                className={cn("px-4 py-1.5 text-[10px] font-bold rounded-full transition-all", lang === 'es' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-ink-muted hover:text-ink")}
              >ES</button>
              <button 
                onClick={() => setLang('de')} 
                className={cn("px-4 py-1.5 text-[10px] font-bold rounded-full transition-all", lang === 'de' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-ink-muted hover:text-ink")}
              >DE</button>
            </div>
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border border-brd bg-paper flex items-center justify-center hover:bg-brd transition-all active:scale-95"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </header>

        {/* Panel Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'home' && <HomePanel onNavigate={setActiveTab} />}
              {activeTab === 'dashboard' && <DashboardPanel />}
              {activeTab === 'visuals' && <StudioPanel onNavigate={setActiveTab} />}
              {activeTab === 'calendar' && <CalendarPanel />}
              {activeTab === 'generator' && <GeneratorPanel onNavigate={setActiveTab} />}
              {activeTab === 'scripts' && <ScriptsPanel />}
              {activeTab === 'stories' && <StoriesPanel />}
              {activeTab === 'simulator' && <SimulatorPanel />}
              {/* Other panels would go here */}
              {activeTab === 'client' && <ClientPanel />}
              {activeTab === 'methodology' && <MethodologyPanel />}
              {activeTab === 'dach' && <DACHPanel />}
              {activeTab === 'materialization' && <MaterializationPanel />}
              {activeTab === 'connections' && <ConnectionsPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
    </>
  );
}

function NavItem({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-sm font-medium",
        active 
          ? "bg-accent text-white shadow-lg shadow-accent/40" 
          : "text-ink-muted hover:bg-brd hover:text-ink"
      )}
    >
      <span className={cn("transition-opacity", active ? "opacity-100" : "opacity-60")}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold", active ? "bg-white text-accent" : "bg-accent text-white")}>{badge}</span>}
    </button>
  );
}

// --- PANELS ---

function DashboardPanel() {
  const { t } = useTranslation();
  const { user } = useFirebase();
  const [stats, setStats] = useState<any>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'analytics', 'summary'), (doc) => {
      if (doc.exists()) {
        setStats(doc.data());
      }
    });
    return () => unsub();
  }, []);

  const handleSeedData = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      // 1. Seed Assets
      const sampleAssets = [
        { name: 'Lifestyle Desk Aesthetic', url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop', source: 'Sample Import', mimeType: 'image/jpeg' },
        { name: 'Organic Plant Content', url: 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=1974&auto=format&fit=crop', source: 'Sample Import', mimeType: 'image/jpeg' },
        { name: 'Minimalist Branding', url: 'https://images.unsplash.com/photo-1616628188502-413f2fe4cee?q=80&w=1974&auto=format&fit=crop', source: 'Sample Import', mimeType: 'image/jpeg' }
      ];

      for (const asset of sampleAssets) {
        await addDoc(collection(db, 'assets'), {
          ...asset,
          authorId: user.uid,
          createdAt: serverTimestamp()
        });
      }

      // 2. Seed Posts
      const samplePosts = [
        { content: 'Story: Detrás de las cámaras en el taller', type: 'story', date: '2026-05-15', status: 'ready' },
        { content: 'Reel: 3 errores comunes en tu estrategia', type: 'reel_script', date: '2026-05-18', status: 'draft' },
        { content: 'Caption: Reflexión sobre el proceso creativo', type: 'caption', date: '2026-05-20', status: 'ready' }
      ];

      for (const post of samplePosts) {
        await addDoc(collection(db, 'posts'), {
          ...post,
          authorId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // 3. Seed Methodology
      await addDoc(collection(db, 'methodology'), {
        title: 'Estrategia de Pilares May 2026',
        content: '# Pilares de Contenido\n1. **Valor Técnico**: Compartir conocimientos sobre plantas.\n2. **Personal**: Reflexiones sobre el crecimiento.\n\n### Próximos Pasos\nOptimizar los jueves a las 6pm.',
        type: 'ESTRATEGIA',
        authorId: user.uid,
        createdAt: serverTimestamp()
      });

      alert('¡Demo Data cargada con éxito! Revisa la biblioteca y el calendario.');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'seed_data');
      alert('Error seeding data: ' + (error.message || 'Check permissions.'));
    } finally {
      setIsSeeding(false);
    }
  };

  const displayStats = stats || DATA.kpis;
  
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
        <div className="text-center md:text-left">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 font-mono opacity-80 underline underline-offset-8 decoration-accent/40">ANALYTICS_V2.5</div>
          <h2 className="font-display text-5xl font-semibold mb-4 leading-tight tracking-tight">{t('dashboard')}</h2>
          <p className="text-sm text-ink-muted max-w-xl font-medium leading-relaxed mx-auto md:mx-0">Direct synchronization with Meta Business Suite // Monitoring active performance across bilingual reels and stories.</p>
        </div>
        
        <button 
          onClick={handleSeedData}
          disabled={isSeeding}
          className="bg-accent/10 border border-accent/20 text-accent px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-2 group disabled:opacity-50"
        >
          <Zap size={14} className="group-hover:animate-pulse" />
          {isSeeding ? 'INITIALIZING...' : 'INITIALIZE_TEST_DATA'}
        </button>
      </header>

      {/* KPI Cards Bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <KPICard title={t('viewsTotal')} value={displayStats.total_views?.toLocaleString()} delta="9 REELS" color="accent" />
        <KPICard title={t('engagementRate')} value={`${displayStats.avg_er}%`} delta="STATUS_OK" color="green" />
        <KPICard title={t('followersGained')} value={displayStats.total_follows?.toString() || '+111'} sub="FOLLOWERS_GEN" color="accent" />
        <KPICard title={t('savesTotal')} value={displayStats.total_saves?.toString()} sub="VALUE_SIGNALS" color="rose" />
        <KPICard title={t('storiesPub')} value={displayStats.total_stories?.toString()} sub={`RETENTION_${displayStats.story_retention || 83}%`} color="amber" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <ChartContainer title="Monthly views + ER" className="col-span-4 lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={DATA.by_month}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#467a49" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#467a49" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} />
              <Tooltip cursor={{ stroke: '#467a49', strokeWidth: 1 }} contentStyle={{ borderRadius: '24px', border: '1px solid #1a1a1a', backgroundColor: '#0a0a0a', color: '#f4f3f3' }} />
              <Area type="monotone" dataKey="views" stroke="#467a49" fillOpacity={1} fill="url(#colorViews)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Publication hourly performance" className="col-span-4 lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={DATA.by_hour}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '24px', border: '1px solid #1a1a1a', backgroundColor: '#0a0a0a', color: '#f4f3f3' }} />
              <Bar dataKey="views" fill="#467a49" radius={[8, 8, 0, 0]} barSize={24}>
                {DATA.by_hour.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.hour === '18:00' ? '#e8b571' : '#467a4944'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Top Reels Performance" className="col-span-4 bg-accent/5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em] font-mono border-b border-brd opacity-60">
                <tr>
                  <th className="px-6 py-4 text-ink font-bold tracking-[0.3em]">CONTENT_BLOCK</th>
                  <th className="px-6 py-4 text-ink font-bold tracking-[0.3em]">METRICS</th>
                  <th className="px-6 py-4 text-ink font-bold tracking-[0.3em]">ER_STATUS</th>
                  <th className="px-6 py-4 text-ink font-bold tracking-[0.3em]">CONVERSION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brd">
                {DATA.top_reels.map((reel, idx) => (
                  <tr key={idx} className="hover:bg-paper transition-all group">
                    <td className="px-6 py-6 max-w-xs font-semibold group-hover:text-accent">
                      <div className="flex flex-col gap-1 text-ink">
                        <span className="truncate">{reel.desc}</span>
                        <span className="text-[9px] text-ink-muted font-mono uppercase tracking-widest">{reel.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-lg font-bold text-ink">{reel.views.toLocaleString()}</span>
                        <div className="w-full max-w-[120px] h-1 bg-paper rounded-full overflow-hidden border border-brd">
                          <div className="h-full bg-accent" style={{ width: `${(reel.views / DATA.kpis.best_views) * 100}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full font-mono font-bold text-[10px] border",
                        reel.er >= 8 ? "bg-green-light border-green-custom text-green-custom" : "bg-accent-light border-accent text-accent"
                      )}>{reel.er}%</span>
                    </td>
                    <td className="px-6 py-6 font-mono font-bold text-green-custom">{reel.follows > 0 ? `+${reel.follows}` : '0.0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartContainer>
      </div>

      <div className="bg-card border border-brd p-8 rounded-custom flex flex-col md:flex-row gap-6 items-start shadow-custom relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-accent"></div>
        <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent shrink-0 group-hover:scale-110 transition-transform">
          <Zap size={24} />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent font-mono mb-2">SYSTEM_INSIGHT_LOG</div>
          <p className="text-lg text-ink leading-relaxed font-medium font-display italic">
            "Content performance benchmarks for May 2026 indicate that <strong>thursdays at 6pm</strong> remain the optimal window for audience engagement // 
            Personal reflection content (P1) is achieving an <strong>8.5% ER</strong>, significantly outperforming medical plant content."
          </p>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, delta, sub, color }: { title: string, value: string, delta?: string, sub?: string, color: 'accent' | 'green' | 'rose' | 'amber' }) {
  return (
    <div className={cn(
      "bg-card border border-brd rounded-custom p-6 transition-all hover:shadow-custom hover:-translate-y-1 relative group overflow-hidden"
    )}>
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted font-mono">{title}</h4>
        {delta && <div className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-tighter font-mono", 
          color === 'green' ? "bg-green-light border-green-custom text-green-custom" : "bg-accent-light border-accent text-accent")}>{delta}</div>}
      </div>
      <div className={cn("font-mono text-4xl font-bold tracking-tighter leading-none mb-3")}>
        {value}
      </div>
      {sub && <div className="text-[9px] text-ink-muted font-mono font-bold tracking-widest opacity-60">{sub}</div>}
    </div>
  );
}

function ChartContainer({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("bg-card border border-brd rounded-custom p-8 shadow-custom", className)}>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-8 font-mono opacity-80 flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
        {title}
      </h3>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}

function SimulatorPanel() {
  const { lang, t } = useTranslation();
  const [reels, setReels] = useState(2);
  const [stories, setStories] = useState(5);
  const [collabs, setCollabs] = useState(1);
  const [targetDach, setTargetDach] = useState(40);
  
  const results = useMemo(() => {
    const baseReach = 1017;
    const baseER = 6.3;
    
    // Simple heuristic calculation for simulation
    const reachMultiplier = 1 + (collabs * 0.2) + (reels * 0.1);
    const totalViews = Math.round(reels * 4 * 6 * baseReach * reachMultiplier);
    const convertedFollowers = Math.round(totalViews * (baseER / 100) * 0.08);
    const dachFollowers = Math.round(convertedFollowers * (targetDach / 100));
    const leads = Math.round(dachFollowers * 0.05);

    return { totalViews, convertedFollowers, dachFollowers, leads };
  }, [reels, stories, collabs, targetDach]);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <header className="mb-10 text-center md:text-left">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 font-mono">ENGINE_PROJECTION_v1.2</div>
        <h2 className="font-display text-5xl font-semibold mb-4 leading-tight tracking-tight">{t('simulator')}</h2>
        <p className="text-sm text-ink-muted max-w-xl font-medium leading-relaxed font-sans mx-auto md:mx-0">Trajectory models based on 2026 account benchmarks and content frequency.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="bg-card border border-brd p-10 rounded-custom shadow-custom relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-all">
              <TrendingUp size={120} className="text-accent" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-10 font-mono flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
              CONTENT_STRATEGY_INPUTS
            </h3>
            
            <div className="space-y-10 relative z-10">
              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-ink font-mono opacity-60">REELS_PER_WEEK</label>
                  <span className="text-lg font-mono font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">{reels}</span>
                </div>
                <input 
                  type="range" min="1" max="7" value={reels} 
                  onChange={(e) => setReels(parseInt(e.target.value))}
                  className="w-full h-2 bg-paper rounded-full appearance-none cursor-pointer accent-accent border border-brd"
                />
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-ink font-mono opacity-60">STORIES_PER_DAY</label>
                  <span className="text-lg font-mono font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">{stories}</span>
                </div>
                <input 
                  type="range" min="1" max="10" value={stories} 
                  onChange={(e) => setStories(parseInt(e.target.value))}
                  className="w-full h-2 bg-paper rounded-full appearance-none cursor-pointer accent-accent border border-brd"
                />
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-ink font-mono opacity-60">COLLABS_PER_MONTH</label>
                  <span className="text-lg font-mono font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">{collabs}</span>
                </div>
                <input 
                  type="range" min="0" max="8" value={collabs} 
                  onChange={(e) => setCollabs(parseInt(e.target.value))}
                  className="w-full h-2 bg-paper rounded-full appearance-none cursor-pointer accent-accent border border-brd"
                />
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-ink font-mono opacity-60">%_DACH_TARGET</label>
                  <span className="text-lg font-mono font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">{targetDach}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={targetDach} 
                  onChange={(e) => setTargetDach(parseInt(e.target.value))}
                  className="w-full h-2 bg-paper rounded-full appearance-none cursor-pointer accent-accent border border-brd"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
             <ScenarioButton label="CONSERVATIVE" onClick={() => { setReels(1); setStories(3); setCollabs(0); }} />
             <ScenarioButton label="BASE_MODEL" active onClick={() => { setReels(2); setStories(5); setCollabs(1); }} />
             <ScenarioButton label="EXPONENTIAL" onClick={() => { setReels(4); setStories(7); setCollabs(3); }} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-accent text-white p-12 rounded-custom shadow-xl shadow-accent/20 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-10">
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 font-mono">Followers_Gain_6m</span>
                <div className="text-7xl font-display font-bold leading-none mt-4 tabular-nums">+{results.convertedFollowers}</div>
                <p className="text-xs mt-4 opacity-70 font-medium font-sans uppercase tracking-widest">Projected Growth Index</p>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/20">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-display font-bold">{results.totalViews.toLocaleString()}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest opacity-60 font-mono">TOT_VIEWS</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-display font-bold">+{results.dachFollowers}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest opacity-60 font-mono">DACH_NET</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-display font-bold">{results.leads}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest opacity-60 font-mono">BOOKINGS</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-brd p-10 rounded-custom">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-green-light text-green-custom rounded-2xl shadow-inner">
                <TrendingUp size={20} />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-ink font-mono tracking-widest opacity-60">Efficiency Forecast</h4>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer>
                <AreaChart data={[
                  { month: 'MAY', v: results.totalViews * 0.1 },
                  { month: 'JUN', v: results.totalViews * 0.25 },
                  { month: 'JUL', v: results.totalViews * 0.45 },
                  { month: 'AUG', v: results.totalViews * 0.65 },
                  { month: 'SEP', v: results.totalViews * 0.85 },
                  { month: 'OCT', v: results.totalViews }
                ]}>
                  <defs>
                    <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#467a49" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#467a49" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" hide />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: '1px solid #1a1a1a', backgroundColor: '#0a0a0a', color: '#fff', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="v" stroke="#467a49" strokeWidth={3} fill="url(#colorCurve)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioButton({ label, active, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "py-3 rounded-xl text-[10px] font-bold border transition-all uppercase tracking-widest font-mono",
        active ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" : "bg-card border-brd text-ink-muted hover:bg-paper hover:text-ink"
      )}
    >
      {label}
    </button>
  );
}

function ClientPanel() {
  const { lang, t } = useTranslation();
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-12">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 font-mono">TARGET_DEMOGRAPHICS</div>
        <h2 className="font-display text-5xl font-semibold mb-4 leading-tight">{t('client')}</h2>
        <p className="text-sm text-ink-muted max-w-xl font-medium">Mapping high-value archetypes within the DACH executive market seeking holistic shifts.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CLIENTS.map((client, i) => (
          <div key={i} className="bg-card border border-brd rounded-custom p-10 hover:shadow-custom hover:-translate-y-2 transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-150"></div>
             <div className="w-20 h-20 rounded-3xl bg-accent text-white flex items-center justify-center font-display text-3xl font-bold mb-8 shadow-lg shadow-accent/20 group-hover:rotate-6 transition-transform">
               {client.initials}
             </div>
             <h3 className="font-display text-2xl font-bold mb-1 tracking-tight">{client.name[lang]}</h3>
             <p className="text-[10px] text-accent font-bold uppercase tracking-[0.2em] mb-10 font-mono opacity-80">{client.role[lang].toUpperCase()}</p>
             <div className="space-y-8 pt-8 border-t border-brd">
                {client.details[lang].map(([key, val], idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-accent rounded-full opacity-40"></div>
                      <span className="text-[9px] font-bold uppercase text-ink-muted tracking-widest font-mono">{key}</span>
                    </div>
                    <p className="text-xs text-ink/80 leading-relaxed font-medium">{val}</p>
                  </div>
                ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MethodologyPanel() {
  const { user } = useFirebase();
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'methodology'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInsights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'methodology', id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <header className="mb-10 text-center md:text-left">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 font-mono">METHODOLOGY_V1.0</div>
        <h2 className="font-display text-5xl font-semibold mb-4 leading-tight">Methodology Hub</h2>
        <p className="text-sm text-ink-muted max-w-xl font-medium leading-relaxed">Your personal vault of AI-generated insights, refined methodologies, and strategic prompts.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight) => (
          <div key={insight.id} className="bg-card border border-brd p-8 rounded-custom hover:shadow-custom transition-all group relative flex flex-col h-full overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent opacity-20 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-6">
              <span className="text-[9px] font-bold bg-accent/10 text-accent px-3 py-1 rounded-full font-mono tracking-widest uppercase">
                {insight.type || 'INSIGHT'}
              </span>
              <button 
                onClick={() => handleDelete(insight.id)}
                className="text-ink-muted hover:text-rose-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <h3 className="font-display text-xl mb-4 leading-tight font-bold tracking-tight text-ink">
              {insight.title || 'Untitled Insight'}
            </h3>
            <div className="flex-1 text-sm leading-relaxed text-ink/80 bg-paper/50 p-6 rounded-2xl border border-brd/50 font-medium overflow-auto">
              <div className="markdown-body">
                <ReactMarkdown>
                  {insight.content}
                </ReactMarkdown>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-[9px] text-ink-muted font-mono uppercase tracking-widest">
                {new Date(insight.createdAt?.toDate()).toLocaleDateString()}
              </span>
              <button 
                onClick={() => navigator.clipboard.writeText(insight.content)}
                className="p-2 hover:bg-paper rounded-lg transition-colors text-ink-muted hover:text-accent"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        ))}
        {insights.length === 0 && (
          <div className="col-span-full py-32 border-2 border-dashed border-brd rounded-custom flex flex-col items-center justify-center text-ink-muted gap-4 opacity-40">
             <Workflow size={48} />
             <p className="font-mono text-[10px] font-bold uppercase tracking-widest">No methodology items saved yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DACHPanel() {
  const { lang, t } = useTranslation();
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <header>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 font-mono">MARKET_EXPANSION_NODE</div>
        <h2 className="font-display text-5xl font-semibold mb-4 leading-tight">{t('dach')}</h2>
        <p className="text-sm text-ink-muted max-w-xl font-medium">Strategic positioning within Germany, Austria, and Switzerland (DACH) ecosystem.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DACH_PHASES.map((phase, i) => (
          <div key={i} className="bg-card border border-brd p-8 rounded-custom relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent/20 group-hover:bg-accent transition-colors"></div>
            <div className="mb-8">
              <span className="text-[9px] font-bold text-accent uppercase tracking-[0.2em] font-mono">{phase.date[lang]}</span>
              <h3 className="font-display text-2xl font-bold mt-2 tracking-tight">{phase.title[lang]}</h3>
            </div>
            <ul className="space-y-4 mb-6">
              {phase.items[lang].map((item, idx) => (
                <li key={idx} className="text-xs text-ink/70 flex gap-3 font-medium leading-relaxed">
                  <span className="text-accent shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-4 border-t border-brd/50 font-mono text-[9px] font-bold text-accent uppercase tracking-widest">
              {phase.metric[lang]}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-brd p-10 rounded-custom shadow-custom">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-10 font-mono">Instagram SEO (DE)</h4>
          <div className="space-y-2">
            <SEOItem kw="Nicola | Coach Persönliche Entwicklung" loc="FIELD NAME" />
            <SEOItem kw="systemisches Coaching" loc="BIO / CAPTION" />
            <SEOItem kw="innere Freiheit finden" loc="SEO CAPTION" />
          </div>
        </div>
        <div className="bg-accent text-white p-10 rounded-custom flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
            <Globe size={160} />
          </div>
          <p className="text-3xl font-display font-bold italic leading-tight mb-8 relative z-10 font-medium">"The only German coach in South America offering holistic coaching for DACH executives."</p>
          <div className="pt-8 border-t border-white/20 relative z-10">
             <div className="flex justify-between items-end">
                <div>
                  <span className="block text-4xl font-display font-bold leading-none mb-2">100M+</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 font-mono">DACH_SPEAKERS</span>
                </div>
                <div className="text-right">
                   <span className="block text-4xl font-display font-bold leading-none mb-2">0</span>
                   <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 font-mono">DIRECT_COMPETITION</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SEOItem({ kw, loc }: { kw: string, loc: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-brd last:border-0">
      <div>
        <p className="text-sm font-semibold">{kw}</p>
        <p className="text-[9px] font-bold tracking-widest text-accent uppercase">{loc}</p>
      </div>
      <span className="text-[10px] font-bold px-3 py-1 bg-accent-light border border-accent/10 text-accent rounded-full font-mono font-bold">PRIORITY_CRITICAL</span>
    </div>
  );
}

function MaterializationPanel() {
  const { lang, t } = useTranslation();
  
  // Directly using automation plan data locally for simplicity in this bento component
  const plan = {
    title: { es: "Plan de Materialización", de: "Materialisierungsplan" },
    automation: {
      title: { es: "Ecosistema de Automatización (Make.com)", de: "Automatisierungs-Ökosystem" },
      modules: [
        { name: 'ANALYTICS_SYNC', es: 'Captura automática de métricas de Meta Suite a base de datos externa.', de: 'Automatischer Metrik-Sync von Meta Suite.' },
        { name: 'CONTENT_ENGINE', es: 'IA que redacta borradores de 3-4 stories diarias basadas en el pilar del mes.', de: 'KI-gestützte Story-Drafts basierend auf der Monatssäule.' },
        { name: 'CALENDAR_PUSH', es: 'Envío automático de contenido aprobado a la cola de publicación.', de: 'Automatisches Push freigegebener Inhalte in die Queue.' }
      ]
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <header className="text-center md:text-left">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 font-mono">EXECUTION_LOG_v1.0</div>
        <h2 className="font-display text-5xl font-semibold mb-4 leading-tight">{plan.title[lang]}</h2>
        <p className="text-sm text-ink-muted max-w-xl font-medium">Integration roadmap for Make.com automation and strategic content scaling.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-brd p-10 rounded-custom shadow-custom">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-accent/10 text-accent rounded-2xl">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold tracking-tight">{plan.automation.title[lang]}</h3>
              <p className="text-xs text-ink-muted font-mono uppercase tracking-widest">Connective_Node_Make</p>
            </div>
          </div>
          
          <div className="space-y-8">
            {plan.automation.modules.map((m, i) => (
              <div key={i} className="flex gap-6 items-start group">
                <div className="w-8 h-8 rounded-full bg-paper border border-brd flex items-center justify-center text-[10px] font-bold font-mono group-hover:bg-accent group-hover:text-white transition-all">
                  0{i+1}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-ink">{m.name}</h4>
                  <p className="text-xs text-ink-muted leading-relaxed font-medium">{m[lang]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-paper border border-brd p-10 rounded-custom relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent font-mono opacity-60">NEXT_OPERATIONAL_STEPS</div>
              <ul className="space-y-4">
                <li className="flex gap-4 items-center text-sm font-semibold">
                   <Check className="text-green-custom" size={18} />
                   <span>Bio 100% DE Optimization</span>
                </li>
                <li className="flex gap-4 items-center text-sm font-semibold opacity-40">
                   <div className="w-[18px] h-[18px] border-2 border-brd rounded-full"></div>
                   <span>Make.com Scenario ID: 4861600 Deployment</span>
                </li>
                <li className="flex gap-4 items-center text-sm font-semibold opacity-40">
                   <div className="w-[18px] h-[18px] border-2 border-brd rounded-full"></div>
                   <span>Free Diagnostic Session Form Build</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="bg-accent text-white p-10 rounded-custom flex flex-col justify-center shadow-lg shadow-accent/20">
             <div className="text-4xl font-display font-medium leading-tight italic">
               "Automation is not about replacing the human element, but scaling the frequency of authentic connection."
             </div>
             <div className="mt-8 pt-8 border-t border-white/20 text-[10px] font-bold uppercase tracking-widest opacity-60 font-mono">
               STRATEGIC_MANDATE_2026
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
