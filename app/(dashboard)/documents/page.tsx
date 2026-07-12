"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
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

function DocumentsInner() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get("caseId") ?? "";

  const [activeCase, setActiveCase] = useState<CaseData | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the linked case from the API
  useEffect(() => {
    fetchCase(caseId)
      .then(setActiveCase)
      .catch(() => setActiveCase(null));
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
      await uploadDocuments(files, caseId );
      setFiles([]);
      alert("Documents uploaded successfully!");
      // Refresh the case to update document count
      const updated = await fetchCase(caseId);
      setActiveCase(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Documents</h1>
          <p className="text-sm text-muted-foreground py-2 sm:text-base sm:py-3">
            Upload your documents to the LexAI Litigation Intelligence Platform.
          </p>
          {activeCase ? (
            <p className="text-sm text-muted-foreground">
              Case:{" "}
              <span className="font-medium text-foreground">
                {activeCase.caseName}
              </span>
            </p>
          ) : caseId ? (
            <p className="text-sm text-muted-foreground">Loading case…</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {caseId ? (
            <Button asChild variant="outline" className="mt-6">
              <Link href={`/cases/${caseId}`}>Back to Case</Link>
            </Button>
          ) : null}
          <Button
            className="mt-6"
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
          >
            {uploading ? "Uploading…" : "Upload Documents"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Upload + Table Container */}
      <div className="w-full min-w-0 rounded-lg border border-dashed border-neutral-200 bg-card p-4 dark:border-neutral-800 sm:p-6 lg:p-8">
        <FileUpload onChange={handleFileUpload} />

        <div className="mt-6">
          <Table className="min-w-137.5 sm:min-w-0">
            <TableCaption>A list of your uploaded documents.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
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
                    <TableCell className="max-w-62.5 truncate font-medium">
                      {file.name}
                    </TableCell>
                    <TableCell>{file.type || "Unknown"}</TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell suppressHydrationWarning>
                      {new Date(file.lastModified).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-center">Ready</TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() =>
                          setFiles((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="text-red-500 hover:text-red-700"
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
                    className="py-8 text-center text-muted-foreground"
                  >
                    No documents uploaded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading documents…</div>}>
      <DocumentsInner />
    </Suspense>
  );
}