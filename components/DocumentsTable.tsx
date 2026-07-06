"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchDocuments,
  deleteDocument,
  type DocumentData,
} from "@/lib/api";

interface DocumentsTableProps {
  caseId: string;
  /** Increment this to force a re-fetch (e.g. after a successful upload). */
  refreshKey?: number;
}

export function DocumentsTable({ caseId, refreshKey = 0 }: DocumentsTableProps) {
  const [docs, setDocs] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocs = useCallback(async () => {
    if (!caseId) return;
    try {
      setError(null);
      setLoading(true);
      const data = await fetchDocuments(caseId);
      setDocs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs, refreshKey]); // re-fetch when refreshKey changes

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document? Its chunks will also be removed.")) return;
    try {
      await deleteDocument(docId);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes < 1024) return `${bytes || 0} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (iso: string): string => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground text-sm">
        Loading documents…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
        <Button variant="outline" size="sm" className="ml-4" onClick={loadDocs}>
          Retry
        </Button>
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        <p className="font-medium">No documents yet</p>
        <p className="mt-1 text-sm">
          Upload files using the dropzone above to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-[700px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Filename</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Pages</TableHead>
            <TableHead>Chunks</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.map((doc, idx) => (
            <TableRow key={doc.id}>
              <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
              <TableCell className="max-w-[200px] truncate font-medium">
                {doc.filename}
              </TableCell>
              <TableCell className="uppercase text-xs text-muted-foreground">
                {doc.fileType || "—"}
              </TableCell>
              <TableCell>{formatSize(doc.fileSize)}</TableCell>
              <TableCell>{doc.pageCount || "—"}</TableCell>
              <TableCell>{doc.chunksCount}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(doc.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(doc.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}