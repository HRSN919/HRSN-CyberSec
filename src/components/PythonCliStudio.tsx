import React, { useMemo, useState } from 'react';
import { Download, Copy, Check, Terminal } from 'lucide-react';
import { generatePythonCliScript, generateWindowsBatchScript } from '../utils/pythonGenerator';
import { downloadTextFile } from '../utils/reportExporter';
import { UserRegistration } from '../types';

interface PythonCliStudioProps {
  user: UserRegistration;
}

export const PythonCliStudio: React.FC<PythonCliStudioProps> = ({ user }) => {
  const [defaultProject, setDefaultProject] = useState('audit-project');
  const [includePorts, setIncludePorts] = useState('21,22,25,53,80,443,3306,5432,6379,8080,8443');
  const [copiedPy, setCopiedPy] = useState(false);

  const pythonCode = useMemo(
    () =>
      generatePythonCliScript({
        defaultSyncUrl: user.byhrsnEndpoint || 'https://byhrsn.com/api/v1/cli-register',
        defaultProject,
        includePorts,
      }),
    [user.byhrsnEndpoint, defaultProject, includePorts]
  );

  const batchCode = useMemo(() => generateWindowsBatchScript(), []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pythonCode);
    setCopiedPy(true);
    setTimeout(() => setCopiedPy(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              بسته نرم‌افزار ویندوزی پایتون (HRSN CyberSec CLI)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              اسکریپت مستقل پایتون (بدون نیاز به کتابخانه خارجی) به همراه اسکریپت ساخت فایل اجرایی ویندوز (.exe)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => downloadTextFile('build_windows.bat', batchCode)}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>دانلود build_windows.bat</span>
            </button>
            <button
              type="button"
              onClick={() => downloadTextFile('hrsn_cli.py', pythonCode, 'text/x-python;charset=utf-8')}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>دانلود hrsn_cli.py</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              نام پیش‌فرض پروژه در CLI
            </label>
            <input
              type="text"
              dir="ltr"
              value={defaultProject}
              onChange={(e) => setDefaultProject(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-mono text-left rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              لیست پورت‌های پیش‌فرض
            </label>
            <input
              type="text"
              dir="ltr"
              value={includePorts}
              onChange={(e) => setIncludePorts(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-mono text-left rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white mb-2">
            <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>نحوه اجرا و تبدیل به فایل اجرایی ویندوز</span>
          </div>
          <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 leading-6 text-left overflow-x-auto" dir="ltr">
{`python hrsn_cli.py --target https://example.com --project ${defaultProject} --txt --json
# یا برای ساخت فایل اجرایی ویندوز (.exe):
build_windows.bat`}
          </pre>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              پیش‌نمایش کد منبع hrsn_cli.py
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap"
            >
              {copiedPy ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPy ? 'کپی شد' : 'کپی کد پایتون'}</span>
            </button>
          </div>
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-4 max-h-96 overflow-y-auto">
            <pre className="text-xs font-mono text-slate-200 leading-5 text-left" dir="ltr">
              {pythonCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
