/** Centralized API client for the LexAI backend. */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const DEFAULT_TIMEOUT_MS = 60_000;  // 60s — embedding can be slow on first run

// ── Helpers ──────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lexai_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (res.status === 204) return undefined as T;

    const data = await res.json();

    if (!res.ok) {
      const msg =
        typeof data?.detail === "string"
          ? data.detail
          : Array.isArray(data?.detail)
            ? data.detail.map((e: { msg: string }) => e.msg).join(", ")
            : res.statusText;
      throw new Error(msg);
    }

    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

// ── Auth ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export async function loginUser(payload: LoginPayload): Promise<TokenResponse> {
  const formBody = new URLSearchParams();
  formBody.append("username", payload.username);
  formBody.append("password", payload.password);

  const res = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.detail || "Login failed");
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<{ message: string }> {
  return request("/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  return request("/users/me");
}

// ── Cases ────────────────────────────────────────────────────────────

export interface CaseData {
  id: string;
  user_id: number;
  caseName: string;
  claimType: string;
  currentStage: string;
  plaintiffName: string;
  plaintiffCounsel: string;
  defenseName: string;
  defenseCounsel: string;
  state: string;
  court: string;
  county: string;
  trialDate: string;
  summary: string;
  analysis: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCasePayload {
  caseName: string;
  claimType?: string;
  currentStage?: string;
  plaintiffName?: string;
  plaintiffCounsel?: string;
  defenseName?: string;
  defenseCounsel?: string;
  state?: string;
  court?: string;
  county?: string;
  trialDate?: string;
  summary?: string;
}

export async function fetchCases(): Promise<CaseData[]> {
  return request("/cases/");
}

export async function fetchCase(caseId: string): Promise<CaseData> {
  return request(`/cases/${caseId}`);
}

export async function createCase(payload: CreateCasePayload): Promise<CaseData> {
  return request("/cases/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCase(caseId: string, payload: Partial<CreateCasePayload & { analysis: string }>): Promise<CaseData> {
  return request(`/cases/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCase(caseId: string): Promise<void> {
  return request(`/cases/${caseId}`, { method: "DELETE" });
}

// ── Dashboard ────────────────────────────────────────────────────────

export interface DashboardStats {
  totalCases: number;
  totalDocuments: number;
  totalAnalyses: number;
  totalReports: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return request("/dashboard/stats");
}

// ── Documents ────────────────────────────────────────────────────────

export async function uploadDocuments(files: File[], caseId?: string): Promise<unknown> {
  const formData = new FormData();

  files.forEach((f) => formData.append("files", f));
  if (caseId) formData.append("case_id", caseId);
  return request("/upload-documents", {
    method: "POST",
    body: formData,
  }, 180_000);  // 3 min timeout — embeddings take time
}

// ── Documents CRUD ───────────────────────────────────────────────────

export interface DocumentData {
  id: string;
  userId: number;
  caseId: string | null;
  filename: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  pageCount: number;
  chunksCount: number;
  qdrantDocumentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchDocuments(caseId?: string): Promise<DocumentData[]> {
  const query = caseId ? `?case_id=${encodeURIComponent(caseId)}` : "";
  return request(`/documents/${query}`);
}

export async function deleteDocument(documentId: string): Promise<void> {
  return request(`/documents/${documentId}`, { method: "DELETE" });
}

// ── Module 3 — Case Analysis ──────────────────────────────────────────

/** One extracted fact from the 7-agent pipeline. */
export interface AnalysisFact {
  id: string;
  statement: string;
  source_document: string | null;
  page: string | null;
  importance: number;
  disputed: boolean;
  confidence: number;
  human_reviewed?: boolean;
}

/** Identified party (plaintiff, defendant, witness, etc.). */
export interface AnalysisParty {
  id: string;
  name: string;
  role: string;
  type: string;
}

/** Legal claim identified from the documents. */
export interface AnalysisClaim {
  id: string;
  claim_type: string;
  legal_basis: string | null;
  elements: string[];
}

/** Link between a claim and a supporting/undermining fact. */
export interface EvidenceLink {
  id: string;
  claim_id: string;
  fact_id: string;
  relationship: "supports" | "undermines";
  weight_score: number;
  rationale: string | null;
}

/** A dated event in the case timeline. */
export interface TimelineEvent {
  id: string;
  date: string | null;
  event: string;
  significance: string | null;
}

/** Contradiction between two facts. */
export interface Contradiction {
  id: string;
  fact_a_id: string;
  fact_b_id: string;
  nature: string | null;
  impact: string | null;
}

/** Assessment of a claim's strength. */
export interface Assessment {
  id: string;
  claim_id: string;
  overall_strength: number;
  strengths: string[];
  weaknesses: string[];
  risk_level: "low" | "medium" | "high" | "critical";
  recommendations: string[];
}

/** Full response from /cases/{id}/analysis endpoints. */
export interface CaseAnalysisResult {
  case_id: string;
  facts: AnalysisFact[];
  parties: AnalysisParty[];
  claims: AnalysisClaim[];
  evidence_links: EvidenceLink[];
  timeline: TimelineEvent[];
  contradictions: Contradiction[];
  assessments: Assessment[];
  status: string;
}

/**
 * Trigger the full 7-agent analysis pipeline.
 * Blocks until all agents finish (may take 30-120 seconds
 * depending on document volume). 5-minute timeout to accommodate
 * Groq rate limits and agent retries.
 */
export async function runCaseAnalysis(caseId: string): Promise<CaseAnalysisResult> {
  return request(`/cases/${caseId}/analyze`, {
    method: "POST",
  }, 300_000);  // 5 min — 7 agents × ~5s sleep + Groq API calls + retries
}

/** Fetch the last analysis result from the database (instant read). */
export async function fetchCaseAnalysis(caseId: string): Promise<CaseAnalysisResult> {
  return request(`/cases/${caseId}/analysis`);
}