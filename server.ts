import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import net from 'net';
import tls from 'tls';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.HRSN_DATA_DIR || path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'hrsn_store.json');
const DEFAULT_BYHRSN_ENDPOINT =
  process.env.BYHRSN_SYNC_URL || 'https://byhrsn.com/api/v1/cli-register';

interface StoredUser {
  id: string;
  fullName: string;
  mobile: string;
  organization: string;
  registeredAt: string;
  byhrsnEndpoint: string;
  byhrsnSyncStatus: 'synced' | 'pending_remote' | 'local_only';
  byhrsnSyncMessage: string;
  lastSyncAttempt?: string;
}

interface StoredProject {
  id: string;
  name: string;
  targetUrl: string;
  clientName: string;
  description: string;
  ownerMobile: string;
  createdAt: string;
}

interface StoreData {
  users: StoredUser[];
  projects: StoredProject[];
  scans: any[];
}

function ensureStore(): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    const initial: StoreData = { users: [], projects: [], scans: [] };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      scans: Array.isArray(parsed.scans) ? parsed.scans : [],
    };
  } catch {
    return { users: [], projects: [], scans: [] };
  }
}

function saveStore(data: StoreData) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${STORE_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, STORE_FILE);
}

function normalizeMobile(input: string): string {
  const cleaned = input.replace(/[\s\-()]/g, '').trim();
  if (/^09\d{9}$/.test(cleaned)) return cleaned;
  if (/^\+989\d{9}$/.test(cleaned)) return '0' + cleaned.slice(3);
  if (/^989\d{9}$/.test(cleaned)) return '0' + cleaned.slice(2);
  if (/^9\d{9}$/.test(cleaned)) return '0' + cleaned;
  return cleaned;
}

function isValidMobile(mobile: string): boolean {
  const norm = normalizeMobile(mobile);
  return /^09\d{9}$/.test(norm) || /^\+\d{8,15}$/.test(norm);
}

function isPrivateOrRestrictedIP(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
    const [a, b] = parts;
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
    if (lower.startsWith('fe80')) return true; // link-local
    if (lower.startsWith('ff')) return true; // multicast
    if (lower.startsWith('::ffff:')) {
      const mapped = lower.replace('::ffff:', '');
      return isPrivateOrRestrictedIP(mapped);
    }
    return false;
  }
  return true;
}

async function resolvePublicHost(hostname: string): Promise<{ ip: string; family: 4 | 6 }> {
  const cleanHost = hostname.trim().toLowerCase();
  if (
    !cleanHost ||
    cleanHost === 'localhost' ||
    cleanHost.endsWith('.local') ||
    cleanHost.endsWith('.internal')
  ) {
    throw new Error('اسکن آدرس‌های محلی یا داخلی مجاز نیست.');
  }

  if (net.isIP(cleanHost)) {
    if (isPrivateOrRestrictedIP(cleanHost)) {
      throw new Error('آدرس IP خصوصی یا رزروشده توسط سیاست امنیتی مسدود شد.');
    }
    return { ip: cleanHost, family: net.isIPv6(cleanHost) ? 6 : 4 };
  }

  const records = await dns.promises.lookup(cleanHost, { all: true });
  if (!records || records.length === 0) {
    throw new Error('نام دامنه (DNS) قابل تفکیک نیست.');
  }
  for (const rec of records) {
    if (isPrivateOrRestrictedIP(rec.address)) {
      throw new Error('دامنه به یک آدرس IP داخلی/خصوصی اشاره دارد و مجاز نیست.');
    }
  }
  const v4 = records.find((r) => r.family === 4) || records[0];
  return { ip: v4.address, family: v4.family === 6 ? 6 : 4 };
}

