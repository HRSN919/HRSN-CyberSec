import React, { useState, useEffect } from 'react';
import {
  Play,
  FileText,
  FileJson,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Network,
  Terminal,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Project, ScanRecord, UserRegistration } from '../types';
import { downloadScanAsJson, downloadScanAsTxt } from '../utils/reportExporter';

interface ScannerWorkspaceProps {
  user: UserRegistration;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProjectQuick: (name: string, targetUrl: string) => Promise<Project | null>;
  onScanComplete: (scan: ScanRecord) => void;
  initialScan?: ScanRecord | null;
}

export const ScannerWorkspace: React.FC<ScannerWorkspaceProps> = ({
  user,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProjectQuick,
  onScanComplete,
  initialScan,
}) => {
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const [targetUrl, setTargetUrl] = useState(activeProject?.targetUrl || 'https://example.com');
  const [checkHeaders, setCheckHeaders] = useState(true);
  const [checkTls, setCheckTls] = useState(true);
  const [checkPorts, setCheckPorts] = useState(true);
  const [authorized, setAuthorized] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentScan, setCurrentScan] = useState<ScanRecord | null>(initialScan || null);
  const [resultTab, setResultTab] = useState<'headers' | 'tls' | 'ports' | 'cli'>('headers');
  const [showQuickProj, setShowQuickProj] = useState(false);
  const [newProjName, setNewProjName] = useState('');

  useEffect(() => {
    if (activeProject?.targetUrl) {
      setTargetUrl(activeProject.targetUrl);
    }
  }, [activeProjectId, activeProject?.targetUrl]);

  useEffect(() => {
    if (initialScan) {
      setCurrentScan(initialScan);
    }
  }, [initialScan]);

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!authorized) {
      setError('لطفاً تایید مجوز تست امنیت دامنه هدف را علامت بزنید.');
      return;
    }
    if (!checkHeaders && !checkTls && !checkPorts) {
      setError('حداقل یک ماژول بررسی (هدرها، SSL/TLS یا پورت‌ها) را انتخاب کنید.');
      return;
    }

    setIsScanning(true);
    try {
      const res = await fetch('/api/scans/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          projectId: activeProject?.id || 'quick-scan',
          projectName: activeProject?.name || 'اسکن سریع',
          mobile: user.mobile,
          authorized,
          modules: {
            headers: checkHeaders,
            tls: checkTls,
            ports: checkPorts,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در اجرای اسکن.');
      }
      setCurrentScan(data.scan);
      onScanComplete(data.scan);
    } catch (err: any) {
      setError(err.message || 'اجرای اسکن با خطا مواجه شد.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleQuickProjectCreate = async () => {
    if (!newProjName.trim()) return;
    const created = await onCreateProjectQuick(newProjName.trim(), targetUrl);
    if (created) {
      setNewProjName('');
      setShowQuickProj(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              اجرای اسکن آسیب‌پذیری و پیکربندی وب
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              تحلیل زنده هدرهای HTTP، زنجیره گواهینامه SSL/TLS و بررسی پورت‌های سرویس استاندارد
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {`hrsn-cli --target ${targetUrl || '...'}`}
          </div>
        </div>

        <form onSubmit={handleRunScan} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  پروژه فعال
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickProj((v) => !v)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>پروژه جدید</span>
                </button>
              </div>
              {showQuickProj ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    placeholder="نام پروژه جدید..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleQuickProjectCreate}
                    className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                  >
                    ایجاد
                  </button>
                </div>
              ) : (
                <select
                  value={activeProjectId}
                  onChange={(e) => onSelectProject(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="quick-scan">اسکن سریع (بدون پروژه)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="lg:col-span-6">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                آدرس دامنه یا URL هدف
              </label>
              <input
                type="text"
                dir="ltr"
                required
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-2.5 text-sm font-mono text-left rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="lg:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={isScanning}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Play className="w-4 h-4" />
                <span>{isScanning ? 'در حال اسکن...' : 'شروع اسکن'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkHeaders}
                  onChange={(e) => setCheckHeaders(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600"
                />
                <span>بررسی هدرهای امنیتی HTTP</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkTls}
                  onChange={(e) => setCheckTls(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600"
                />
                <span>آنالیز گواهینامه و باگ‌های SSL/TLS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkPorts}
                  onChange={(e) => setCheckPorts(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600"
                />
                <span>تست اولیه پورت‌های سرویس</span>
              </label>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={authorized}
                onChange={(e) => setAuthorized(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-blue-600"
              />
              <span>تایید مجوز بررسی دامنه فوق</span>
            </label>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {isScanning && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
            در حال برقراری ارتباط با {targetUrl} و اجرای بررسی‌های امنیتی...
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800/70" />
            <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800/70" />
            <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800/70" />
          </div>
        </div>
      )}

      {!isScanning && !currentScan && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            آماده اجرای اولین ممیزی امنیتی
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-6">
            آدرس دامنه مورد نظر را در بالا وارد کرده و دکمه «شروع اسکن» را بزنید. خروجی کامل بررسی هدرها، SSL/TLS، وضعیت پورت‌ها و فایل گزارش TXT و JSON بلافاصله آماده می‌شود.
          </p>
        </div>
      )}

      {!isScanning && currentScan && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>پروژه: {currentScan.projectName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {new Date(currentScan.timestamp).toLocaleString('fa-IR')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{currentScan.durationMs} ms</span>
                </div>
                <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-white" dir="ltr">
                  {currentScan.targetUrl}
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                  <span>وضعیت HTTP: {currentScan.httpStatus ?? 'نامشخص'}</span>
                  <span aria-hidden="true">·</span>
                  <span>بنر سرور: {currentScan.serverBanner ?? 'مخفی'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => downloadScanAsTxt(currentScan)}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" />
                  <span>خروجی TXT</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadScanAsJson(currentScan)}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <FileJson className="w-4 h-4" />
                  <span>خروجی JSON</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">موارد تایید شده</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                  {currentScan.summary.passed}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">هشدارهای پیکربندی</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                  {currentScan.summary.warnings}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">نقص‌های بحرانی</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400 mt-1">
                  {currentScan.summary.failed}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">پورت‌های باز یافت‌شده</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  {currentScan.summary.openPorts}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setResultTab('headers')}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  resultTab === 'headers'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>هدرهای امنیتی ({currentScan.headers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setResultTab('tls')}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  resultTab === 'tls'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>گواهینامه SSL/TLS</span>
              </button>
              <button
                type="button"
                onClick={() => setResultTab('ports')}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  resultTab === 'ports'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>پورت‌های سرویس ({currentScan.ports.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setResultTab('cli')}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  resultTab === 'cli'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>خروجی خط فرمان (CLI)</span>
              </button>
            </div>

            <div className="p-6">
              {resultTab === 'headers' && (
                <div className="space-y-3">
                  {currentScan.headersError && (
                    <div className="p-3.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs">
                      {currentScan.headersError}
                    </div>
                  )}
                  {!currentScan.headersError && currentScan.headers.length === 0 && (
                    <p className="text-xs text-slate-500">ماژول بررسی هدرها برای این اسکن غیرفعال بوده است.</p>
                  )}
                  {currentScan.headers.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                            <th className="py-2.5 px-3 font-medium">نام هدر</th>
                            <th className="py-2.5 px-3 font-medium">وضعیت</th>
                            <th className="py-2.5 px-3 font-medium">مقدار شناسایی‌شده</th>
                            <th className="py-2.5 px-3 font-medium">توضیح و توصیه اصلاح</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                          {currentScan.headers.map((item) => (
                            <tr key={item.header} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-3 px-3 font-mono font-medium text-slate-900 dark:text-white whitespace-nowrap" dir="ltr">
                                {item.header}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                {item.status === 'pass' && (
                                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>تایید (PASS)</span>
                                  </span>
                                )}
                                {item.status === 'warn' && (
                                  <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>هشدار (WARN)</span>
                                  </span>
                                )}
                                {item.status === 'fail' && (
                                  <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>بحرانی (FAIL)</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300 max-w-xs truncate" dir="ltr" title={item.value || ''}>
                                {item.value || '— تنظیم نشده'}
                              </td>
                              <td className="py-3 px-3 text-slate-600 dark:text-slate-300 leading-5">
                                <div>{item.descriptionFa}</div>
                                {item.status !== 'pass' && (
                                  <div className="text-blue-600 dark:text-blue-400 mt-1">
                                    {item.recommendationFa}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {resultTab === 'tls' && (
                <div className="space-y-5">
                  {!currentScan.tls ? (
                    <p className="text-xs text-slate-500">ماژول بررسی SSL/TLS اجرا نشد.</p>
                  ) : !currentScan.tls.supported ? (
                    <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs">
                      {currentScan.tls.error}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <div className="text-slate-500 dark:text-slate-400">پروتکل TLS فعال</div>
                          <div className="font-mono font-semibold text-slate-900 dark:text-white mt-1">
                            {currentScan.tls.protocol}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <div className="text-slate-500 dark:text-slate-400">مجموعه رمزنگاری (Cipher)</div>
                          <div className="font-mono font-semibold text-slate-900 dark:text-white mt-1 truncate" title={currentScan.tls.cipherName || ''}>
                            {currentScan.tls.cipherName}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <div className="text-slate-500 dark:text-slate-400">اعتبار باقی‌مانده</div>
                          <div className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white mt-1">
                            {currentScan.tls.daysRemaining ?? '--'} روز
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 md:col-span-2">
                          <div className="text-slate-500 dark:text-slate-400">صادرکننده گواهینامه (Issuer)</div>
                          <div className="font-mono text-slate-900 dark:text-white mt-1" dir="ltr">
                            {currentScan.tls.issuer || 'نامشخص'}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <div className="text-slate-500 dark:text-slate-400">تاریخ انقضا</div>
                          <div className="font-mono text-slate-900 dark:text-white mt-1" dir="ltr">
                            {currentScan.tls.validTo || 'نامشخص'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {currentScan.tls.findings.map((f, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 text-xs"
                          >
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">{f.titleFa}</div>
                              <div className="text-slate-600 dark:text-slate-400 mt-1">{f.detailFa}</div>
                            </div>
                            <span
                              className={`font-medium whitespace-nowrap ${
                                f.status === 'pass'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : f.status === 'warn'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {f.status === 'pass' ? 'معتبر' : f.status === 'warn' ? 'هشدار' : 'بحرانی'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {resultTab === 'ports' && (
                <div className="overflow-x-auto">
                  {currentScan.ports.length === 0 ? (
                    <p className="text-xs text-slate-500">ماژول تست پورت‌ها اجرا نشد.</p>
                  ) : (
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                          <th className="py-2.5 px-3 font-medium">پورت</th>
                          <th className="py-2.5 px-3 font-medium">سرویس</th>
                          <th className="py-2.5 px-3 font-medium">وضعیت</th>
                          <th className="py-2.5 px-3 font-medium">زمان پاسخ</th>
                          <th className="py-2.5 px-3 font-medium">تحلیل امنیتی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                        {currentScan.ports.map((p) => (
                          <tr key={p.port} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                              {p.port}/tcp
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                              {p.service}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {p.state === 'open' ? (
                                <span
                                  className={`font-medium ${
                                    p.riskLevel === 'high'
                                      ? 'text-red-600 dark:text-red-400'
                                      : p.riskLevel === 'medium'
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  باز (OPEN)
                                </span>
                              ) : p.state === 'timeout' ? (
                                <span className="text-slate-500">فیلتر / Timeout</span>
                              ) : (
                                <span className="text-slate-400">بسته (CLOSED)</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                              {p.latencyMs !== null ? `${p.latencyMs} ms` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                              {p.noteFa}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {resultTab === 'cli' && (
                <div className="rounded-lg bg-slate-950 text-slate-100 p-5 border border-slate-800 overflow-x-auto">
                  <pre className="text-xs font-mono leading-6 text-left" dir="ltr">
                    {currentScan.cliLines.join('\n')}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
