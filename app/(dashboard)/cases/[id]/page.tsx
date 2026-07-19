"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Loader2, Scale, Users, Gavel, TrendingUp, Brain, FileSearch, 
  Download, BarChart3, Star, Lightbulb, 
  UserCheck, Quote, Award } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import { DocumentsTable } from "@/components/DocumentsTable";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchCase,
  uploadDocuments,
  runCaseAnalysis,
  fetchCaseAnalysis,
  runJurySimulation,
  fetchLatestJurySimulation,
  downloadJuryReportPdf,
  type CaseData,
  type CaseAnalysisResult,
  type JurySimulationResult,
  type JurorCard,
} from "@/lib/api";

const labelMap: Record<string, string> = {
  caseName: "Case Name",
  claimType: "Claim Type",
  currentStage: "Current Stage",
  plaintiffName: "Plaintiff Name",
  plaintiffCounsel: "Plaintiff Counsel",
  defenseName: "Defense Name",
  defenseCounsel: "Defense Counsel",
  state: "State",
  court: "Court / District",
  county: "County",
  trialDate: "Trial Date",
  summary: "Case Summary",
};

// ── Helpers ──────────────────────────────────────────────────────────

function riskBadge(level: string) {
  const map: Record<string, string> = {
    critical: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    low: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${map[level] || map.medium}`}
    >
      {level.toUpperCase()}
    </span>
  );
}

function strengthColor(score: number) {
  if (score >= 7) return "text-green-600 dark:text-green-400";
  if (score >= 4) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function importanceColor(score: number) {
  if (score >= 8) return "text-red-600 dark:text-red-400 font-semibold";
  if (score >= 5) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

function verdictBadge(verdict: string | null | undefined) {
  if (verdict === "plaintiff") return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  if (verdict === "defense") return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  return "bg-gray-100 text-gray-500 dark:bg-gray-800";
}

function formatCurrency(val: number | null | undefined) {
  if (val == null) return "\u2014";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

// ── Page ─────────────────────────────────────────────────────────────

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const caseId = params?.id ?? "";

  const [caseItem, setCaseItem] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docsRefreshKey, setDocsRefreshKey] = useState(0);

  // ── Analysis state ────────────────────────────────────────────────
  const [analysisResult, setAnalysisResult] = useState<CaseAnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);

  // ── Jury Simulation state ─────────────────────────────────────────
  const [juryResult, setJuryResult] = useState<JurySimulationResult | null>(null);
  const [juryLoading, setJuryLoading] = useState(false);
  const [juryError, setJuryError] = useState<string | null>(null);
  const [selectedJuror, setSelectedJuror] = useState<JurorCard | null>(null);
  const [jurorDialogOpen, setJurorDialogOpen] = useState(false);
  const [juryConfirmOpen, setJuryConfirmOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (!caseId) return;

    fetchCase(caseId)
      .then(setCaseItem)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load case"))
      .finally(() => setLoading(false));

    // Silently fetch existing analysis (empty arrays if none exists)
    fetchCaseAnalysis(caseId)
      .then(setAnalysisResult)
      .catch(() => { /* no analysis yet */ });

    // Silently fetch existing jury simulation
    fetchLatestJurySimulation(caseId)
      .then(setJuryResult)
      .catch(() => { /* no jury simulation yet */ });
  }, [caseId]);

  const handleFileUpload = (uploadedFiles: File[]) => {
    setFiles((prev) => {
      const existing = new Set(
        prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`),
      );
      const newFiles = uploadedFiles.filter(
        (f) => !existing.has(`${f.name}-${f.size}-${f.lastModified}`),
      );
      return [...prev, ...newFiles];
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please upload at least one document before proceeding.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await uploadDocuments(files, caseId);
      setFiles([]);
      setDocsRefreshKey((k) => k + 1);
      alert("Documents uploaded successfully!");

      const updated = await fetchCase(caseId);
      setCaseItem(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ── Analysis handlers ──────────────────────────────────────────────

  const handleRunAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const result = await runCaseAnalysis(caseId);
      setAnalysisResult(result);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Analysis pipeline failed");
    } finally {
      setAnalysisLoading(false);
    }
  };

  // ── Jury Simulation handlers ──────────────────────────────────────

  const handleRunJurySimulation = async () => {
    setJuryLoading(true);
    setJuryError(null);
    try {
      const result = await runJurySimulation(caseId);
      setJuryResult(result);
    } catch (err) {
      setJuryError(err instanceof Error ? err.message : "Jury simulation failed");
    } finally {
      setJuryLoading(false);
    }
  };

  const handleViewJuror = (juror: JurorCard) => {
    setSelectedJuror(juror);
    setJurorDialogOpen(true);
  };

  const handleDownloadReport = async (simId: string) => {
    if (!simId || reportLoading) return;
    setReportLoading(true);
    try {
      const blob = await downloadJuryReportPdf(simId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lexai-report-${caseId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Report download failed:", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────

  function renderFacts() {
    if (!analysisResult || analysisResult.facts.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          Extracted Facts
          <span className="text-xs text-muted-foreground font-normal">
            ({analysisResult.facts.length})
          </span>
        </h3>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Statement</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Page</TableHead>
                <TableHead className="text-center">Importance</TableHead>
                <TableHead className="text-center">Confidence</TableHead>
                <TableHead className="text-center">Disputed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysisResult.facts.map((fact) => (
                <TableRow key={fact.id}>
                 <TableCell className="max-w-[450px] whitespace-normal break-words text-sm leading-relaxed">
  {fact.statement}
</TableCell>
                  <TableCell className="text-xs">{fact.source_document ?? "—"}</TableCell>
                  <TableCell className="text-xs">{fact.page ?? "—"}</TableCell>
                  <TableCell className="text-center text-sm">
                    <span className={importanceColor(fact.importance)}>
                      {fact.importance}/10
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {(fact.confidence * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell className="text-center">
                    {fact.disputed ? (
                      <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">⚠ Yes</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">No</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  function renderParties() {
    if (!analysisResult || analysisResult.parties.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          Identified Parties
          <span className="text-xs text-muted-foreground font-normal">
            ({analysisResult.parties.length})
          </span>
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {analysisResult.parties.map((party) => (
            <div key={party.id} className="rounded-md border p-3 bg-muted/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {party.role}
              </p>
              <p className="font-semibold text-sm mt-0.5">{party.name}</p>
              {party.type && (
                <p className="text-xs text-muted-foreground mt-0.5">{party.type}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderClaims() {
    if (!analysisResult || analysisResult.claims.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          Claims & Assessments
          <span className="text-xs text-muted-foreground font-normal">
            ({analysisResult.claims.length})
          </span>
        </h3>
        <div className="space-y-4">
          {analysisResult.claims.map((claim) => {
            const assessment = analysisResult!.assessments.find(
              (a) => a.claim_id === claim.id,
            );
            return (
              <Card key={claim.id} className="border-muted">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">{claim.claim_type}</CardTitle>
                      {claim.legal_basis && (
                        <CardDescription className="text-xs mt-1">
                          Legal basis: {claim.legal_basis}
                        </CardDescription>
                      )}
                    </div>
                    {assessment && riskBadge(assessment.risk_level)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {/* Elements */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                      Elements
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-sm">
                      {claim.elements.map((el, i) => (
                        <li key={i} className="text-foreground/80">{el}</li>
                      ))}
                    </ul>
                  </div>

                  {assessment && (
                    <>
                      <Separator />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Overall Strength
                          </p>
                          <p className={`text-lg font-bold ${strengthColor(assessment.overall_strength)}`}>
                            {assessment.overall_strength}/10
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Risk Level
                          </p>
                          <div>{riskBadge(assessment.risk_level)}</div>
                        </div>
                      </div>

                      {assessment.strengths.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                            ✓ Strengths
                          </p>
                          <ul className="list-disc list-inside text-sm space-y-0.5">
                            {assessment.strengths.map((s, i) => (
                              <li key={i} className="text-foreground/80">{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {assessment.weaknesses.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                            ✗ Weaknesses
                          </p>
                          <ul className="list-disc list-inside text-sm space-y-0.5">
                            {assessment.weaknesses.map((w, i) => (
                              <li key={i} className="text-foreground/80">{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {assessment.recommendations.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                            → Recommendations
                          </p>
                          <ul className="list-disc list-inside text-sm space-y-0.5">
                            {assessment.recommendations.map((r, i) => (
                              <li key={i} className="text-foreground/80">{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  function renderTimeline() {
    if (!analysisResult || analysisResult.timeline.length === 0) return null;
    const sorted = [...analysisResult.timeline]
      .filter((ev) => ev.date)
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          Case Timeline
          <span className="text-xs text-muted-foreground font-normal">
            ({analysisResult.timeline.length} events)
          </span>
        </h3>
        <div className="relative border-l-2 border-primary/30 ml-4 space-y-6 py-2">
          {sorted.map((ev) => (
            <div key={ev.id} className="relative ml-6">
              <div className="absolute -left-[25px] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
              <p className="text-xs text-muted-foreground font-mono">{ev.date}</p>
              <p className="text-sm font-medium mt-0.5">{ev.event}</p>
              {ev.significance && (
                <p className="text-xs text-muted-foreground mt-0.5 italic">
                  {ev.significance}
                </p>
              )}
            </div>
          ))}
          {analysisResult.timeline.filter((ev) => !ev.date).length > 0 && (
            <div className="ml-6 text-xs text-muted-foreground italic">
              + {analysisResult.timeline.filter((ev) => !ev.date).length} undated event(s)
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderContradictions() {
    if (!analysisResult || analysisResult.contradictions.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          Contradictions Detected
          <span className="text-xs text-muted-foreground font-normal">
            ({analysisResult.contradictions.length})
          </span>
        </h3>
        <div className="space-y-3">
          {analysisResult.contradictions.map((c) => {
            const factA = analysisResult!.facts.find((f) => f.id === c.fact_a_id);
            const factB = analysisResult!.facts.find((f) => f.id === c.fact_b_id);
            return (
              <div key={c.id} className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
                <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
                  {c.nature ?? "Contradiction"}
                </p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded bg-muted/30 p-2.5 border border-destructive/20">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Fact A</p>
                    <p className="text-sm">{factA?.statement ?? c.fact_a_id}</p>
                  </div>
                  <div className="rounded bg-muted/30 p-2.5 border border-destructive/20">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Fact B</p>
                    <p className="text-sm">{factB?.statement ?? c.fact_b_id}</p>
                  </div>
                </div>
                {c.impact && (
                  <p className="mt-2 text-xs text-muted-foreground italic">
                    Impact: {c.impact}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderEvidenceMatrix() {
    if (!analysisResult || analysisResult.evidence_links.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          Evidence Linkage Matrix
          <span className="text-xs text-muted-foreground font-normal">
            ({analysisResult.evidence_links.length} links)
          </span>
        </h3>
        <div className="space-y-2">
          {analysisResult.evidence_links.map((link) => {
            const claim = analysisResult!.claims.find((c) => c.id === link.claim_id);
            const fact = analysisResult!.facts.find((f) => f.id === link.fact_id);
            const isSupport = link.relationship === "supports";
            return (
              <div
                key={link.id}
                className={`rounded-md border p-3 text-sm ${
                  isSupport
                    ? "border-green-200 bg-green-50/60 dark:border-green-800/40 dark:bg-green-950/20"
                    : "border-red-200 bg-red-50/60 dark:border-red-800/40 dark:bg-red-950/20"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 shrink-0 inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      isSupport
                        ? "bg-green-200 text-green-800 dark:bg-green-800/40 dark:text-green-300"
                        : "bg-red-200 text-red-800 dark:bg-red-800/40 dark:text-red-300"
                    }`}
                  >
                    {isSupport ? "+ Support" : "− Undermine"}
                  </span>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-medium truncate">
                      Claim: <span className="font-normal">{claim?.claim_type ?? link.claim_id}</span>
                    </p>
                    <p className="text-muted-foreground line-clamp-2">
                      Fact: {fact?.statement ?? link.fact_id}
                    </p>
                    {link.rationale && (
                      <p className="text-xs text-muted-foreground italic">{link.rationale}</p>
                    )}
                    <p className="text-xs font-mono text-muted-foreground">
                      Weight: {link.weight_score}/10
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Loading…</h1>
        <p className="text-muted-foreground">Retrieving case data…</p>
      </div>
    );
  }

  if (error || !caseItem) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Case Not Found</h1>
        <p className="text-muted-foreground">
          {error || "This case could not be loaded from the server."}
        </p>
        <Button asChild variant="outline">
          <Link href="/cases">Back to Cases</Link>
        </Button>
      </div>
    );
  }

  const displayFields = Object.entries(labelMap).map(([key, label]) => ({
    key,
    label,
    value: (caseItem as unknown as Record<string, unknown>)[key] || "—",
  }));

  const createdAt = caseItem.createdAt ? new Date(caseItem.createdAt) : null;

  return (
    <div className="space-y-6">
      {/* Case Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{caseItem.caseName}</h1>
          <p className="text-sm text-muted-foreground">
            Created{" "}
            {createdAt
              ? `${createdAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })} at ${createdAt.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "—"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/cases">Back to Cases</Link>
          </Button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-3xl mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="findings">AI Findings</TabsTrigger>
          <TabsTrigger value="jury">Jury</TabsTrigger>
          <TabsTrigger value="prediction">Prediction</TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
              <CardDescription>Core metadata and identities for this litigation folder.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {displayFields.map((field) => (
                  <div key={field.key} className="rounded-md border p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium">{field.label}</p>
                    <p className="mt-1 text-sm font-medium">{String(field.value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. DOCUMENTS TAB */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Case Documents</CardTitle>
              <CardDescription>
                Currently managing <strong>{caseItem.documentCount || 0}</strong> indexed document(s).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload Dropzone */}
              <div className="border border-dashed rounded-lg p-4 bg-muted/10">
                <FileUpload onChange={handleFileUpload} />
              </div>

              {/* Integrated Interactive Staged Document Table */}
              <div className="mt-6 rounded-md border overflow-x-auto">
                <Table className="min-w-[550px] sm:min-w-0">
                  <TableCaption>A list of your uploaded documents.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.length > 0 ? (
                      files.map((file, index) => (
                        <TableRow key={`${file.name}-${file.lastModified}`}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="max-w-[250px] truncate font-medium">
                            {file.name}
                          </TableCell>
                          <TableCell className="truncate max-w-[120px]">
                            {file.type || "Unknown"}
                          </TableCell>
                          <TableCell>{formatFileSize(file.size)}</TableCell>
                          <TableCell suppressHydrationWarning>
                            {new Date(file.lastModified).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                              Ready
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <button
                              onClick={() =>
                                setFiles((prev) => prev.filter((_, i) => i !== index))
                              }
                              className="text-sm font-medium text-destructive hover:underline"
                            >
                              Remove
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-8 text-center text-muted-foreground animate-pulse"
                        >
                          No documents staged. Drag & drop files above to start.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Upload button */}
              {files.length > 0 && (
                <div className="flex justify-end pt-2">
                  <Button onClick={handleUpload} disabled={uploading} size="default">
                    {uploading
                      ? "Processing uploads..."
                      : `Commit ${files.length} Document(s) to Case`}
                  </Button>
                </div>
              )}

              {/* Divider + Persisted documents table */}
              <hr className="border-t mt-6" />
              <div className="pt-2">
                <h3 className="text-sm font-semibold mb-3">Uploaded Documents</h3>
                <DocumentsTable caseId={caseId} refreshKey={docsRefreshKey} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. AI FINDINGS TAB — full Module 3 integration */}
        <TabsContent value="findings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle>AI Findings & Analysis</CardTitle>
                  <CardDescription>
                    Multi-agent analysis: facts, parties, claims, evidence, timeline,
                    contradictions & scoring.
                  </CardDescription>
                </div>
                <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={analysisLoading}
                      size="default"
                      variant={analysisResult ? "destructive" : "default"}
                      onClick={() => setAnalysisDialogOpen(true)}
                    >
                      {analysisLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Running Analysis…
                        </>
                      ) : analysisResult ? (
                        <>
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Re-run Analysis
                        </>
                      ) : (
                        "Run Full Analysis"
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        {analysisResult
                          ? "Re-run Analysis?"
                          : "Run Full Analysis?"}
                      </DialogTitle>
                      <DialogDescription>
                        This will **permanently delete** all previous analysis
                        data for this case — facts, parties, claims, evidence
                        links, timeline, contradictions, and assessments —
                        before regenerating everything from scratch.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAnalysisDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setAnalysisDialogOpen(false);
                          handleRunAnalysis();
                        }}
                      >
                        Yes, {analysisResult ? "Re-run" : "Run"} Analysis
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {analysisError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {analysisError}
                </div>
              )}

              {analysisLoading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Running 7-agent pipeline — this may take 1–3 minutes…</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-3/5 rounded-full bg-primary animate-pulse" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Agents: Facts → Parties → Claims → Evidence Linkage → Timeline →
                    Contradictions → Scoring
                  </p>
                  <Separator />
                </div>
              )}

              {!analysisResult && !analysisLoading && !analysisError && (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  <p className="mb-2">No analysis has been run yet.</p>
                  <p>Upload documents to this case first, then click &quot;Run Full Analysis&quot; above.</p>
                </div>
              )}

              {analysisResult && !analysisLoading && (
                <>
                  {/* Summary stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Facts", count: analysisResult.facts.length },
                      { label: "Parties", count: analysisResult.parties.length },
                      { label: "Claims", count: analysisResult.claims.length },
                      { label: "Assessments", count: analysisResult.assessments.length },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-md border bg-muted/20 p-3 text-center">
                        <p className="text-2xl font-bold">{stat.count}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Parties */}
                  {renderParties()}
                  {renderParties() && <Separator />}

                  {/* Claims + Assessments */}
                  {renderClaims()}
                  {renderClaims() && <Separator />}

                  {/* Evidence Matrix */}
                  {renderEvidenceMatrix()}
                  {renderEvidenceMatrix() && <Separator />}

                  {/* Facts table */}
                  {renderFacts()}
                  {renderFacts() && <Separator />}

                  {/* Timeline */}
                  {renderTimeline()}
                  {renderTimeline() && <Separator />}

                  {/* Contradictions */}
                  {renderContradictions()}
                  {renderContradictions() && <Separator />}

                  {/* Status footer */}
                  <p className="text-xs text-muted-foreground text-right">
                    Status: {analysisResult.status}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. JURY TAB — Full Interactive Simulation */}
        <TabsContent value="jury" className="space-y-6">
          {/* Header + Run button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Jury Simulation
              </h2>
              <p className="text-sm text-muted-foreground">
                AI-powered mock jury panel &mdash; 12 personas deliberate on the case evidence
              </p>
            </div>
            <Dialog open={juryConfirmOpen} onOpenChange={setJuryConfirmOpen}>
              <DialogTrigger asChild>
                <Button disabled={juryLoading} size="default" variant={juryResult ? "outline" : "default"} onClick={() => setJuryConfirmOpen(true)}>
                  {juryLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Simulation&hellip;</>
                  ) : juryResult ? (
                    <><Users className="mr-2 h-4 w-4" /> Re-run Simulation</>
                  ) : (
                    <><Gavel className="mr-2 h-4 w-4" /> Run Jury Simulation</>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    {juryResult ? "Re-run Jury Simulation?" : "Run Jury Simulation?"}
                  </DialogTitle>
                  <DialogDescription>
                    This will generate a 12-person jury panel, create individual personas, and run
                    AI-powered deliberation. Each juror evaluates the case independently and casts a
                    verdict. The process may take 2&ndash;5 minutes.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setJuryConfirmOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => { setJuryConfirmOpen(false); handleRunJurySimulation(); }}>
                    Yes, Run Simulation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {juryError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {juryError}
            </div>
          )}

          {juryLoading && (
            <div className="space-y-4 rounded-lg border p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Running Jury Simulation&hellip;</span>
              </div>
              <div className="space-y-2">
                {[
                  "Generating Personas",
                  "Evaluating Evidence",
                  "Evaluating Witnesses",
                  "Running Deliberation",
                  "Generating Verdict Prediction",
                  "Generating Final Report",
                  "Saving Results",
                ].map((step, i) => (
                  <div key={step} className="flex items-center gap-2 text-sm">
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
                      i <= 1 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 animate-pulse" : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                    <span className={i <= 1 ? "text-foreground font-medium" : "text-muted-foreground"}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!juryResult && !juryLoading && !juryError && (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              <Users className="mx-auto h-8 w-8 mb-2 opacity-40" />
              <p className="mb-2">No jury simulation has been run yet.</p>
              <p>Run the AI analysis pipeline first, then click &quot;Run Jury Simulation&quot; above.</p>
            </div>
          )}

          {juryResult && !juryLoading && (
            <>
              <JurorVerdictSplit result={juryResult} />
              <JurorStatsRow result={juryResult} />
              <VerdictPredictionCard result={juryResult} />
              <JurorGrid jurors={juryResult.jurors} onViewJuror={handleViewJuror} />
              <AggregationPanels aggregation={juryResult.aggregation ?? {
              plaintiff_votes: juryResult.simulation.plaintiff_votes,
              defense_votes: juryResult.simulation.defense_votes,
              confidence: juryResult.simulation.confidence,
              evidence_influence: [],
              witness_credibility_ranking: [],
              common_themes: [],
            }} simulation={juryResult.simulation} onExportPdf={handleDownloadReport} exportingPdf={reportLoading} />
            </>
          )}

          {/* Juror Detail Dialog */}
          <Dialog open={jurorDialogOpen} onOpenChange={setJurorDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {selectedJuror?.persona.name ?? "Juror Detail"}
                </DialogTitle>
              </DialogHeader>
              {selectedJuror && <JurorDetailContent juror={selectedJuror} />}
            </DialogContent>
          </Dialog>
        </TabsContent>
      {/* 5. VERDICT PREDICTION TAB */}
        <TabsContent value="prediction" className="space-y-6">
          {!juryResult && (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              <Award className="mx-auto h-8 w-8 mb-2 opacity-40" />
              <p className="mb-2">No verdict prediction available.</p>
              <p>Run a jury simulation first to generate a prediction.</p>
            </div>
          )}
          {juryResult?.aggregation?.verdict_prediction && (
            <VerdictPredictionContent
              prediction={juryResult.aggregation.verdict_prediction}
              simId={juryResult.simulation.id}
              onExportPdf={handleDownloadReport}
              exportingPdf={reportLoading}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


// ── Sub-components ─────────────────────────────────────────────────────

function JurorVerdictSplit({ result }: { result: JurySimulationResult }) {
  const { simulation } = result;
  const total = simulation.plaintiff_votes + simulation.defense_votes || 1;
  const plaintiffPct = Math.round((simulation.plaintiff_votes / total) * 100);
  const defensePct = Math.round((simulation.defense_votes / total) * 100);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Plaintiff Verdict
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">{simulation.plaintiff_votes}</p>
            <p className="text-lg text-muted-foreground">Votes ({plaintiffPct}%)</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-green-500" style={{ width: plaintiffPct + "%" }} />
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Defense Verdict
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-red-600 dark:text-red-400">{simulation.defense_votes}</p>
            <p className="text-lg text-muted-foreground">Votes ({defensePct}%)</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-red-500" style={{ width: defensePct + "%" }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function JurorStatsRow({ result }: { result: JurySimulationResult }) {
  const { simulation } = result;
  const agg = result.aggregation;
  const consensusColors: Record<string, string> = {
    "Strong Consensus": "text-green-600",
    "Moderate Consensus": "text-amber-600",
    "Split Jury": "text-orange-600",
    "Highly Divided": "text-red-600",
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card>
        <CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Confidence</p>
          <p className="text-xl font-bold">{simulation.confidence != null ? `${(simulation.confidence * 100).toFixed(0)}%` : "—"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Damages</p>
          <p className="text-xl font-bold">{formatCurrency(simulation.average_damages)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Jury Consensus</p>
          <p className={`text-xl font-bold ${consensusColors[agg?.consensus_level ?? ""] ?? ""}`}>
            {agg?.consensus_level ?? "—"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
          <p className="text-xl font-bold capitalize">{simulation.status}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function VerdictPredictionCard({ result }: { result: JurySimulationResult }) {
  const { simulation } = result;
  const total = simulation.plaintiff_votes + simulation.defense_votes || 1;
  const plaintiffPct = Math.round((simulation.plaintiff_votes / total) * 100);
  const winner = simulation.plaintiff_votes > simulation.defense_votes ? "Plaintiff" : "Defense";
  const consensusColors: Record<string, string> = {
    "Strong Consensus": "text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400",
    "Moderate Consensus": "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400",
    "Split Jury": "text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400",
    "Highly Divided": "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400",
  };
  const consensusClass = consensusColors[result.aggregation?.consensus_level ?? ""] ?? "text-muted-foreground bg-muted";
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.03] to-transparent shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Predicted Trial Outcome
        </CardTitle>
        <CardDescription>
          Based on AI-jury deliberation of {simulation.juror_count} simulated jurors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-900/30">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{winner}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Predicted Winner</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-2xl font-bold">{simulation.plaintiff_votes}:{simulation.defense_votes}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Vote Split (P:D)</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-2xl font-bold">{plaintiffPct}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Plaintiff Win %</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-2xl font-bold">{simulation.confidence != null ? `${(simulation.confidence * 100).toFixed(0)}%` : "—"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Avg Confidence</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border/40">
          {result.aggregation?.consensus_level && (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${consensusClass}`}>
              {result.aggregation.consensus_level}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            Est. Damages: {formatCurrency(simulation.average_damages)}
          </span>
          <span className="text-xs text-muted-foreground">
            Status: <span className="capitalize font-medium">{simulation.status}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function VerdictPredictionContent({
  prediction, simId, onExportPdf, exportingPdf,
}: {
  prediction: Record<string, unknown>;
  simId: string;
  onExportPdf?: (simId: string) => void;
  exportingPdf?: boolean;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = prediction as any;
  const riskColors: Record<string, string> = {
    Low: "text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400",
    Moderate: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400",
    High: "text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400",
    "Very High": "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400",
  };
  const settleColors: Record<string, string> = {
    "Settlement Recommended": "border-green-400 bg-green-50/50 dark:bg-green-950/20",
    "Proceed to Trial": "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20",
    "Further Discovery Recommended": "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20",
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.04] to-transparent shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Executive Verdict Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50">
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{p.predicted_winner}</p>
              <p className="text-xs text-muted-foreground">Predicted Winner</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30 border">
              <p className="text-xl font-bold">{p.plaintiff_win_probability}%</p>
              <p className="text-xs text-muted-foreground">Plaintiff Win %</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30 border">
              <p className="text-xl font-bold">{p.defense_win_probability}%</p>
              <p className="text-xs text-muted-foreground">Defense Win %</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30 border">
              <p className="text-xl font-bold">{p.prediction_confidence}%</p>
              <p className="text-xs text-muted-foreground">Confidence</p>
            </div>
          </div>

          {/* Risk + Settlement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className={`rounded-lg p-3 border ${riskColors[p.litigation_risk] ?? "bg-muted border-border"}`}>
              <p className="text-xs text-muted-foreground">Litigation Risk</p>
              <p className="text-lg font-bold">{p.litigation_risk}</p>
            </div>
            <div className={`rounded-lg p-3 border ${settleColors[p.settlement_recommendation] ?? "bg-muted border-border"}`}>
              <p className="text-xs text-muted-foreground">Recommendation</p>
              <p className="text-lg font-bold">{p.settlement_recommendation}</p>
            </div>
          </div>

          {/* Alternative Outcomes Donut */}
          <div className="flex items-center gap-6 mb-4">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                {p.alternative_outcomes && (
                  <>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22c55e" strokeWidth="3"
                      strokeDasharray={`${p.alternative_outcomes.plaintiff_victory / 100 * 100} ${100 - p.alternative_outcomes.plaintiff_victory / 100 * 100}`}
                      strokeDashoffset="25" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ef4444" strokeWidth="3"
                      strokeDasharray={`${p.alternative_outcomes.defense_victory / 100 * 100} ${100 - p.alternative_outcomes.defense_victory / 100 * 100}`}
                      strokeDashoffset="25" />
                  </>
                )}
                <text x="18" y="20" textAnchor="middle" className="text-[5px] font-bold fill-foreground">
                  {p.plaintiff_win_probability}%
                </text>
              </svg>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Plaintiff {p.alternative_outcomes?.plaintiff_victory ?? p.plaintiff_win_probability}%</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Defense {p.alternative_outcomes?.defense_victory ?? p.defense_win_probability}%</div>
              {p.alternative_outcomes?.hung_jury > 0 && (
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Hung Jury {p.alternative_outcomes.hung_jury}%</div>
              )}
            </div>
          </div>

          {/* Executive Summary Text */}
          {p.executive_summary && (
            <div className="rounded-lg bg-muted/20 p-4 border border-border/50">
              <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{p.executive_summary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expected Damages */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Expected Damages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Minimum", value: p.expected_damages_min, color: "text-blue-600" },
              { label: "Most Likely", value: p.expected_damages_most_likely, color: "text-amber-600" },
              { label: "Maximum", value: p.expected_damages_max, color: "text-red-600" },
              { label: "Range", value: Math.round(p.expected_damages_max - p.expected_damages_min), color: "text-muted-foreground" },
            ].map((d) => (
              <div key={d.label} className="rounded-lg bg-muted/20 p-3 text-center border">
                <p className="text-xs text-muted-foreground">{d.label}</p>
                <p className={`text-sm font-bold mt-1 ${d.color}`}>{formatCurrency(d.value)}</p>
              </div>
            ))}
          </div>
          <DamagesBarChart minimum={p.expected_damages_min} median={p.expected_damages_most_likely} average={(p.expected_damages_min + p.expected_damages_max) / 2} maximum={p.expected_damages_max} />
        </CardContent>
      </Card>

      {/* Attorney Recommendations */}
      {p.attorney_recommendations && p.attorney_recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Attorney Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {p.attorney_recommendations.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-foreground/80">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button variant="default" size="sm" className="text-xs" onClick={() => onExportPdf?.(simId)} disabled={exportingPdf}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {exportingPdf ? "Generating PDF..." : "Export Full Report (PDF)"}
        </Button>
      </div>
    </div>
  );
}

function JurorGrid({ jurors, onViewJuror }: { jurors: JurorCard[]; onViewJuror: (j: JurorCard) => void }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Users className="h-4 w-4" />
        Juror Panel ({jurors.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {jurors.map((juror) => {
          const v = juror.vote;
          const bp = juror.persona.behavioral_profile as Record<string, number | string>;
          return (
            <Card
              key={juror.persona.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onViewJuror(juror)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{juror.persona.name ?? `Juror ${juror.persona.juror_number}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {juror.persona.age}, {juror.persona.gender} &middot; {juror.persona.occupation}
                    </p>
                  </div>
                  {v ? (
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${verdictBadge(v.verdict)}`}>
                      {v.verdict === "plaintiff" ? "P" : "D"}
                    </span>
                  ) : (
                    <span className="inline-block rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-500 dark:bg-gray-800">—</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground capitalize">
                    {String(bp["political_leaning"] ?? "moderate")}
                  </span>
                  {v && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${
                      v.verdict === "plaintiff" ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                    }`}>
                      {v.confidence != null ? `${(v.confidence * 100).toFixed(0)}%` : "—"}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function JurorDetailContent({ juror }: { juror: JurorCard }) {
  const p = juror.persona;
  const v = juror.vote;
  const bp = p.behavioral_profile as Record<string, number | string>;

  const traitConfig = [
    { label: "Risk Tolerance", key: "risk_tolerance", color: "bg-orange-500" },
    { label: "Empathy", key: "empathy", color: "bg-pink-500" },
    { label: "Trust in Experts", key: "trust_in_experts", color: "bg-blue-500" },
    { label: "Trust in Corps", key: "trust_in_corporations", color: "bg-purple-500" },
    { label: "Analytical", key: "analytical_vs_emotional", color: "bg-cyan-500" },
    { label: "Leadership", key: "leadership_tendency", color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-5">
      {/* Biography */}
      {p.biography && (
        <div className="rounded-lg bg-muted/30 p-4 border border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Quote className="h-3 w-3" /> Biography
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed italic">{p.biography}</p>
        </div>
      )}

      {/* Demographics */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Demographics</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "Age", value: p.age },
            { label: "Gender", value: p.gender },
            { label: "Education", value: p.education },
            { label: "Occupation", value: p.occupation },
          ].map((d) => (
            <div key={d.label} className="rounded-md bg-muted/20 p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{d.label}</p>
              <p className="text-sm font-medium mt-0.5">{d.value ?? "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Behavioral Profile */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Behavioral Profile</p>
        <div className="space-y-2">
          {traitConfig.map((t) => {
            const val = Number(t.key === "political_leaning" ? 0 : (bp[t.key] ?? 0));
            return (
              <div key={t.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{t.label}</span>
                  <span className="font-semibold">{val}/10</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${t.color}`} style={{ width: (val / 10) * 100 + "%" }} />
                </div>
              </div>
            );
          })}
          {bp["political_leaning"] && (
            <div className="flex items-center justify-between rounded-md bg-muted/20 px-3 py-1.5">
              <span className="text-xs text-muted-foreground">Political Leaning</span>
              <span className="text-sm font-semibold capitalize">{String(bp["political_leaning"])}</span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Verdict */}
      {v && (
        <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${verdictBadge(v.verdict)}`}>
              {v.verdict === "plaintiff" ? "For Plaintiff" : v.verdict === "defense" ? "For Defense" : "Unknown"}
            </span>
            <span className="text-sm text-muted-foreground">Confidence: {v.confidence != null ? `${(v.confidence * 100).toFixed(0)}%` : "—"}</span>
          </div>
          {v.damages != null && (
            <p className="text-sm mb-3">Damages: <span className="font-semibold">{formatCurrency(v.damages)}</span></p>
          )}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Individual Reasoning</p>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{v.reasoning}</p>
          </div>
        </div>
      )}

      {/* Evidence Referenced */}
      {v?.evidence_referenced && v.evidence_referenced.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Evidence Referenced</p>
          <div className="space-y-2">
            {v.evidence_referenced.map((ev, i) => (
              <div key={i} className="rounded-md bg-muted/20 p-3 border border-border/30">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium">{ev}</p>
                  <Star className="h-4 w-4 text-amber-500 shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Influenced this juror&apos;s decision-making process.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Witness Credibility */}
      {v?.witness_credibility && Object.keys(v.witness_credibility).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Witness Credibility</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Witness</TableHead>
                <TableHead className="text-center">Credibility</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(v.witness_credibility).map(([name, score]) => (
                <TableRow key={name}>
                  <TableCell className="font-medium text-sm">{name}</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      Number(score) >= 7 ? "bg-green-100 text-green-700" : Number(score) >= 4 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    }`}>
                      {score}/10
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">Juror assessment</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {v?.key_doubts && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Key Doubts</p>
          <p className="text-sm text-foreground/80 italic bg-amber-50 dark:bg-amber-950/30 rounded-md p-3">{v.key_doubts}</p>
        </div>
      )}
    </div>
  );
}

function AggregationPanels({ aggregation, simulation, onExportPdf, exportingPdf }: { aggregation: JurySimulationResult["aggregation"]; simulation?: { id?: string; plaintiff_votes: number; defense_votes: number; confidence: number | null }; onExportPdf?: (simId: string) => void; exportingPdf?: boolean }) {
  const pv = aggregation?.plaintiff_votes ?? simulation?.plaintiff_votes ?? 0;
  const dv = aggregation?.defense_votes ?? simulation?.defense_votes ?? 0;
  const conf = aggregation?.confidence ?? simulation?.confidence ?? null;
  const simId = simulation?.id;
  return (
    <div className="space-y-6">

      {/* ── AI Jury Deliberation Summary ─────────────────────────── */}
      {aggregation?.jury_deliberation_summary && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Jury Deliberation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/80">{aggregation.jury_deliberation_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Verdict Distribution (Donut + Progress) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Verdict Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <DonutChart plaintiff={pv} defense={dv} />
            <div className="flex items-center gap-6 mt-3 text-sm">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Plaintiff {pv}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Defense {dv}</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Simulation Timeline ────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Simulation Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {["Personas Generated", "Evidence Evaluation", "Witness Evaluation", "Deliberation", "Verdict Prediction", "Report Generation"].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                  i === 5 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-muted text-muted-foreground"
                }`}>
                  {i === 5 ? "\u2713" : i + 1}
                </div>
                <span className={`text-sm ${i === 5 ? "font-medium" : "text-muted-foreground"}`}>{step}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Confidence Distribution ──────────────────────────────── */}
      {aggregation?.confidence_distribution && aggregation.confidence_distribution.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Confidence Distribution{conf != null ? ` — Avg: ${(conf * 100).toFixed(0)}%` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Y-axis label */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground whitespace-nowrap origin-center">
                Confidence %
              </div>
              <div className="flex items-end gap-2 h-32 ml-8">
                {aggregation.confidence_distribution.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold">{val}%</span>
                    <div className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-700 transition-colors min-h-[4px]" style={{ height: (val / 100) * 100 + "px" }} />
                    <span className="text-[9px] text-muted-foreground">J{i + 1}</span>
                  </div>
                ))}
              </div>
              {/* X-axis label */}
              <div className="text-center text-[10px] text-muted-foreground mt-1 ml-8">
                Juror
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Damages Distribution ─────────────────────────────────── */}
      {aggregation?.damages_distribution && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Damages Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Minimum", value: aggregation.damages_distribution.minimum, color: "text-blue-600" },
                { label: "Median", value: aggregation.damages_distribution.median, color: "text-amber-600" },
                { label: "Average", value: aggregation.damages_distribution.average, color: "text-green-600" },
                { label: "Maximum", value: aggregation.damages_distribution.maximum, color: "text-red-600" },
              ].map((d) => (
                <div key={d.label} className="rounded-lg bg-muted/20 p-3 text-center border border-border/50">
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                  <p className={`text-sm font-bold mt-1 ${d.color}`}>{formatCurrency(d.value)}</p>
                </div>
              ))}
            </div>
            <DamagesBarChart
              minimum={aggregation.damages_distribution.minimum}
              median={aggregation.damages_distribution.median}
              average={aggregation.damages_distribution.average}
              maximum={aggregation.damages_distribution.maximum}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Decision Drivers ─────────────────────────────────────── */}
      {aggregation?.decision_drivers && aggregation.decision_drivers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Decision Drivers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aggregation.decision_drivers.slice(0, 5).map((d, i) => {
              const maxRefs = aggregation.decision_drivers[0]?.juror_references || 1;
              const pct = Math.round((d.juror_references / maxRefs) * 100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{i + 1}. {d.driver}</span>
                    <span className="text-xs text-muted-foreground">{d.juror_references} juror{d.juror_references !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: pct + "%" }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Evidence Influence ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileSearch className="h-4 w-4" />
            Evidence Influence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {aggregation?.evidence_influence && aggregation.evidence_influence.length > 0 ? (
            aggregation.evidence_influence.map((ev, i) => {
              const maxScore = Math.max(...aggregation.evidence_influence.map(e => e.influence_score), 1);
              const pct = Math.round((ev.influence_score / maxScore) * 100);
              return (
                <div key={i} className="rounded-lg border border-border/50 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium">{ev.evidence}</p>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-sm font-bold">{ev.influence_score}/10</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-2">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: pct + "%" }} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Users className="h-3 w-3" />
                    <span>{ev.mentions} juror{ev.mentions !== 1 ? "s" : ""} referenced</span>
                  </div>
                  {ev.explanation && <p className="text-xs text-muted-foreground/80 italic">{ev.explanation}</p>}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No evidence data.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Witness Credibility ──────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Witness Credibility
          </CardTitle>
          <p className="text-xs text-muted-foreground">How persuasive each witness was to the jury — scored 1-10 across all jurors</p>
        </CardHeader>
        <CardContent>
          {aggregation?.witness_credibility_ranking && aggregation.witness_credibility_ranking.length > 0 ? (
            <div className="space-y-3">
              {aggregation.witness_credibility_ranking.map((w, i) => {
                const maxScore = Math.max(...aggregation.witness_credibility_ranking.map(x => x.avg_score), 1);
                const pct = Math.round((w.avg_score / maxScore) * 100);
                const label = w.avg_score >= 7 ? "Highly Credible" : w.avg_score >= 4 ? "Moderately Credible" : "Low Credibility";
                const color = w.avg_score >= 7 ? "bg-green-500" : w.avg_score >= 4 ? "bg-amber-500" : "bg-red-500";
                return (
                  <div key={i} className="rounded-lg border border-border/50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{w.witness}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          w.avg_score >= 7 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" :
                          w.avg_score >= 4 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                          "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        }`}>{w.avg_score}/10</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-1">
                      <div className={`h-full rounded-full ${color}`} style={{ width: pct + "%" }} />
                    </div>
                    {w.explanation && <p className="text-xs text-muted-foreground/80">{w.explanation}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No witness data.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Export ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button variant="default" size="sm" className="text-xs" onClick={() => simId && onExportPdf?.(simId)} disabled={exportingPdf || !simId}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {exportingPdf ? "Generating PDF..." : "Export PDF Report"}
        </Button>
      </div>
    </div>
  );
}

// ── SVG Charts ─────────────────────────────────────────────────────────

function DonutChart({ plaintiff, defense }: { plaintiff: number; defense: number }) {
  const total = plaintiff + defense || 1;
  const pPct = plaintiff / total;
  const dPct = defense / total;
  const size = 120;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  const pOffset = circ * (1 - pPct);
  const dOffset = circ * (1 - dPct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
      {defense > 0 && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ef4444" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={dOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      )}
      {plaintiff > 0 && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#22c55e" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={pOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      )}
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="text-lg font-bold fill-foreground"
      >
        {Math.round(pPct * 100)}%
      </text>
    </svg>
  );
}

function DamagesBarChart({ minimum, median, average, maximum }: { minimum: number; median: number; average: number; maximum: number }) {
  const max = maximum || 1;
  const bars = [
    { label: "Min", value: minimum, color: "bg-blue-500" },
    { label: "Med", value: median, color: "bg-amber-500" },
    { label: "Avg", value: average, color: "bg-green-500" },
    { label: "Max", value: maximum, color: "bg-red-500" },
  ];
  return (
    <div className="flex items-end gap-3 h-24">
      {bars.map((b) => {
        const pct = Math.round((b.value / max) * 100);
        return (
          <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold">{formatCurrency(b.value)}</span>
            <div className={`w-full rounded-t ${b.color} min-h-[4px] transition-all`} style={{ height: pct * 0.9 + "px" }} />
            <span className="text-[10px] text-muted-foreground">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}