async function attemptByhrsnSync(
  user: StoredUser,
  endpointUrl: string
): Promise<{ status: 'synced' | 'pending_remote'; message: string }> {
  let parsedEndpoint: URL;
  try {
    parsedEndpoint = new URL(endpointUrl);
    if (!['https:', 'http:'].includes(parsedEndpoint.protocol)) {
      return { status: 'pending_remote', message: 'آدرس سرور همگام‌سازی نامعتبر است.' };
    }
  } catch {
    return { status: 'pending_remote', message: 'فرمت آدرس سرور همگام‌سازی صحیح نیست.' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const resp = await fetch(parsedEndpoint.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HRSN-CyberSec-CLI/1.0 (+https://byhrsn.com)',
      },
      body: JSON.stringify({
        source: 'hrsn-cybersec-cli',
        fullName: user.fullName,
        mobile: user.mobile,
        organization: user.organization,
        registeredAt: user.registeredAt,
      }),
      signal: controller.signal,
    });
    if (resp.ok) {
      return {
        status: 'synced',
        message: `اطلاعات با موفقیت در ${parsedEndpoint.hostname} ثبت شد (HTTP ${resp.status}).`,
      };
    }
    return {
      status: 'pending_remote',
      message: `پروفایل در پایگاه داده برنامه ذخیره شد؛ سرور ${parsedEndpoint.hostname} کد ${resp.status} برگرداند.`,
    };
  } catch (err: any) {
    const msg = err?.name === 'AbortError' ? 'Timeout' : err?.message || 'Connection error';
    return {
      status: 'pending_remote',
      message: `پروفایل در پایگاه داده محلی برنامه ذخیره شد (عدم دسترسی به اندپوینت ${parsedEndpoint.hostname}: ${msg}).`,
    };
  } finally {
    clearTimeout(timer);
  }
}

const HEADER_RULES = [
  {
    header: 'Strict-Transport-Security',
    severity: 'high' as const,
    descriptionFa: 'الزام مرورگر به برقراری ارتباط امن HTTPS و جلوگیری از حملات SSL Stripping.',
    recommendationFa: 'افزودن هدر: Strict-Transport-Security: max-age=31536000; includeSubDomains',
  },
  {
    header: 'Content-Security-Policy',
    severity: 'high' as const,
    descriptionFa: 'محدودسازی منابع اسکریپت، استایل و فریم برای پیشگیری از حملات XSS.',
    recommendationFa: "تعریف سیاست سخت‌گیرانه مثل: Content-Security-Policy: default-src 'self'",
  },
  {
    header: 'X-Frame-Options',
    severity: 'medium' as const,
    descriptionFa: 'محافظت از صفحات در برابر بارگذاری داخل iframe و حملات Clickjacking.',
    recommendationFa: 'تنظیم مقدار SAMEORIGIN یا DENY برای X-Frame-Options.',
  },
  {
    header: 'X-Content-Type-Options',
    severity: 'medium' as const,
    descriptionFa: 'جلوگیری از حدس‌زنی نوع MIME فایل‌ها توسط مرورگر (MIME Sniffing).',
    recommendationFa: 'تنظیم مقدار دقیق: X-Content-Type-Options: nosniff',
  },
  {
    header: 'Referrer-Policy',
    severity: 'low' as const,
    descriptionFa: 'کنترل میزان اطلاعات آدرس مبدأ که هنگام کلیک روی لینک‌های خارجی ارسال می‌شود.',
    recommendationFa: 'توصیه: Referrer-Policy: strict-origin-when-cross-origin',
  },
  {
    header: 'Permissions-Policy',
    severity: 'low' as const,
    descriptionFa: 'غیرفعال‌سازی دسترسی‌های غیرضروری مرورگر مانند دوربین، میکروفون و موقعیت مکانی.',
    recommendationFa: 'تنظیم محدودیت APIهای مرورگر با Permissions-Policy.',
  },
  {
    header: 'Cross-Origin-Opener-Policy',
    severity: 'low' as const,
    descriptionFa: 'ایزوله‌سازی زمینه مرورگر (Browsing Context) در برابر حملات جانبی Cross-Origin.',
    recommendationFa: 'توصیه: Cross-Origin-Opener-Policy: same-origin',
  },
];

