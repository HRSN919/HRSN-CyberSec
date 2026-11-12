import React, { useState } from 'react';
import { FolderPlus, Trash2, FileText, FileJson, ArrowUpLeft, Search } from 'lucide-react';
import { Project, ScanRecord, UserRegistration } from '../types';
import { downloadScanAsJson, downloadScanAsTxt } from '../utils/reportExporter';

interface ProjectsViewProps {
  user: UserRegistration;
  projects: Project[];
  scans: ScanRecord[];
  onProjectCreated: (project: Project) => void;
  onProjectDeleted: (id: string) => void;
  onOpenScanInConsole: (scan: ScanRecord) => void;
  onStartScanForProject: (projectId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  user,
  projects,
  scans,
  onProjectCreated,
  onProjectDeleted,
  onOpenScanInConsole,
  onStartScanForProject,
}) => {
  const [name, setName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          targetUrl,
          clientName,
          description,
          ownerMobile: user.mobile,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ایجاد پروژه.');
      onProjectCreated(data.project);
      setName('');
      setTargetUrl('');
      setClientName('');
      setDescription('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onProjectDeleted(id);
      }
    } catch {
      // ignore network glitch
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.targetUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            ایجاد پروژه ممیزی جدید
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            پروژه‌ها تاریخچه اسکن‌ها، دامنه هدف و گزارش‌های TXT/JSON هر کارفرما را دسته‌بندی می‌کنند.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              نام پروژه
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: پرتال سازمانی آلفا"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              آدرس دامنه هدف
            </label>
            <input
              type="text"
              dir="ltr"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://portal.example.com"
              className="w-full px-3.5 py-2 text-sm font-mono text-left rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              کارفرما / واحد (اختیاری)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="واحد فناوری اطلاعات"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{loading ? 'ثبت...' : 'ایجاد پروژه'}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            پروژه‌های ثبت‌شده ({projects.length})
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در پروژه‌ها..."
              className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
            هنوز پروژه‌ای ایجاد نشده یا موردی با جستجوی شما مطابقت ندارد. از فرم بالا اولین پروژه را بسازید.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredProjects.map((project) => {
              const projectScans = scans.filter((s) => s.projectId === project.id);
              const latestScan = projectScans[0];

              return (
                <div key={project.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{project.clientName || 'پروژه شخصی'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{projectScans.length} اسکن ثبت‌شده</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {new Date(project.createdAt).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {project.name}
                    </div>
                    {project.targetUrl && (
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400" dir="ltr">
                        {project.targetUrl}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {latestScan && (
                      <>
                        <button
                          type="button"
                          onClick={() => downloadScanAsTxt(latestScan)}
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>آخرین TXT</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadScanAsJson(latestScan)}
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <FileJson className="w-3.5 h-3.5" />
                          <span>آخرین JSON</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenScanInConsole(latestScan)}
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap"
                        >
                          مشاهده نتایج
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => onStartScanForProject(project.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>اسکن در این پروژه</span>
                      <ArrowUpLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(project.id)}
                      title="حذف پروژه"
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          تاریخچه کل اسکن‌ها ({scans.length})
        </h3>
        {scans.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تاکنون اسکنی ثبت نشده است.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-medium">پروژه</th>
                  <th className="py-2.5 px-3 font-medium">دامنه هدف</th>
                  <th className="py-2.5 px-3 font-medium">خلاصه نتایج</th>
                  <th className="py-2.5 px-3 font-medium">زمان اجرا</th>
                  <th className="py-2.5 px-3 font-medium">خروجی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {scans.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                      {s.projectName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                      {s.hostname}
                    </td>
                    <td className="py-3 px-3 tabular-nums text-slate-600 dark:text-slate-300">
                      موفق: {s.summary.passed} · هشدار: {s.summary.warnings} · بحرانی: {s.summary.failed}
                    </td>
                    <td className="py-3 px-3 tabular-nums text-slate-500">
                      {new Date(s.timestamp).toLocaleString('fa-IR')}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenScanInConsole(s)}
                          className="text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                        >
                          باز کردن
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadScanAsTxt(s)}
                          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
                        >
                          TXT
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadScanAsJson(s)}
                          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
                        >
                          JSON
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
