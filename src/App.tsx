import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ScanSearch,
  FolderKanban,
  TerminalSquare,
  BookOpen,
  UserCheck,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { AppSection, Project, ScanRecord, UserRegistration } from './types';
import { RegistrationView } from './components/RegistrationView';
import { ScannerWorkspace } from './components/ScannerWorkspace';
import { ProjectsView } from './components/ProjectsView';
import { PythonCliStudio } from './components/PythonCliStudio';
import { UserGuideView } from './components/UserGuideView';
import { AccountSyncView } from './components/AccountSyncView';

const STORAGE_KEY_MOBILE = 'hrsn_registered_mobile';
const STORAGE_KEY_THEME = 'hrsn_theme';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    return saved ? saved === 'dark' : true;
  });
  const [user, setUser] = useState<UserRegistration | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [section, setSection] = useState<AppSection>('scanner');
  const [projects, setProjects] = useState<Project[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('quick-scan');
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const savedMobile = localStorage.getItem(STORAGE_KEY_MOBILE);
    if (!savedMobile) {
      setBootstrapping(false);
      return;
    }
    fetch(`/api/auth/user/${encodeURIComponent(savedMobile)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem(STORAGE_KEY_MOBILE);
        }
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY_MOBILE);
      })
      .finally(() => setBootstrapping(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(`/api/projects?mobile=${encodeURIComponent(user.mobile)}`).then((r) => r.json()),
      fetch(`/api/scans?mobile=${encodeURIComponent(user.mobile)}`).then((r) => r.json()),
    ])
      .then(([projData, scanData]) => {
        setProjects(Array.isArray(projData.projects) ? projData.projects : []);
        setScans(Array.isArray(scanData.scans) ? scanData.scans : []);
      })
      .catch(() => {});
  }, [user]);

  const handleAuthSuccess = (loggedUser: UserRegistration) => {
    localStorage.setItem(STORAGE_KEY_MOBILE, loggedUser.mobile);
    setUser(loggedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY_MOBILE);
    setUser(null);
    setProjects([]);
    setScans([]);
    setSelectedScan(null);
  };

  const handleCreateProjectQuick = async (
    name: string,
    targetUrl: string
  ): Promise<Project | null> => {
    if (!user) return null;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          targetUrl,
          clientName: user.organization || '',
          ownerMobile: user.mobile,
        }),
      });
      const data = await res.json();
      if (res.ok && data.project) {
        setProjects((prev) => [data.project, ...prev]);
        setActiveProjectId(data.project.id);
        return data.project;
      }
    } catch {
      // ignore
    }
    return null;
  };

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-sm text-slate-500">
        در حال بارگذاری محیط امنیتی HRSN CyberSec...
      </div>
    );
  }

  if (!user) {
    return (
      <RegistrationView
        onSuccess={handleAuthSuccess}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
      />
    );
  }

  const navItems: { id: AppSection; label: string; icon: typeof ScanSearch }[] = [
    { id: 'scanner', label: 'اسکنر امنیت وب', icon: ScanSearch },
    { id: 'projects', label: 'پروژه‌ها و گزارش‌ها', icon: FolderKanban },
    { id: 'python-cli', label: 'نسخه ویندوزی پایتون', icon: TerminalSquare },
    { id: 'guide', label: 'راهنمای کاربری', icon: BookOpen },
    { id: 'account', label: 'حساب و byhrsn.com', icon: UserCheck },
  ];

  const sectionTitle = navItems.find((n) => n.id === section)?.label || '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-display font-bold text-base tracking-tight whitespace-nowrap shrink-0">
              HRSN CyberSec
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
          <div className="font-semibold text-slate-900 dark:text-white truncate">{user.fullName}</div>
          <div className="font-mono text-slate-500 dark:text-slate-400" dir="ltr">
            {user.mobile}
          </div>
          <div className="text-slate-500 dark:text-slate-400 pt-1">
            <a
              href="https://byhrsn.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              byhrsn.com
            </a>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              aria-label="باز کردن منو"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap">HRSN CLI</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <h1 className="font-bold text-slate-900 dark:text-white truncate">{sectionTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="تغییر پوسته"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setSection('python-cli')}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap shrink-0"
            >
              دریافت نسخه ویندوز (.py)
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          {section === 'scanner' && (
            <ScannerWorkspace
              user={user}
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={setActiveProjectId}
              onCreateProjectQuick={handleCreateProjectQuick}
              onScanComplete={(scan) => {
                setScans((prev) => [scan, ...prev]);
                setSelectedScan(scan);
              }}
              initialScan={selectedScan}
            />
          )}

          {section === 'projects' && (
            <ProjectsView
              user={user}
              projects={projects}
              scans={scans}
              onProjectCreated={(proj) => {
                setProjects((prev) => [proj, ...prev]);
                setActiveProjectId(proj.id);
              }}
              onProjectDeleted={(id) => {
                setProjects((prev) => prev.filter((p) => p.id !== id));
                setScans((prev) => prev.filter((s) => s.projectId !== id));
                if (activeProjectId === id) setActiveProjectId('quick-scan');
              }}
              onOpenScanInConsole={(scan) => {
                setSelectedScan(scan);
                setActiveProjectId(scan.projectId);
                setSection('scanner');
              }}
              onStartScanForProject={(projId) => {
                setActiveProjectId(projId);
                setSelectedScan(null);
                setSection('scanner');
              }}
            />
          )}

          {section === 'python-cli' && <PythonCliStudio user={user} />}

          {section === 'guide' && <UserGuideView />}

          {section === 'account' && (
            <AccountSyncView
              user={user}
              onUserUpdated={(updated) => setUser(updated)}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>
    </div>
  );
}
