import React, { useState } from 'react';
import {
  ShieldCheck,
  Phone,
  User,
  Building2,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { UserRegistration } from '../types';

interface RegistrationViewProps {
  onSuccess: (user: UserRegistration) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  onSuccess,
  isDark,
  onToggleTheme,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedEthics, setAgreedEthics] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (password.length < 6) {
        setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
        return;
      }
      if (password !== confirmPassword) {
        setError('رمز عبور و تکرار آن یکسان نیستند.');
        return;
      }
      if (!agreedEthics) {
        setError('تایید تعهدنامه استفاده قانونی و اخلاقی از ابزار الزامی است.');
        return;
      }
    }

    setLoading(true);
    try {
      const url = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body =
        mode === 'register'
          ? { fullName, mobile, organization, password }
          : { mobile, password };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ورود یا ثبت اطلاعات.');
      }
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-display font-bold text-lg tracking-tight whitespace-nowrap shrink-0">
              HRSN CyberSec CLI
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <a
              href="https://byhrsn.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              byhrsn.com
            </a>
            <button
              type="button"
              onClick={onToggleTheme}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              {isDark ? 'حالت روشن' : 'حالت تیره'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <section className="lg:col-span-5 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <div className="space-y-6">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>اسکنر امنیت وب</span>
                <span aria-hidden="true">·</span>
                <span>نسخه دسکتاپ و کنسول وب</span>
              </div>

              <h1
                className="text-2xl sm:text-3xl font-bold leading-snug text-slate-900 dark:text-white"
                style={{ textWrap: 'balance' }}
              >
                ابزار خودکار تحلیل هدرهای امنیتی، SSL/TLS و بررسی پورت‌ها
              </h1>

              <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
                سامانه HRSN CyberSec CLI ویژه متخصصان امنیت برای ارزیابی سریع پیکربندی وب‌سایت‌ها، مدیریت پروژه‌های ممیزی و تولید گزارش‌های استاندارد متنی (TXT) و ساخت‌یافته (JSON) طراحی شده است.
              </p>

              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
                  <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
                    بررسی زنده هدرهای HSTS، CSP، X-Frame-Options، X-Content-Type-Options و افشای سرور
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
                  <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
                    بازرسی گواهینامه SSL/TLS، نسخه پروتکل، الگوریتم رمزنگاری و روزهای باقی‌مانده اعتبار
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
                  <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
                    مدیریت پروژه‌های ارزیابی امنیت همراه با خروجی گزارش TXT و JSON و نسخه خط فرمان ویندوزی پایتون
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>توسعه و پشتیبانی: byhrsn.com</span>
              <span className="font-mono">Python 3.10+ / CLI</span>
            </div>
          </section>

          <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col justify-center">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {mode === 'register' ? 'ثبت‌نام اولیه کاربر' : 'ورود به حساب کاربری'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {mode === 'register'
                    ? 'برای دسترسی به پنل اسکنر و پروژه‌ها حساب کاربری خود را ایجاد کنید.'
                    : 'شماره موبایل و رمز عبور خود را وارد کنید.'}
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    mode === 'register'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  ثبت‌نام جدید
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    mode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  ورود کاربر
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      نام و نام خانوادگی متخصص
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="مثال: حسام رضایی"
                        className="w-full pr-10 pl-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      سازمان یا تیم امنیت (اختیاری)
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="تیم امنیت یا شرکت"
                        className="w-full pr-10 pl-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  شماره موبایل
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    dir="ltr"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="09123456789"
                    className="w-full pr-10 pl-4 py-2.5 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className={mode === 'register' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    رمز عبور
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      dir="ltr"
                      required
                      minLength={mode === 'register' ? 6 : 1}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="حداقل ۶ کاراکتر"
                      className="w-full pr-10 pl-10 py-2.5 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      تکرار رمز عبور
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        dir="ltr"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="تکرار رمز عبور"
                        className="w-full pr-10 pl-4 py-2.5 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {mode === 'register' && (
                <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedEthics}
                    onChange={(e) => setAgreedEthics(e.target.checked)}
                    className="mt-1 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs leading-5 text-slate-600 dark:text-slate-400">
                    متعهد می‌شوم از این ابزار صرفاً برای ارزیابی امنیتی دامنه‌های متعلق به خود یا دارای مجوز رسمی استفاده کنم.
                  </span>
                </label>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>
                    {loading
                      ? 'در حال پردازش...'
                      : mode === 'register'
                      ? 'ثبت‌نام و ورود به کنسول امنیتی'
                      : 'ورود به حساب کاربری'}
                  </span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};