async function inspectHttpHeaders(initialUrl: URL) {
  let currentUrl = initialUrl;
  let finalResponse: Response | null = null;
  const maxRedirects = 3;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    await resolvePublicHost(currentUrl.hostname);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const resp = await fetch(currentUrl.toString(), {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'HRSN-CyberSec-CLI/1.0 (Defensive Security Audit; +https://byhrsn.com)',
          Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      if (resp.status >= 300 && resp.status < 400) {
        const loc = resp.headers.get('location');
        if (loc && hop < maxRedirects) {
          const nextUrl = new URL(loc, currentUrl);
          if (!['http:', 'https:'].includes(nextUrl.protocol)) {
            throw new Error('ریدایرکت به پروتکل غیرمجاز انجام شد.');
          }
          currentUrl = nextUrl;
          continue;
        }
      }
      finalResponse = resp;
      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (!finalResponse) {
    throw new Error('پاسخی از سرور دریافت نشد.');
  }

  const lowerHeaders = new Map<string, string>();
  finalResponse.headers.forEach((value, key) => {
    lowerHeaders.set(key.toLowerCase(), value);
  });

  const checks = HEADER_RULES.map((rule) => {
    const val = lowerHeaders.get(rule.header.toLowerCase()) ?? null;
    const present = val !== null && val.trim().length > 0;
    let status: 'pass' | 'warn' | 'fail' = present ? 'pass' : rule.severity === 'high' ? 'fail' : 'warn';

    if (present && rule.header === 'Strict-Transport-Security') {
      const match = val!.match(/max-age=(\d+)/i);
      if (match && Number(match[1]) < 15552000) {
        status = 'warn';
      }
    }

    return {
      header: rule.header,
      present,
      value: val,
      status,
      severity: rule.severity,
      descriptionFa: rule.descriptionFa,
      recommendationFa: rule.recommendationFa,
    };
  });

  const serverHeader = lowerHeaders.get('server');
  const poweredBy = lowerHeaders.get('x-powered-by');
  const serverBanner = [serverHeader, poweredBy].filter(Boolean).join(' · ') || null;

  if (serverBanner) {
    checks.push({
      header: 'Server / X-Powered-By Exposure',
      present: true,
      value: serverBanner,
      status: 'warn',
      severity: 'low',
      descriptionFa: 'افشای نسخه وب‌سرور یا تکنولوژی بک‌اند می‌تواند به شناسایی هدف کمک کند.',
      recommendationFa: 'حذف یا مبهم‌سازی هدرهای Server و X-Powered-By در تنظیمات وب‌سرور.',
    });
  } else {
    checks.push({
      header: 'Server / X-Powered-By Exposure',
      present: false,
      value: 'مخفی (افشا نشده)',
      status: 'pass',
      severity: 'info' as any,
      descriptionFa: 'اطلاعات دقیق نسخه وب‌سرور و فریم‌ورک در هدرها مخفی است.',
      recommendationFa: 'وضعیت مطلوب است.',
    });
  }

  return {
    httpStatus: finalResponse.status,
    finalUrl: currentUrl.toString(),
    serverBanner,
    headers: checks,
  };
}

function formatX509Entity(obj: Record<string, any> | undefined): string | null {
  if (!obj) return null;
  const parts: string[] = [];
  if (obj.CN) parts.push(`CN=${obj.CN}`);
  if (obj.O) parts.push(`O=${obj.O}`);
  if (obj.C) parts.push(`C=${obj.C}`);
  return parts.length > 0 ? parts.join(', ') : JSON.stringify(obj);
}

async function inspectTls(hostname: string, resolvedIp: string, port = 443) {
  return new Promise<any>((resolve) => {
    const socket = tls.connect({
      host: resolvedIp,
      port,
      servername: hostname,
      rejectUnauthorized: false,
      timeout: 6000,
    });

    let settled = false;
    const finish = (payload: any) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(payload);
    };

    socket.once('secureConnect', () => {
      const protocol = socket.getProtocol() || null;
      const cipher = socket.getCipher();
      const cert = socket.getPeerCertificate(false);
      const authorized = socket.authorized;
      const authError = socket.authorizationError ? String(socket.authorizationError) : null;

      let daysRemaining: number | null = null;
      if (cert?.valid_to) {
        const expMs = Date.parse(cert.valid_to);
        if (!Number.isNaN(expMs)) {
          daysRemaining = Math.floor((expMs - Date.now()) / (1000 * 60 * 60 * 24));
        }
      }

      const sanRaw = cert?.subjectaltname || '';
      const sanList = sanRaw
        ? sanRaw
            .split(',')
            .map((s) => s.trim().replace(/^DNS:/i, ''))
            .slice(0, 12)
        : [];

      const findings: { titleFa: string; status: 'pass' | 'warn' | 'fail'; detailFa: string }[] = [];

      if (protocol === 'TLSv1.3' || protocol === 'TLSv1.2') {
        findings.push({
          titleFa: `نسخه پروتکل ${protocol}`,
          status: 'pass',
          detailFa:
            protocol === 'TLSv1.3'
              ? 'جدیدترین و امن‌ترین استاندارد رمزنگاری فعال است.'
              : 'پروتکل TLSv1.2 معتبر است؛ ارتقا به TLSv1.3 پیشنهاد می‌شود.',
        });
      } else {
        findings.push({
          titleFa: `پروتکل قدیمی (${protocol || 'نامشخص'})`,
          status: 'fail',
          detailFa: 'پروتکل‌های قدیمی‌تر از TLS 1.2 آسیب‌پذیر هستند و باید غیرفعال شوند.',
        });
      }

      if (authorized) {
        findings.push({
          titleFa: 'زنجیره اعتماد گواهینامه',
          status: 'pass',
          detailFa: 'گواهینامه توسط مرجع معتبر (CA) امضا شده و با نام دامنه مطابقت دارد.',
        });
      } else {
        findings.push({
          titleFa: 'خطای اعتبارسنجی گواهینامه',
          status: 'fail',
          detailFa: `زنجیره اعتماد معتبر نیست: ${authError || 'خطای نامشخص'}`,
        });
      }

      if (daysRemaining !== null) {
        if (daysRemaining < 0) {
          findings.push({
            titleFa: 'انقضای گواهینامه SSL',
            status: 'fail',
            detailFa: `گواهینامه ${Math.abs(daysRemaining)} روز پیش منقضی شده است.`,
          });
        } else if (daysRemaining <= 21) {
          findings.push({
            titleFa: 'نزدیکی به تاریخ انقضا',
            status: 'warn',
            detailFa: `تنها ${daysRemaining} روز تا انقضای گواهینامه باقی مانده است.`,
          });
        } else {
          findings.push({
            titleFa: 'بازه اعتبار گواهینامه',
            status: 'pass',
            detailFa: `${daysRemaining} روز اعتبار باقی‌مانده دارد.`,
          });
        }
      }

      finish({
        supported: true,
        hostname,
        port,
        protocol,
        cipherName: cipher?.name || null,
        cipherVersion: cipher?.version || null,
        authorized,
        authorizationError: authError,
        subject: formatX509Entity(cert?.subject),
        issuer: formatX509Entity(cert?.issuer),
        validFrom: cert?.valid_from || null,
        validTo: cert?.valid_to || null,
        daysRemaining,
        sanList,
        findings,
      });
    });

    socket.once('timeout', () => {
      finish({
        supported: false,
        hostname,
        port,
        protocol: null,
        cipherName: null,
        cipherVersion: null,
        authorized: false,
        authorizationError: null,
        subject: null,
        issuer: null,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        sanList: [],
        findings: [],
        error: 'اتصال TLS در پورت 443 با وقفه زمانی (Timeout) مواجه شد.',
      });
    });

    socket.once('error', (err) => {
      finish({
        supported: false,
        hostname,
        port,
        protocol: null,
        cipherName: null,
        cipherVersion: null,
        authorized: false,
        authorizationError: null,
        subject: null,
        issuer: null,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        sanList: [],
        findings: [],
        error: `عدم امکان برقراری نشست TLS: ${err.message}`,
      });
    });
  });
}

const STANDARD_PORTS: {
  port: number;
  service: string;
  riskIfOpen: 'high' | 'medium' | 'low' | 'info';
  noteFa: string;
}[] = [
  { port: 21, service: 'FTP', riskIfOpen: 'high', noteFa: 'پروتکل انتقال فایل بدون رمزنگاری؛ جایگزینی با SFTP توصیه می‌شود.' },
  { port: 22, service: 'SSH', riskIfOpen: 'medium', noteFa: 'پورت مدیریت سرور؛ محدودسازی با فایروال و کلید عمومی توصیه می‌شود.' },
  { port: 25, service: 'SMTP', riskIfOpen: 'low', noteFa: 'سرویس ارسال ایمیل؛ تنظیمات Anti-Relay و TLS بررسی شود.' },
  { port: 53, service: 'DNS', riskIfOpen: 'low', noteFa: 'پاسخ‌دهی DNS؛ اطمینان از بسته بودن Open Resolver ضروری است.' },
  { port: 80, service: 'HTTP', riskIfOpen: 'low', noteFa: 'پورت وب غیررمزنگاری شده؛ ریدایرکت دائمی به 443 توصیه می‌شود.' },
  { port: 443, service: 'HTTPS', riskIfOpen: 'info', noteFa: 'پورت استاندارد وب امن.' },
  { port: 3306, service: 'MySQL', riskIfOpen: 'high', noteFa: 'پورت پایگاه داده MySQL نباید از اینترنت عمومی قابل دسترس باشد.' },
  { port: 5432, service: 'PostgreSQL', riskIfOpen: 'high', noteFa: 'پورت پایگاه داده PostgreSQL باید در شبکه داخلی محدود شود.' },
  { port: 6379, service: 'Redis', riskIfOpen: 'high', noteFa: 'سرویس Redis باز در اینترنت ریسک افشای داده دارد.' },
  { port: 8080, service: 'HTTP-Alt', riskIfOpen: 'medium', noteFa: 'پورت جایگزین وب یا پنل مدیریت؛ احراز هویت و TLS بررسی شود.' },
  { port: 8443, service: 'HTTPS-Alt', riskIfOpen: 'low', noteFa: 'پورت جایگزین HTTPS.' },
];

function checkSinglePort(ip: string, port: number, timeoutMs = 1100): Promise<{ state: 'open' | 'closed' | 'timeout'; latencyMs: number | null }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const sock = new net.Socket();
    let done = false;

    const complete = (state: 'open' | 'closed' | 'timeout', withLatency = false) => {
      if (done) return;
      done = true;
      sock.destroy();
      resolve({
        state,
        latencyMs: withLatency ? Date.now() - start : null,
      });
    };

    sock.setTimeout(timeoutMs);
    sock.once('connect', () => complete('open', true));
    sock.once('timeout', () => complete('timeout', false));
    sock.once('error', () => complete('closed', false));
    sock.connect(port, ip);
  });
}

