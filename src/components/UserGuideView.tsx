import React from 'react';
import { BookOpen, Terminal, ShieldCheck, Lock, Network, Globe } from 'lucide-react';

export const UserGuideView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            راهنمای جامع کاربری HRSN CyberSec CLI (byhrsn.com)
          </h2>
        </div>

        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
          ابزار HRSN CyberSec CLI برای متخصصان امنیت اطلاعات و مدیران سیستم طراحی شده است تا وضعیت هدرهای امنیتی HTTP، گواهینامه‌ها و پروتکل‌های SSL/TLS و پورت‌های باز سرویس‌ها را به‌صورت ساختاریافته در محیط خط فرمان ویندوز یا پنل وب بررسی کنند.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>۱. بررسی هدرهای امنیتی HTTP</span>
            </div>
            <p className="text-xs leading-6 text-slate-600 dark:text-slate-400">
              برنامه وجود و مقدار دقیق هدرهای کلیدی شامل HSTS، Content-Security-Policy، X-Frame-Options، X-Content-Type-Options، Referrer-Policy و Permissions-Policy را بررسی کرده و در صورت نبود هر هدر، دستور پیشنهادی اصلاح را نمایش می‌دهد.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>۲. تحلیل باگ‌ها و پیکربندی SSL/TLS</span>
            </div>
            <p className="text-xs leading-6 text-slate-600 dark:text-slate-400">
              نسخه پروتکل فعال (TLSv1.3 / TLSv1.2 در برابر پروتکل‌های منسوخ)، الگوریتم رمزنگاری، اعتبار زنجیره گواهینامه (CA)، نام صادرکننده و تعداد روزهای باقی‌مانده تا انقضا بررسی می‌شوند.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Network className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>۳. تست اولیه سطح حمله پورت‌ها</span>
            </div>
            <p className="text-xs leading-6 text-slate-600 dark:text-slate-400">
              پورت‌های استاندارد سرویس‌ها (21, 22, 25, 53, 80, 443, 3306, 5432, 6379, 8080, 8443) بررسی می‌شوند تا باز بودن غیرضروری سرویس‌های حساس مانند پایگاه داده در اینترنت عمومی شناسایی شود.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>۴. ثبت‌نام با شماره موبایل در byhrsn.com</span>
            </div>
            <p className="text-xs leading-6 text-slate-600 dark:text-slate-400">
              در اولین اجرا، نام و شماره موبایل کاربر ثبت می‌شود. مشخصات در پروفایل محلی ذخیره شده و همزمان به وب‌سرویس ثبت‌نام سایت byhrsn.com ارسال می‌گردد.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
          <Terminal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            مرجع دستورات نسخه خط فرمان ویندوز (Python CLI)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3 font-medium">پارامتر</th>
                <th className="py-2.5 px-3 font-medium">کاربرد</th>
                <th className="py-2.5 px-3 font-medium">مثال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              <tr>
                <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-white" dir="ltr">-t / --target</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">تعیین آدرس وب‌سایت هدف</td>
                <td className="py-2.5 px-3 font-mono text-slate-500" dir="ltr">-t https://example.com</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-white" dir="ltr">-p / --project</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">ایجاد یا انتخاب پوشه پروژه برای ذخیره گزارش‌ها</td>
                <td className="py-2.5 px-3 font-mono text-slate-500" dir="ltr">-p bank-portal</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-white" dir="ltr">--txt</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">تولید فایل گزارش متنی خوانا</td>
                <td className="py-2.5 px-3 font-mono text-slate-500" dir="ltr">--txt</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-white" dir="ltr">--json</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">تولید خروجی ساختاریافته JSON برای تحلیل‌های پیشرفته</td>
                <td className="py-2.5 px-3 font-mono text-slate-500" dir="ltr">--json</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-white" dir="ltr">--register</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">ثبت مجدد اطلاعات موبایل و همگام‌سازی با byhrsn.com</td>
                <td className="py-2.5 px-3 font-mono text-slate-500" dir="ltr">--register</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-white" dir="ltr">--guide</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">نمایش راهنمای کاربری در ترمینال ویندوز</td>
                <td className="py-2.5 px-3 font-mono text-slate-500" dir="ltr">--guide</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
