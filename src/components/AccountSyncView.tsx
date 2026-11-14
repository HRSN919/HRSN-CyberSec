import React, { useState } from 'react';
import { Lock, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserRegistration } from '../types';

interface AccountSyncViewProps {
  user: UserRegistration;
  onUserUpdated: (user: UserRegistration) => void;
  onLogout: () => void;
}

export const AccountSyncView: React.FC<AccountSyncViewProps> = ({
  user,
  onLogout,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword.length < 6) {
      setStatusMsg({ type: 'err', text: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setStatusMsg({ type: 'err', text: 'رمز عبور جدید و تکرار آن یکسان نیستند.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: user.mobile,
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تغییر رمز عبور انجام نشد.');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setStatusMsg({ type: 'ok', text: 'رمز عبور حساب کاربری با موفقیت به‌روزرسانی شد.' });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'خطا در تغییر رمز عبور.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              حساب کاربری
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مشخصات کاربری و تنظیمات امنیتی ورود
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج از حساب</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-slate-500 dark:text-slate-400">نام و نام خانوادگی</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-1">{user.fullName}</div>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-slate-500 dark:text-slate-400">شماره موبایل</div>
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
            <div className="text-slate-500 dark:text-slate-400">تاریخ عضویت</div>
            <div className="font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {new Date(user.registeredAt).toLocaleString('fa-IR')}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            تغییر رمز عبور
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            برای امنیت بیشتر، رمز عبور خود را به‌صورت دوره‌ای تغییر دهید.
          </p>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              statusMsg.type === 'ok'
                ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                : 'border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
            }`}
          >
            {statusMsg.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              رمز عبور فعلی
            </label>
            <input
              type="password"
              dir="ltr"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono text-left rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              رمز عبور جدید
            </label>
            <input
              type="password"
              dir="ltr"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono text-left rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              تکرار رمز جدید
            </label>
            <input
              type="password"
              dir="ltr"
              required
              minLength={6}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono text-left rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white flex items-center gap-2 whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{saving ? 'در حال ذخیره...' : 'به‌روزرسانی رمز عبور'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