async function inspectPorts(resolvedIp: string) {
  const results = await Promise.all(
    STANDARD_PORTS.map(async (item) => {
      const probe = await checkSinglePort(resolvedIp, item.port);
      return {
        port: item.port,
        service: item.service,
        state: probe.state,
        latencyMs: probe.latencyMs,
        riskLevel: probe.state === 'open' ? item.riskIfOpen : ('info' as const),
        noteFa:
          probe.state === 'open'
            ? item.noteFa
            : probe.state === 'timeout'
            ? 'فیلتر شده یا بدون پاسخ در بازه زمانی کوتاه.'
            : 'پورت بسته است.',
      };
    })
  );
  return results;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'HRSN CyberSec CLI', vendor: 'byhrsn.com' });
  });

  app.post('/api/auth/register', async (req, res) => {
    const { fullName, mobile, organization, byhrsnEndpoint } = req.body || {};
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'لطفاً نام و نام خانوادگی معتبر وارد کنید.' });
    }
    if (!mobile || typeof mobile !== 'string' || !isValidMobile(mobile)) {
      return res.status(400).json({ error: 'شماره موبایل معتبر نیست (مثال: 09123456789).' });
    }

    const normMobile = normalizeMobile(mobile);
    const endpoint =
      typeof byhrsnEndpoint === 'string' && byhrsnEndpoint.trim()
        ? byhrsnEndpoint.trim()
        : DEFAULT_BYHRSN_ENDPOINT;

    const store = ensureStore();
    const existingIdx = store.users.findIndex((u) => u.mobile === normMobile);
    const now = new Date().toISOString();

    const user: StoredUser = {
      id: existingIdx >= 0 ? store.users[existingIdx].id : crypto.randomUUID(),
      fullName: fullName.trim(),
      mobile: normMobile,
      organization: typeof organization === 'string' ? organization.trim() : '',
      registeredAt: existingIdx >= 0 ? store.users[existingIdx].registeredAt : now,
      byhrsnEndpoint: endpoint,
      byhrsnSyncStatus: 'local_only',
      byhrsnSyncMessage: 'در حال بررسی ارتباط با سرور byhrsn.com...',
      lastSyncAttempt: now,
    };

    const syncResult = await attemptByhrsnSync(user, endpoint);
    user.byhrsnSyncStatus = syncResult.status;
    user.byhrsnSyncMessage = syncResult.message;

    if (existingIdx >= 0) {
      store.users[existingIdx] = user;
    } else {
      store.users.push(user);
    }
    saveStore(store);

    return res.json({ user });
  });

  app.post('/api/auth/login', (req, res) => {
    const { mobile } = req.body || {};
    if (!mobile || typeof mobile !== 'string' || !isValidMobile(mobile)) {
      return res.status(400).json({ error: 'فرمت شماره موبایل معتبر نیست.' });
    }
    const normMobile = normalizeMobile(mobile);
    const store = ensureStore();
    const user = store.users.find((u) => u.mobile === normMobile);
    if (!user) {
      return res.status(404).json({ error: 'این شماره موبایل هنوز ثبت‌نام نشده است.' });
    }
    return res.json({ user });
  });

  app.get('/api/auth/user/:mobile', (req, res) => {
    const normMobile = normalizeMobile(req.params.mobile || '');
    const store = ensureStore();
    const user = store.users.find((u) => u.mobile === normMobile);
    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد.' });
    }
    return res.json({ user });
  });

  app.post('/api/auth/sync-byhrsn', async (req, res) => {
    const { mobile, byhrsnEndpoint } = req.body || {};
    const normMobile = normalizeMobile(String(mobile || ''));
    const store = ensureStore();
    const idx = store.users.findIndex((u) => u.mobile === normMobile);
    if (idx < 0) {
      return res.status(404).json({ error: 'حساب کاربری با این شماره موبایل یافت نشد.' });
    }
    const endpoint =
      typeof byhrsnEndpoint === 'string' && byhrsnEndpoint.trim()
        ? byhrsnEndpoint.trim()
        : store.users[idx].byhrsnEndpoint || DEFAULT_BYHRSN_ENDPOINT;

    const syncResult = await attemptByhrsnSync(store.users[idx], endpoint);
    store.users[idx].byhrsnEndpoint = endpoint;
    store.users[idx].byhrsnSyncStatus = syncResult.status;
    store.users[idx].byhrsnSyncMessage = syncResult.message;
    store.users[idx].lastSyncAttempt = new Date().toISOString();
    saveStore(store);

    return res.json({ user: store.users[idx] });
  });

  app.get('/api/projects', (req, res) => {
    const mobile = req.query.mobile ? normalizeMobile(String(req.query.mobile)) : null;
    const store = ensureStore();
    const projects = mobile
      ? store.projects.filter((p) => p.ownerMobile === mobile)
      : store.projects;
    return res.json({ projects: [...projects].reverse() });
  });

  app.post('/api/projects', (req, res) => {
    const { name, targetUrl, clientName, description, ownerMobile } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'نام پروژه باید حداقل ۲ کاراکتر باشد.' });
    }
    if (!ownerMobile || !isValidMobile(String(ownerMobile))) {
      return res.status(400).json({ error: 'شماره موبایل مالک پروژه معتبر نیست.' });
    }

    let formattedUrl = typeof targetUrl === 'string' ? targetUrl.trim() : '';
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const project: StoredProject = {
      id: crypto.randomUUID(),
      name: name.trim(),
      targetUrl: formattedUrl,
      clientName: typeof clientName === 'string' ? clientName.trim() : '',
      description: typeof description === 'string' ? description.trim() : '',
      ownerMobile: normalizeMobile(String(ownerMobile)),
      createdAt: new Date().toISOString(),
    };

    const store = ensureStore();
    store.projects.push(project);
    saveStore(store);
    return res.json({ project });
  });

  app.delete('/api/projects/:id', (req, res) => {
    const store = ensureStore();
    const exists = store.projects.some((p) => p.id === req.params.id);
    if (!exists) {
      return res.status(404).json({ error: 'پروژه یافت نشد.' });
    }
    store.projects = store.projects.filter((p) => p.id !== req.params.id);
    store.scans = store.scans.filter((s) => s.projectId !== req.params.id);
    saveStore(store);
    return res.json({ deleted: true });
  });

  app.get('/api/scans', (req, res) => {
    const projectId = req.query.projectId ? String(req.query.projectId) : null;
    const mobile = req.query.mobile ? normalizeMobile(String(req.query.mobile)) : null;
    const store = ensureStore();
    let list = store.scans;
    if (projectId) list = list.filter((s) => s.projectId === projectId);
    if (mobile) list = list.filter((s) => s.executedByMobile === mobile);
    return res.json({ scans: [...list].reverse() });
  });

  app.post('/api/scans/run', async (req, res) => {
    const startedAt = Date.now();
    const {
      targetUrl,
      projectId,
      projectName,
      mobile,
      authorized,
      modules = { headers: true, tls: true, ports: true },
    } = req.body || {};

    if (!authorized) {
      return res.status(400).json({
        error: 'تایید مجوز قانونی و مالکیت یا اجازه تست امنیت دامنه الزامی است.',
      });
    }
    if (!mobile || !isValidMobile(String(mobile))) {
      return res.status(400).json({ error: 'ابتدا باید با شماره موبایل ثبت‌نام کنید.' });
    }

    let rawTarget = typeof targetUrl === 'string' ? targetUrl.trim() : '';
    if (!rawTarget) {
      return res.status(400).json({ error: 'آدرس وب‌سایت هدف را وارد کنید.' });
    }
    if (!/^https?:\/\//i.test(rawTarget)) {
      rawTarget = `https://${rawTarget}`;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawTarget);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: 'فقط پروتکل‌های HTTP و HTTPS پشتیبانی می‌شوند.' });
      }
    } catch {
      return res.status(400).json({ error: 'فرمت آدرس URL معتبر نیست.' });
    }

    let resolved: { ip: string; family: 4 | 6 };
    try {
      resolved = await resolvePublicHost(parsedUrl.hostname);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'میزبان قابل بررسی نیست.' });
    }

    const cliLines: string[] = [
      `$ hrsn-cybersec --target ${parsedUrl.toString()} --project "${projectName || 'General'}"`,
      `[INFO] Target Host: ${parsedUrl.hostname} (${resolved.ip})`,
      `[INFO] Auditor Mobile: ${normalizeMobile(String(mobile))} | Vendor: byhrsn.com`,
    ];

    let httpStatus: number | null = null;
    let finalUrl: string | null = null;
    let serverBanner: string | null = null;
    let headers: any[] = [];
    let headersError: string | undefined;

    if (modules.headers) {
      cliLines.push('[STEP] Inspecting HTTP response security headers...');
      try {
        const httpRes = await inspectHttpHeaders(parsedUrl);
        httpStatus = httpRes.httpStatus;
        finalUrl = httpRes.finalUrl;
        serverBanner = httpRes.serverBanner;
        headers = httpRes.headers;
        cliLines.push(`[HTTP] Status ${httpStatus} -> ${finalUrl}`);
        for (const h of headers) {
          const tag = h.status === 'pass' ? 'PASS' : h.status === 'fail' ? 'FAIL' : 'WARN';
          cliLines.push(`  [${tag}] ${h.header}: ${h.value ?? 'Missing'}`);
        }
      } catch (err: any) {
        headersError = err?.message || 'خطا در اتصال HTTP';
        cliLines.push(`[ERR ] HTTP check failed: ${headersError}`);
      }
    }

    let tlsResult: any = null;
    if (modules.tls) {
      const tlsPort = parsedUrl.port ? Number(parsedUrl.port) : 443;
      cliLines.push(`[STEP] Analyzing SSL/TLS handshake on port ${tlsPort}...`);
      tlsResult = await inspectTls(parsedUrl.hostname, resolved.ip, tlsPort);
      if (tlsResult.supported) {
        cliLines.push(
          `  [TLS ] Protocol=${tlsResult.protocol} | Cipher=${tlsResult.cipherName} | Valid=${tlsResult.daysRemaining}d`
        );
      } else {
        cliLines.push(`  [WARN] TLS handshake failed: ${tlsResult.error}`);
      }
    }

    let portsResult: any[] = [];
    if (modules.ports) {
      cliLines.push('[STEP] Probing standard service ports (defensive surface check)...');
      portsResult = await inspectPorts(resolved.ip);
      const openList = portsResult.filter((p) => p.state === 'open');
      if (openList.length === 0) {
        cliLines.push('  [INFO] No common service ports responded as open.');
      } else {
        for (const p of openList) {
          cliLines.push(`  [OPEN] ${p.port}/tcp (${p.service}) - ${p.latencyMs}ms`);
        }
      }
    }

    let passed = 0;
    let warnings = 0;
    let failed = 0;

    for (const h of headers) {
      if (h.status === 'pass') passed++;
      else if (h.status === 'warn') warnings++;
      else if (h.status === 'fail') failed++;
    }

    if (tlsResult) {
      if (!tlsResult.supported) {
        failed++;
      } else {
        for (const f of tlsResult.findings) {
          if (f.status === 'pass') passed++;
          else if (f.status === 'warn') warnings++;
          else if (f.status === 'fail') failed++;
        }
      }
    }

    const openPorts = portsResult.filter((p) => p.state === 'open');
    for (const p of openPorts) {
      if (p.riskLevel === 'high') failed++;
      else if (p.riskLevel === 'medium') warnings++;
    }

    const durationMs = Date.now() - startedAt;
    cliLines.push(`[DONE] Audit completed in ${durationMs}ms (Pass=${passed}, Warn=${warnings}, Fail=${failed})`);

    const scanRecord = {
      id: crypto.randomUUID(),
      projectId: projectId || 'quick-scan',
      projectName: projectName || 'اسکن سریع',
      targetUrl: parsedUrl.toString(),
      hostname: parsedUrl.hostname,
      executedByMobile: normalizeMobile(String(mobile)),
      timestamp: new Date().toISOString(),
      durationMs,
      modules: {
        headers: Boolean(modules.headers),
        tls: Boolean(modules.tls),
        ports: Boolean(modules.ports),
      },
      httpStatus,
      finalUrl,
      serverBanner,
      headers,
      headersError,
      tls: tlsResult,
      ports: portsResult,
      summary: {
        passed,
        warnings,
        failed,
        openPorts: openPorts.length,
      },
      cliLines,
    };

    const store = ensureStore();
    store.scans.push(scanRecord);
    if (store.scans.length > 200) {
      store.scans = store.scans.slice(-200);
    }
    saveStore(store);

    return res.json({ scan: scanRecord });
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrDisabled ? false : { server: httpServer },
        ws: hmrDisabled ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '127.0.0.1', () => {
    console.log(`HRSN CyberSec server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
