import React, { useMemo, useState } from 'react';
import { BarChart3, ScanSearch } from 'lucide-react';
import { Project, ScanRecord } from '../types';

interface SingleScanChartProps {
  scan: ScanRecord;
}

export const SingleScanChartPanel: React.FC<SingleScanChartProps> = ({ scan }) => {
  const totalChecks = scan.summary.passed + scan.summary.warnings + scan.summary.failed;
  const passPct = totalChecks > 0 ? Math.round((scan.summary.passed / totalChecks) * 100) : 0;
  const warnPct = totalChecks > 0 ? Math.round((scan.summary.warnings / totalChecks) * 100) : 0;
  const failPct = totalChecks > 0 ? Math.max(0, 100 - passPct - warnPct) : 0;

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const passLen = totalChecks > 0 ? (scan.summary.passed / totalChecks) * circumference : 0;
  const warnLen = totalChecks > 0 ? (scan.summary.warnings / totalChecks) * circumference : 0;
  const failLen = totalChecks > 0 ? (scan.summary.failed / totalChecks) * circumference : 0;

  const moduleBreakdown = useMemo(() => {
    const hPass = scan.headers.filter((h) => h.status === 'pass').length;
    const hWarn = scan.headers.filter((h) => h.status === 'warn').length;
    const hFail = scan.headers.filter((h) => h.status === 'fail').length;

    const tlsFindings = scan.tls?.findings || [];
    const tPass = tlsFindings.filter((f) => f.status === 'pass').length;
    const tWarn = tlsFindings.filter((f) => f.status === 'warn').length;
    const tFail = tlsFindings.filter((f) => f.status === 'fail').length + (scan.tls && !scan.tls.supported ? 1 : 0);

    const openPorts = scan.ports.filter((p) => p.state === 'open');
    const pPass = openPorts.filter((p) => p.riskLevel === 'info' || p.riskLevel === 'low').length;
    const pWarn = openPorts.filter((p) => p.riskLevel === 'medium').length;
    const pFail = openPorts.filter((p) => p.riskLevel === 'high').length;

    return [
      { label: 'هدرهای امنیتی HTTP', pass: hPass, warn: hWarn, fail: hFail },
      { label: 'گواهینامه و پروتکل SSL/TLS', pass: tPass, warn: tWarn, fail: tFail },
      { label: 'پورت‌های باز سرویس', pass: pPass, warn: pWarn, fail: pFail },
    ];
  }, [scan]);

  const openPortsWithLatency = useMemo(
    () => scan.ports.filter((p) => p.state === 'open' && p.latencyMs !== null),
    [scan]
  );
  const maxLatency = useMemo(
    () => Math.max(10, ...openPortsWithLatency.map((p) => p.latencyMs || 0)),
    [openPortsWithLatency]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 p-5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-900 dark:text-white mb-4">
            نمودار توزیع وضعیت بررسی‌ها
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 my-auto">
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="16"
                  className="text-slate-200 dark:text-slate-800"
                />
                {passLen > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="16"
                    strokeDasharray={`${passLen} ${circumference}`}
                    strokeDashoffset={0}
                  />
                )}
                {warnLen > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="16"
                    strokeDasharray={`${warnLen} ${circumference}`}
                    strokeDashoffset={-passLen}
                  />
                )}
                {failLen > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="16"
                    strokeDasharray={`${failLen} ${circumference}`}
                    strokeDashoffset={-(passLen + warnLen)}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {totalChecks}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">کل بررسی‌ها</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
                  <span>تایید شده (PASS)</span>
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {scan.summary.passed} ({passPct}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-600 inline-block" />
                  <span>هشدار (WARN)</span>
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {scan.summary.warnings} ({warnPct}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-600 inline-block" />
                  <span>بحرانی (FAIL)</span>
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {scan.summary.failed} ({failPct}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 p-5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-900 dark:text-white mb-4">
            نمودار تفکیک یافته‌ها بر اساس ماژول
          </div>

          <div className="space-y-4 my-auto">
            {moduleBreakdown.map((mod) => {
              const total = mod.pass + mod.warn + mod.fail;
              const pW = total > 0 ? (mod.pass / total) * 100 : 0;
              const wW = total > 0 ? (mod.warn / total) * 100 : 0;
              const fW = total > 0 ? (mod.fail / total) * 100 : 0;

              return (
                <div key={mod.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {mod.label}
                    </span>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {total > 0
                        ? `موفق ${mod.pass} · هشدار ${mod.warn} · بحرانی ${mod.fail}`
                        : 'بدون مورد باز یا غیرفعال'}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-md bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                    {pW > 0 && (
                      <div
                        className="bg-emerald-600 h-full transition-all"
                        style={{ width: `${pW}%` }}
                        title={`تایید شده: ${mod.pass}`}
                      />
                    )}
                    {wW > 0 && (
                      <div
                        className="bg-amber-600 h-full transition-all"
                        style={{ width: `${wW}%` }}
                        title={`هشدار: ${mod.warn}`}
                      />
                    )}
                    {fW > 0 && (
                      <div
                        className="bg-red-600 h-full transition-all"
                        style={{ width: `${fW}%` }}
                        title={`بحرانی: ${mod.fail}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-slate-900 dark:text-white">
            نمودار زمان پاسخ پورت‌های باز (میلی‌ثانیه)
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            کل پورت‌های بررسی‌شده: {scan.ports.length} · پورت باز: {openPortsWithLatency.length}
          </div>
        </div>

        {openPortsWithLatency.length === 0 ? (
          <div className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
            پورت بازی با زمان پاسخ اندازه‌گیری‌شده در این اسکن یافت نشد.
          </div>
        ) : (
          <div className="space-y-2.5">
            {openPortsWithLatency.map((p) => {
              const ms = p.latencyMs ?? 0;
              const pct = Math.max(4, Math.round((ms / maxLatency) * 100));
              const barColor =
                p.riskLevel === 'high'
                  ? 'bg-red-600'
                  : p.riskLevel === 'medium'
                  ? 'bg-amber-600'
                  : 'bg-blue-600';

              return (
                <div key={p.port} className="grid grid-cols-12 items-center gap-3 text-xs">
                  <div className="col-span-3 sm:col-span-2 font-mono tabular-nums text-slate-800 dark:text-slate-200" dir="ltr">
                    {p.port} ({p.service})
                  </div>
                  <div className="col-span-7 sm:col-span-8 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="col-span-2 text-left font-mono tabular-nums text-slate-600 dark:text-slate-400" dir="ltr">
                    {ms} ms
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface ScanChartsViewProps {
  scans: ScanRecord[];
  projects: Project[];
  onGoToScanner: () => void;
  onOpenScanInConsole: (scan: ScanRecord) => void;
}

export const ScanChartsView: React.FC<ScanChartsViewProps> = ({
  scans,
  projects,
  onGoToScanner,
  onOpenScanInConsole,
}) => {
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [selectedScanId, setSelectedScanId] = useState<string>('');

  const filteredScans = useMemo(() => {
    if (projectFilter === 'all') return scans;
    return scans.filter((s) => s.projectId === projectFilter);
  }, [scans, projectFilter]);

  const activeScan = useMemo(() => {
    if (filteredScans.length === 0) return null;
    return filteredScans.find((s) => s.id === selectedScanId) || filteredScans[0];
  }, [filteredScans, selectedScanId]);

  const recentTrend = useMemo(() => {
    return [...filteredScans].slice(0, 10).reverse();
  }, [filteredScans]);

  const maxChecksInTrend = useMemo(() => {
    return Math.max(
      1,
      ...recentTrend.map((s) => s.summary.passed + s.summary.warnings + s.summary.failed)
    );
  }, [recentTrend]);

  const maxDurationMs = useMemo(() => {
    return Math.max(100, ...recentTrend.map((s) => s.durationMs));
  }, [recentTrend]);

  if (scans.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-4">
        <BarChart3 className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          هنوز داده‌ای برای رسم نمودار اسکن وجود ندارد
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-6">
          پس از اجرای اولین اسکن امنیتی، نمودار توزیع وضعیت هدرها، SSL/TLS، پورت‌های باز و روند زمانی اسکن‌ها در اینجا نمایش داده می‌شود.
        </p>
        <div>
          <button
            type="button"
            onClick={onGoToScanner}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2 whitespace-nowrap"
          >
            <ScanSearch className="w-4 h-4" />
            <span>اجرای اولین اسکن</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              نمودار روند اسکن‌ها و تحلیل وضعیت
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مقایسه نتایج اسکن‌های ثبت‌شده و زمان پاسخ سرویس‌ها
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setSelectedScanId('');
              }}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">همه پروژه‌ها ({scans.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {activeScan && (
              <button
                type="button"
                onClick={() => onOpenScanInConsole(activeScan)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
              >
                باز کردن جزئیات اسکن انتخابی
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
          <div className="lg:col-span-7 p-5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                روند یافته‌های امنیتی (۱۰ اسکن اخیر)
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-emerald-600 inline-block" />
                  موفق
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-amber-600 inline-block" />
                  هشدار
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-red-600 inline-block" />
                  بحرانی
                </span>
              </div>
            </div>

            {recentTrend.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                اسکنی برای این پروژه ثبت نشده است.
              </div>
            ) : (
              <div className="grid grid-flow-col auto-cols-fr gap-2.5 items-end h-52 pt-4">
                {recentTrend.map((s) => {
                  const total = s.summary.passed + s.summary.warnings + s.summary.failed;
                  const heightPct = Math.max(12, Math.round((total / maxChecksInTrend) * 100));
                  const pPct = total > 0 ? (s.summary.passed / total) * 100 : 0;
                  const wPct = total > 0 ? (s.summary.warnings / total) * 100 : 0;
                  const fPct = total > 0 ? (s.summary.failed / total) * 100 : 0;
                  const isSelected = activeScan?.id === s.id;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedScanId(s.id)}
                      className={`h-full flex flex-col items-center justify-end gap-2 group focus:outline-none`}
                      title={`${s.hostname} — موفق: ${s.summary.passed} · هشدار: ${s.summary.warnings} · بحرانی: ${s.summary.failed}`}
                    >
                      <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {total}
                      </span>
                      <div
                        className={`w-full max-w-[36px] rounded-md overflow-hidden flex flex-col-reverse bg-slate-200 dark:bg-slate-800 transition-transform group-hover:scale-[1.03] ${
                          isSelected ? 'ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-950' : ''
                        }`}
                        style={{ height: `${heightPct}%` }}
                      >
                        {pPct > 0 && <div className="bg-emerald-600 w-full" style={{ height: `${pPct}%` }} />}
                        {wPct > 0 && <div className="bg-amber-600 w-full" style={{ height: `${wPct}%` }} />}
                        {fPct > 0 && <div className="bg-red-600 w-full" style={{ height: `${fPct}%` }} />}
                      </div>
                      <span
                        className={`text-[10px] font-mono truncate max-w-full ${
                          isSelected
                            ? 'text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                        dir="ltr"
                      >
                        {s.hostname}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 p-5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-900 dark:text-white mb-4">
              نمودار مدت زمان اجرای اسکن‌ها (ms)
            </div>

            {recentTrend.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                داده‌ای موجود نیست.
              </div>
            ) : (
              <div className="space-y-3">
                {recentTrend.map((s) => {
                  const pct = Math.max(6, Math.round((s.durationMs / maxDurationMs) * 100));
                  const isSelected = activeScan?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedScanId(s.id)}
                      className="w-full text-right space-y-1 group"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-mono truncate max-w-[160px] ${
                            isSelected
                              ? 'text-blue-600 dark:text-blue-400 font-semibold'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                          dir="ltr"
                        >
                          {s.hostname}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400" dir="ltr">
                          {s.durationMs} ms
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-colors ${
                            isSelected ? 'bg-blue-600' : 'bg-slate-400 dark:bg-slate-600 group-hover:bg-blue-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeScan && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              جزئیات نموداری اسکن انتخاب‌شده: <span className="font-mono" dir="ltr">{activeScan.hostname}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {activeScan.projectName} · {new Date(activeScan.timestamp).toLocaleString('fa-IR')}
            </div>
          </div>

          <SingleScanChartPanel scan={activeScan} />
        </div>
      )}
    </div>
  );
};
