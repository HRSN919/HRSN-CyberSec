import { ScanRecord } from '../types';

export function buildTxtReport(scan: ScanRecord): string {
  const lines: string[] = [
    '======================================================================',
    '  HRSN CyberSec CLI - گزارش ممیزی امنیت وب (byhrsn.com)',
    '======================================================================',
    `پروژه            : ${scan.projectName}`,
    `آدرس هدف         : ${scan.targetUrl}`,
    `نام میزبان        : ${scan.hostname}`,
    `شماره موبایل کاربر: ${scan.executedByMobile}`,
    `زمان اجرا         : ${new Date(scan.timestamp).toLocaleString('fa-IR')} (${scan.timestamp})`,
    `مدت زمان تحلیل   : ${scan.durationMs} ms`,
    `کد وضعیت HTTP    : ${scan.httpStatus ?? 'نامشخص'}`,
    `بنر سرور         : ${scan.serverBanner ?? 'مخفی / تشخیص داده نشد'}`,
    '',
    `خلاصه نتایج: تایید شده: ${scan.summary.passed} | هشدار: ${scan.summary.warnings} | بحرانی: ${scan.summary.failed} | پورت باز: ${scan.summary.openPorts}`,
    '',
    '[۱] بررسی هدرهای امنیتی HTTP',
    '----------------------------------------------------------------------',
  ];

  if (scan.headersError) {
    lines.push(`  خطا در دریافت هدرها: ${scan.headersError}`);
  } else if (scan.headers.length === 0) {
    lines.push('  ماژول بررسی هدرها اجرا نشد.');
  } else {
    for (const item of scan.headers) {
      const tag = item.present ? 'PASS' : item.severity === 'high' ? 'FAIL' : 'WARN';
      lines.push(`  [${tag}] ${item.header}`);
      lines.push(`         مقدار: ${item.value ?? 'تنظیم نشده'}`);
      if (!item.present) {
        lines.push(`         توصیه: ${item.recommendationFa}`);
      }
    }
  }

  lines.push('', '[۲] بررسی گواهینامه و پروتکل SSL/TLS', '----------------------------------------------------------------------');
  if (!scan.tls) {
    lines.push('  ماژول SSL/TLS اجرا نشد.');
  } else if (!scan.tls.supported) {
    lines.push(`  خطای TLS: ${scan.tls.error ?? 'ارتباط امن برقرار نشد'}`);
  } else {
    lines.push(`  پروتکل فعال      : ${scan.tls.protocol ?? 'نامشخص'}`);
    lines.push(`  الگوریتم رمزنگاری: ${scan.tls.cipherName ?? 'نامشخص'}`);
    lines.push(`  صادرکننده (Issuer): ${scan.tls.issuer ?? 'نامشخص'}`);
    lines.push(`  موضوع (Subject)  : ${scan.tls.subject ?? 'نامشخص'}`);
    lines.push(`  اعتبار تا تاریخ  : ${scan.tls.validTo ?? 'نامشخص'} (${scan.tls.daysRemaining ?? '?'} روز باقی‌مانده)`);
    lines.push(`  تایید زنجیره اعتماد: ${scan.tls.authorized ? 'معتبر (Trusted)' : `نامعتبر (${scan.tls.authorizationError})`}`);
    for (const f of scan.tls.findings) {
      lines.push(`  [${f.status.toUpperCase()}] ${f.titleFa}: ${f.detailFa}`);
    }
  }

  lines.push('', '[۳] وضعیت پورت‌های سرویس و سطح حمله اولیه', '----------------------------------------------------------------------');
  if (scan.ports.length === 0) {
    lines.push('  ماژول پورت‌ها اجرا نشد.');
  } else {
    for (const p of scan.ports) {
      lines.push(
        `  Port ${String(p.port).padEnd(5, ' ')} | ${p.service.padEnd(11, ' ')} | ${p.state.toUpperCase().padEnd(7, ' ')} | ${p.latencyMs !== null ? `${p.latencyMs}ms` : '--'} | ${p.noteFa}`
      );
    }
  }

  lines.push('', '======================================================================');
  lines.push('  تولید شده توسط اسکنر HRSN CyberSec CLI — https://byhrsn.com');
  lines.push('======================================================================');
  return lines.join('\n');
}

export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadScanAsTxt(scan: ScanRecord) {
  const safeHost = scan.hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
  downloadTextFile(`hrsn-report-${safeHost}-${scan.id.slice(0, 8)}.txt`, buildTxtReport(scan));
}

export function downloadScanAsJson(scan: ScanRecord) {
  const safeHost = scan.hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const payload = {
    schema: 'hrsn-cybersec-report/v1',
    vendor: 'byhrsn.com',
    ...scan,
  };
  downloadTextFile(
    `hrsn-report-${safeHost}-${scan.id.slice(0, 8)}.json`,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8'
  );
}
