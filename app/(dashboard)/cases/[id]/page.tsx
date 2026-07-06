"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import { DocumentsTable } from "@/components/DocumentsTable";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchCase, uploadDocuments, type CaseData } from "@/lib/api";

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

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const caseId = params?.id ?? "";

  const [caseItem, setCaseItem] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docsRefreshKey, setDocsRefreshKey] = useState(0);

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
      setDocsRefreshKey((k) => k + 1);  // trigger DocumentsTable re-fetch
      alert("Documents uploaded successfully!");

      // Refresh case metadata to update document counter
      const updated = await fetchCase(caseId);
      setCaseItem(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

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

        {/* 3. AI FINDINGS TAB */}
        <TabsContent value="findings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Findings & Analysis</CardTitle>
              <CardDescription>Automated contextual breakdown and document extracts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-4 bg-muted/40">
                <h4 className="text-sm font-semibold mb-2">Extracted Insights</h4>
                <p className="text-sm text-foreground leading-relaxed">
                  {caseItem.analysis || "No analytical data has been compiled for this case file yet."}
                </p>
              </div>
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