export type AuditStatus = 'pass' | 'warn' | 'fail' | 'info';

export interface UserRegistration {
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

export interface Project {
  id: string;
  name: string;
  targetUrl: string;
  clientName: string;
  description: string;
  ownerMobile: string;
  createdAt: string;
}

export interface HeaderCheckItem {
  header: string;
  present: boolean;
  value: string | null;
  status: AuditStatus;
  severity: 'high' | 'medium' | 'low' | 'info';
  descriptionFa: string;
  recommendationFa: string;
}

export interface TlsCheckResult {
  supported: boolean;
  hostname: string;
  port: number;
  protocol: string | null;
  cipherName: string | null;
  cipherVersion: string | null;
  authorized: boolean;
  authorizationError: string | null;
  subject: string | null;
  issuer: string | null;
  validFrom: string | null;
  validTo: string | null;
  daysRemaining: number | null;
  sanList: string[];
  findings: {
    titleFa: string;
    status: AuditStatus;
    detailFa: string;
  }[];
  error?: string;
}

export interface PortCheckItem {
  port: number;
  service: string;
  state: 'open' | 'closed' | 'timeout';
  latencyMs: number | null;
  riskLevel: 'high' | 'medium' | 'low' | 'info';
  noteFa: string;
}

export interface ScanSummary {
  passed: number;
  warnings: number;
  failed: number;
  openPorts: number;
}

export interface ScanRecord {
  id: string;
  projectId: string;
  projectName: string;
  targetUrl: string;
  hostname: string;
  executedByMobile: string;
  timestamp: string;
  durationMs: number;
  modules: {
    headers: boolean;
    tls: boolean;
    ports: boolean;
  };
  httpStatus: number | null;
  finalUrl: string | null;
  serverBanner: string | null;
  headers: HeaderCheckItem[];
  headersError?: string;
  tls: TlsCheckResult | null;
  ports: PortCheckItem[];
  summary: ScanSummary;
  cliLines: string[];
}

export type AppSection =
  | 'scanner'
  | 'projects'
  | 'python-cli'
  | 'guide'
  | 'account';
