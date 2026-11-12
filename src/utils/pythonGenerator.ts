export interface PythonCliConfig {
  defaultSyncUrl: string;
  defaultProject: string;
  includePorts: string;
}

export function generatePythonCliScript(config: PythonCliConfig): string {
  const syncUrl = config.defaultSyncUrl || 'https://byhrsn.com/api/v1/cli-register';
  const defaultProj = config.defaultProject || 'default-audit';
  const ports = config.includePorts || '21,22,25,53,80,443,3306,5432,6379,8080,8443';

  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HRSN CyberSec CLI - Web Security Header, SSL/TLS & Service Port Auditor
Creator: byhrsn.com
Platform: Windows / Cross-platform Python 3.10+ (Standard Library Only)

Usage:
  python hrsn_cli.py --target https://example.com --project prod-audit --txt --json
  python hrsn_cli.py --guide
"""

import argparse
import datetime
import ipaddress
import json
import os
import re
import socket
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

APP_NAME = "HRSN CyberSec CLI"
CREATOR_SITE = "byhrsn.com"
DEFAULT_SYNC_URL = "${syncUrl}"
DATA_DIR = Path.home() / ".hrsn_cybersec"
PROFILE_FILE = DATA_DIR / "profile.json"
PROJECTS_DIR = DATA_DIR / "projects"

DEFAULT_PORTS = {
    21: ("FTP", "high", "پروتکل غیررمزنگاری شده؛ در صورت عدم نیاز مسدود شود."),
    22: ("SSH", "medium", "دسترسی مدیریتی؛ محدودسازی IP و کلید SSH توصیه می‌شود."),
    25: ("SMTP", "low", "سرویس ایمیل؛ تنظیمات SPF/DKIM/DMARC بررسی شود."),
    53: ("DNS", "low", "سرویس نام دامنه؛ از باز بودن Open Resolver جلوگیری شود."),
    80: ("HTTP", "low", "توصیه می‌شود تمام ترافیک به HTTPS (443) ریدایرکت شود."),
    443: ("HTTPS", "info", "پورت استاندارد وب امن؛ پیکربندی TLS بررسی شود."),
    3306: ("MySQL", "high", "پایگاه داده نباید مستقیماً در اینترنت عمومی باز باشد."),
    5432: ("PostgreSQL", "high", "پایگاه داده نباید مستقیماً در اینترنت عمومی باز باشد."),
    6379: ("Redis", "high", "سرویس کش نباید بدون احراز هویت در اینترنت باز باشد."),
    8080: ("HTTP-Alt", "medium", "پورت جایگزین وب؛ سطح دسترسی ادمین بررسی شود."),
    8443: ("HTTPS-Alt", "low", "پورت جایگزین HTTPS؛ گواهینامه TLS بررسی شود."),
}

SECURITY_HEADERS = [
    ("Strict-Transport-Security", "high", "اجباری کردن HTTPS با HSTS (min max-age=31536000)"),
    ("Content-Security-Policy", "high", "سیاست CSP برای کاهش ریسک XSS و تزریق اسکریپت"),
    ("X-Frame-Options", "medium", "جلوگیری از حملات Clickjacking (DENY یا SAMEORIGIN)"),
    ("X-Content-Type-Options", "medium", "جلوگیری از MIME-Sniffing با مقدار nosniff"),
    ("Referrer-Policy", "low", "کنترل ارسال آدرس ارجاع‌دهنده (strict-origin-when-cross-origin)"),
    ("Permissions-Policy", "low", "محدودسازی دسترسی مرورگر به دوربین، میکروفون و موقعیت"),
    ("Cross-Origin-Opener-Policy", "low", "ایزوله‌سازی پنجره‌های Cross-Origin (same-origin)"),
]


def ensure_storage():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)


def validate_mobile(mobile: str) -> bool:
    cleaned = re.sub(r"[\\s\\-()]", "", mobile.strip())
    return bool(re.match(r"^(\\+?98|0)?9\\d{9}$", cleaned)) or bool(re.match(r"^\\+\\d{8,15}$", cleaned))


def sync_registration_byhrsn(profile: dict, sync_url: str) -> dict:
    payload = json.dumps({
        "app": APP_NAME,
        "full_name": profile.get("full_name"),
        "mobile": profile.get("mobile"),
        "organization": profile.get("organization", ""),
        "registered_at": profile.get("registered_at"),
        "source": "windows_python_cli",
    }).encode("utf-8")
    req = urllib.request.Request(
        sync_url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "HRSN-CyberSec-CLI/1.0 (+https://byhrsn.com)",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            return {"status": "synced", "http_code": resp.status, "message": "Synced with byhrsn.com"}
    except Exception as exc:
        return {"status": "local_only", "http_code": None, "message": f"Saved locally (remote sync unavailable: {exc})"}


def register_or_load_user(sync_url: str, force_register: bool = False) -> dict:
    ensure_storage()
    if PROFILE_FILE.exists() and not force_register:
        with open(PROFILE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)

    print("=" * 68)
    print(f"  {APP_NAME} - Initial Registration ({CREATOR_SITE})")
    print("=" * 68)
    full_name = input("Full Name / Specialist Name: ").strip()
    while not full_name:
        full_name = input("Name cannot be empty. Full Name: ").strip()

    mobile = input("Mobile Number (e.g. 09123456789): ").strip()
    while not validate_mobile(mobile):
        print("[WARN] Invalid mobile format. Use 09xxxxxxxxx or +989xxxxxxxxx.")
        mobile = input("Mobile Number: ").strip()

    organization = input("Organization / Team (optional): ").strip()
    auth_confirm = input("Confirm authorized defensive auditing only? [y/N]: ").strip().lower()
    if auth_confirm not in ("y", "yes"):
        print("[ABORT] Authorization confirmation is required.")
        sys.exit(1)

    profile = {
        "full_name": full_name,
        "mobile": mobile,
        "organization": organization,
        "registered_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "sync_endpoint": sync_url,
    }
    sync_res = sync_registration_byhrsn(profile, sync_url)
    profile["byhrsn_sync"] = sync_res

    with open(PROFILE_FILE, "w", encoding="utf-8") as f:
        json.dump(profile, f, ensure_ascii=False, indent=2)

    print(f"[PASS] Profile saved to {PROFILE_FILE}")
    print(f"[INFO] byhrsn.com sync status: {sync_res['status']} ({sync_res['message']})")
    return profile


def is_private_host(hostname: str) -> bool:
    try:
        ip_str = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(ip_str)
        return (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_reserved
            or ip_obj.is_multicast
        )
    except Exception:
        return False


def audit_http_headers(target_url: str) -> dict:
    req = urllib.request.Request(
        target_url,
        headers={"User-Agent": "HRSN-CyberSec-CLI/1.0 (Defensive Security Audit; +https://byhrsn.com)"},
        method="GET",
    )
    results = []
    http_status = None
    final_url = target_url
    server_banner = None
    err = None

    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            http_status = resp.status
            final_url = resp.geturl()
            raw_headers = {k.lower(): v for k, v in resp.headers.items()}
            server_banner = raw_headers.get("server") or raw_headers.get("x-powered-by")

            for header_name, severity, rec in SECURITY_HEADERS:
                val = raw_headers.get(header_name.lower())
                results.append({
                    "header": header_name,
                    "present": val is not None,
                    "value": val,
                    "status": "pass" if val is not None else ("fail" if severity == "high" else "warn"),
                    "severity": severity,
                    "recommendation": rec,
                })
    except urllib.error.HTTPError as he:
        http_status = he.code
        raw_headers = {k.lower(): v for k, v in he.headers.items()} if he.headers else {}
        server_banner = raw_headers.get("server")
        for header_name, severity, rec in SECURITY_HEADERS:
            val = raw_headers.get(header_name.lower())
            results.append({
                "header": header_name,
                "present": val is not None,
                "value": val,
                "status": "pass" if val is not None else ("fail" if severity == "high" else "warn"),
                "severity": severity,
                "recommendation": rec,
            })
    except Exception as exc:
        err = str(exc)

    return {
        "http_status": http_status,
        "final_url": final_url,
        "server_banner": server_banner,
        "headers": results,
        "error": err,
    }


def audit_tls(hostname: str, port: int = 443) -> dict:
    ctx = ssl.create_default_context()
    try:
        with socket.create_connection((hostname, port), timeout=6) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                cipher = ssock.cipher()
                protocol = ssock.version()
                not_after = cert.get("notAfter") if cert else None
                days_remaining = None
                if not_after:
                    exp_dt = datetime.datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=datetime.timezone.utc)
                    days_remaining = (exp_dt - datetime.datetime.now(datetime.timezone.utc)).days
                return {
                    "supported": True,
                    "protocol": protocol,
                    "cipher": cipher[0] if cipher else None,
                    "subject": dict(x[0] for x in cert.get("subject", [])) if cert else {},
                    "issuer": dict(x[0] for x in cert.get("issuer", [])) if cert else {},
                    "valid_to": not_after,
                    "days_remaining": days_remaining,
                    "error": None,
                }
    except Exception as exc:
        return {"supported": False, "error": str(exc)}


def audit_ports(hostname: str, port_list: list) -> list:
    findings = []
    for port in port_list:
        meta = DEFAULT_PORTS.get(port, ("Custom", "info", "پورت سفارشی بررسی شد."))
        start = time.perf_counter()
        state = "closed"
        latency = None
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1.2)
        try:
            res = s.connect_ex((hostname, port))
            latency = round((time.perf_counter() - start) * 1000, 1)
            if res == 0:
                state = "open"
        except socket.timeout:
            state = "timeout"
        except Exception:
            state = "closed"
        finally:
            s.close()

        findings.append({
            "port": port,
            "service": meta[0],
            "state": state,
            "latency_ms": latency,
            "risk_level": meta[1] if state == "open" else "info",
            "note": meta[2],
        })
    return findings


def export_reports(report: dict, project_dir: Path, write_txt: bool, write_json: bool):
    project_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    base = f"hrsn_audit_{report['hostname']}_{ts}"

    if write_json:
        json_path = project_dir / f"{base}.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f"[EXPORT] JSON saved: {json_path}")

    if write_txt:
        txt_path = project_dir / f"{base}.txt"
        lines = [
            "======================================================================",
            f"  {APP_NAME} - Security Audit Report ({CREATOR_SITE})",
            "======================================================================",
            f"Project       : {report['project']}",
            f"Target URL    : {report['target_url']}",
            f"Hostname      : {report['hostname']}",
            f"Auditor Mobile: {report['auditor_mobile']}",
            f"Timestamp     : {report['timestamp']}",
            "",
            "[1] HTTP Security Headers",
            "-" * 70,
        ]
        for h in report["http"]["headers"]:
            mark = "PASS" if h["present"] else "MISS"
            lines.append(f"  [{mark}] {h['header']:30s} -> {h['value'] or h['recommendation']}")
        lines.extend(["", "[2] SSL/TLS Configuration", "-" * 70])
        tls = report["tls"]
        if tls.get("supported"):
            lines.append(f"  Protocol       : {tls.get('protocol')}")
            lines.append(f"  Cipher         : {tls.get('cipher')}")
            lines.append(f"  Expires In     : {tls.get('days_remaining')} days ({tls.get('valid_to')})")
        else:
            lines.append(f"  TLS Error      : {tls.get('error')}")
        lines.extend(["", "[3] Service Port Surface Audit", "-" * 70])
        for p in report["ports"]:
            lines.append(f"  Port {p['port']:5d} ({p['service']:10s}) -> {p['state'].upper():7s} | {p['note']}")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write("\\n".join(lines))
        print(f"[EXPORT] TXT  saved: {txt_path}")


def print_guide():
    print("""
HRSN CyberSec CLI - User Guide (byhrsn.com)
----------------------------------------------------------------------
1. Registration:
   First launch prompts for your name and mobile number and stores the
   profile in ~/.hrsn_cybersec/profile.json while syncing with byhrsn.com.
2. Create Project & Run Audit:
   python hrsn_cli.py -t https://example.com -p client-portal --txt --json
3. Build Windows Executable (.exe):
   pip install pyinstaller
   pyinstaller --onefile --name hrsn-cybersec hrsn_cli.py
4. Options:
   -t, --target    Target URL (e.g. https://example.com)
   -p, --project   Project folder name (default: ${defaultProj})
   --ports         Comma-separated ports (default: ${ports})
   --txt           Export human-readable .txt report
   --json          Export structured .json report
   --register      Re-run mobile registration
   --guide         Show this user guide
""")


def main():
    parser = argparse.ArgumentParser(description=f"{APP_NAME} ({CREATOR_SITE})")
    parser.add_argument("-t", "--target", help="Target URL to audit (e.g. https://example.com)")
    parser.add_argument("-p", "--project", default="${defaultProj}", help="Project name")
    parser.add_argument("--ports", default="${ports}", help="Comma-separated port list")
    parser.add_argument("--txt", action="store_true", help="Export TXT report")
    parser.add_argument("--json", action="store_true", help="Export JSON report")
    parser.add_argument("--register", action="store_true", help="Re-register mobile profile")
    parser.add_argument("--sync-url", default=DEFAULT_SYNC_URL, help="Registration sync URL")
    parser.add_argument("--guide", action="store_true", help="Display user manual")
    args = parser.parse_args()

    if args.guide:
        print_guide()
        return

    profile = register_or_load_user(args.sync_url, force_register=args.register)
    target = args.target or input("Target URL (e.g. https://example.com): ").strip()
    if not target.startswith(("http://", "https://")):
        target = "https://" + target

    parsed = urllib.parse.urlparse(target)
    hostname = parsed.hostname
    if not hostname:
        print("[ERROR] Invalid URL.")
        sys.exit(1)

    if is_private_host(hostname):
        print("[BLOCKED] Private/loopback IP ranges are blocked by safety policy.")
        sys.exit(1)

    port_list = [int(x.strip()) for x in args.ports.split(",") if x.strip().isdigit()]
    print(f"\\n[INFO] Starting HRSN Audit for {target} (Project: {args.project})")

    http_res = audit_http_headers(target)
    tls_res = audit_tls(hostname, parsed.port or 443)
    port_res = audit_ports(hostname, port_list)

    report = {
        "tool": APP_NAME,
        "vendor": CREATOR_SITE,
        "project": args.project,
        "target_url": target,
        "hostname": hostname,
        "auditor_mobile": profile.get("mobile"),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "http": http_res,
        "tls": tls_res,
        "ports": port_res,
    }

    for h in http_res["headers"]:
        tag = "PASS" if h["present"] else "WARN"
        print(f"  [{tag}] {h['header']}: {h['value'] or 'Missing'}")
    if tls_res.get("supported"):
        print(f"  [PASS] TLS {tls_res.get('protocol')} | Expires in {tls_res.get('days_remaining')} days")
    else:
        print(f"  [WARN] TLS Check: {tls_res.get('error')}")
    for p in port_res:
        if p["state"] == "open":
            print(f"  [OPEN] Port {p['port']} ({p['service']}) - {p['note']}")

    write_txt = args.txt or (not args.txt and not args.json)
    write_json = args.json or (not args.txt and not args.json)
    export_reports(report, PROJECTS_DIR / args.project, write_txt, write_json)


if __name__ == "__main__":
    main()
`;
}

export function generateWindowsBatchScript(): string {
  return `@echo off
title HRSN CyberSec CLI - Windows Builder (byhrsn.com)
echo ============================================================
echo   HRSN CyberSec CLI - Windows Executable Builder
echo   Website: https://byhrsn.com
echo ============================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 3.10+ is not installed or not in PATH.
    pause
    exit /b 1
)

echo [1/3] Checking PyInstaller...
python -m pip install --upgrade pyinstaller >nul 2>&1

echo [2/3] Building hrsn-cybersec.exe ...
pyinstaller --onefile --console --name hrsn-cybersec hrsn_cli.py

if errorlevel 1 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Build completed successfully!
echo Executable created at: dist\\hrsn-cybersec.exe
echo Run: dist\\hrsn-cybersec.exe --guide
pause
`;
}
