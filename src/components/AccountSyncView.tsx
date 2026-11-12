import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, LogOut, Globe } from 'lucide-react';
import { UserRegistration } from '../types';

interface AccountSyncViewProps {
  user: UserRegistration;
  onUserUpdated: (user: UserRegistration) => void;
  onLogout: () => void;
}

export const AccountSyncView: React.FC<AccountSyncViewProps> = ({
  user,
  onUserUpdated,
  onLogout,
}) => {
  const [endpoint, setEndpoint] = useState(
    user.byhrsnEndpoint || 'https://byhrsn.com/api/v1/cli-register'
  );
  const [syncing, setSyncing] = useState(false);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    try {
      const res = await fetch('/api/auth/sync-byhrsn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: user.mobile,
          byhrsnEndpoint: endpoint,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onUserUpdated(data.user);
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              حساب کاربری و همگام‌سازی با byhrsn.com
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مدیریت اطلاعات ثبت‌نام مبتنی بر شماره موبایل و وضعیت ارسال به سایت سازنده
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تغییر شماره / خروج</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-slate-500 dark:text-slate-400">نام و نام خانوادگی</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-1">{user.fullName}</div>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-slate-500 dark:text-slate-400">شماره موبایل ثبت‌شده</div>
            <div className="font-mono font-semibold text-slate-900 dark:text-white mt-1" dir="ltr">
              {user.mobile}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-slate-500 dark:text-slate-400">سازمان / تیم</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-1">
              {user.organization || 'ثبت نشده'}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-slate-500 dark:text-slate-400">تاریخ ثبت‌نام</div>
            <div className="font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {new Date(user.registeredAt).toLocaleString('fa-IR')}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold">
            {user.byhrsnSyncStatus === 'synced' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  همگام‌سازی موفق با سرور byhrsn.com
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-amber-600 dark:text-amber-400">
                  ذخیره‌شده در پایگاه داده محلی · در انتظار تایید سرور راه‌دور
                </span>
              </>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-5">
            {user.byhrsnSyncMessage}
          </p>
        </div>

        <form onSubmit={handleSync} className="space-y-3 pt-2">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            آدرس API ثبت‌نام در سایت byhrsn.com
          </label>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Globe className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                dir="ltr"
                required
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full pr-10 pl-4 py-2 text-xs font-mono text-left rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={syncing}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white flex items-center gap-2 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'در حال ارسال...' : 'تلاش مجدد همگام‌سازی'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
