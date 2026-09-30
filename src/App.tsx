import { useEffect, useMemo, useState } from 'react';
import { useStore } from './store/store';
import { useRoute, navigate } from './lib/router';
import { globalSearch } from './lib/search';
import { cx } from './components/ui';
import { ModalHost } from './components/ModalHost';
import { Assistant } from './components/Assistant';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Projects } from './pages/Projects';
import { CommandArcPage } from './pages/CommandArc';
import { MoneyPage } from './pages/Money';
import { FitnessPage } from './pages/Fitness';
import { LearningPage } from './pages/Learning';
import { HabitsPage } from './pages/Habits';
import { ReviewsPage } from './pages/Reviews';
import { SaveSeedPage } from './pages/SaveSeed';
import { CalendarPage } from './pages/Calendar';
import { NotesPage } from './pages/Notes';
import { SettingsPage } from './pages/Settings';
import type { Route } from './lib/router';

const NAV: { route: Route; label: string; icon: string }[] = [
  { route: 'home', label: 'Dashboard', icon: '◈' },
  { route: 'tasks', label: 'Tasks', icon: '☑' },
  { route: 'projects', label: 'Projects', icon: '▤' },
  { route: 'arc', label: 'Command Arc', icon: '❄' },
  { route: 'money', label: 'Money', icon: '$' },
  { route: 'fitness', label: 'Fitness', icon: '◉' },
  { route: 'learning', label: 'Learning', icon: '▣' },
  { route: 'habits', label: 'Habits', icon: '⌗' },
  { route: 'reviews', label: 'Reviews', icon: '✎' },
  { route: 'seed', label: 'Save Seed', icon: '✦' },
  { route: 'calendar', label: 'Calendar', icon: '▦' },
  { route: 'notes', label: 'Notes', icon: '≡' },
  { route: 'settings', label: 'Settings', icon: '⚙' },
];

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const state = useStore((s) => s);
  const [q, setQ] = useState('');
  const hits = useMemo(() => globalSearch(state, q), [state, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4 pt-[10vh]" onMouseDown={onClose}>
      <div className="panel mx-auto max-w-xl overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="w-full border-b border-hollow-line bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none"
          placeholder="Search tasks, projects, money, workouts, learning, reviews…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="max-h-[50vh] overflow-y-auto">
          {q.trim().length >= 2 && hits.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-slate-600">No matches for “{q}”.</div>
          )}
          {hits.map((h, i) => (
            <button
              key={`${h.type}-${i}`}
              className="flex w-full items-center gap-3 border-b border-hollow-line px-4 py-2.5 text-left hover:bg-hollow-panel2"
              onClick={() => {
                navigate(h.route as Route);
                onClose();
              }}
            >
              <span className="shrink-0 rounded border border-hollow-line bg-hollow-panel px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                {h.type}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-slate-200">{h.label}</span>
                {h.sub && <span className="block truncate text-xs text-slate-500">{h.sub}</span>}
              </span>
              {h.date && <span className="shrink-0 text-[11px] tabular-nums text-slate-600">{h.date}</span>}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 text-[11px] text-slate-600">Esc to close · click a result to jump</div>
      </div>
    </div>
  );
}

export default function App() {
  const route = useRoute();
  const theme = useStore((s) => s.settings.theme);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-midnight', 'theme-carbon');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setAiOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, [route]);

  const page = (() => {
    switch (route) {
      case 'home': return <Dashboard />;
      case 'tasks': return <Tasks />;
      case 'projects': return <Projects />;
      case 'arc': return <CommandArcPage />;
      case 'money': return <MoneyPage />;
      case 'fitness': return <FitnessPage />;
      case 'learning': return <LearningPage />;
      case 'habits': return <HabitsPage />;
      case 'reviews': return <ReviewsPage />;
      case 'seed': return <SaveSeedPage />;
      case 'calendar': return <CalendarPage />;
      case 'notes': return <NotesPage />;
      case 'settings': return <SettingsPage />;
    }
  })();

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((n) => (
        <button
          key={n.route}
          onClick={() => {
            navigate(n.route);
            onNavigate?.();
          }}
          className={cx(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            route === n.route
              ? 'bg-accent/10 font-medium text-accent'
              : 'text-slate-400 hover:bg-hollow-panel2 hover:text-slate-200',
          )}
        >
          <span className="w-4 text-center text-xs opacity-80">{n.icon}</span>
          {n.label}
        </button>
      ))}
    </nav>
  );

  return (
    <ModalHost>
      <div className="min-h-screen">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-hollow-line bg-hollow-panel px-3 py-4 lg:flex">
          <button className="mb-5 px-2 text-left" onClick={() => navigate('home')}>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-xs font-bold text-accent">
                HF
              </span>
              <div>
                <div className="text-sm font-semibold tracking-tight text-white">HOLLOW</div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">Foundation</div>
              </div>
            </div>
          </button>
          <NavLinks />
          <div className="mt-auto space-y-2 px-2 pt-4">
            <button
              className="flex w-full items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/20"
              onClick={() => setAiOpen(true)}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-good" />
              </span>
              Ask JARVIS
              <span className="ml-auto rounded border border-accent/30 px-1 text-[9px]">Ctrl J</span>
            </button>
            <button
              className="flex w-full items-center gap-2 rounded-lg border border-hollow-line bg-hollow-panel2 px-3 py-2 text-xs text-slate-400 hover:border-accent/40 hover:text-slate-200"
              onClick={() => setSearchOpen(true)}
            >
              <span>⌕</span> Search
              <span className="ml-auto rounded border border-hollow-line px-1 text-[9px] text-slate-600">Ctrl K</span>
            </button>
          </div>
        </aside>

        {/* Mobile topbar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-hollow-line bg-hollow-bg px-4 py-3 backdrop-blur lg:hidden">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-hollow-line text-slate-300"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            ☰
          </button>
          <button className="text-sm font-semibold tracking-tight text-white" onClick={() => navigate('home')}>
            HOLLOW FOUNDATION
          </button>
          <button
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent"
            onClick={() => setAiOpen(true)}
            aria-label="Open JARVIS"
          >
            ◈
          </button>
        </header>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onMouseDown={() => setMenuOpen(false)}>
            <div className="h-full w-64 border-r border-hollow-line bg-hollow-panel p-3" onMouseDown={(e) => e.stopPropagation()}>
              <div className="mb-4 px-2 text-sm font-semibold text-white">HOLLOW FOUNDATION</div>
              <NavLinks onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        )}

        <main className="px-4 py-5 sm:px-6 lg:ml-56 lg:px-8">
          <div className="mx-auto max-w-6xl">{page}</div>
        </main>

        {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
        <Assistant open={aiOpen} onClose={() => setAiOpen(false)} />
      </div>
    </ModalHost>
  );
}
