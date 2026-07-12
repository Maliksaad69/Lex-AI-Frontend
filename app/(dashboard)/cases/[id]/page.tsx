"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";

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
  type CaseData,
  type CaseAnalysisResult,
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

  useEffect(() => {
    if (!caseId) {
      setError("Invalid case ID");
      setLoading(false);
      return;
    }

    fetchCase(caseId)
      .then(setCaseItem)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load case"))
      .finally(() => setLoading(false));

    // Silently fetch existing analysis (empty arrays if none exists)
    fetchCaseAnalysis(caseId)
      .then(setAnalysisResult)
      .catch(() => { /* no analysis yet */ });
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
        <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="findings">AI Findings</TabsTrigger>
          <TabsTrigger value="jury">Jury</TabsTrigger>
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      disabled={analysisLoading}
                      size="default"
                      variant={analysisResult ? "destructive" : "default"}
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
                      <DialogTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogTrigger>
                      <Button
                        variant="destructive"
                        onClick={handleRunAnalysis}
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

        {/* 4. JURY TAB */}
        <TabsContent value="jury" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jury Profile & Insights</CardTitle>
              <CardDescription>Demographics, match metrics, and strategy tracking.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                <p>Jury consultation models, voir dire profiling tools, and sentiment analysis options can be integrated here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}