"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import NewCaseDialog, { NewCaseFormData } from "@/components/NewCaseDialog";
import {
  fetchCases,
  createCase,
  deleteCase,
  type CaseData,
} from "@/lib/api";

const Cases = () => {
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<NewCaseFormData | null>(null);

  const loadCases = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchCases();
      setCases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleCreateCase = async (formData: NewCaseFormData) => {
    try {
      const created = await createCase(formData);
      setCases((prev) => [created, ...prev]);
      setLastPayload(formData);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create case");
    }
  };

  const handleDelete = async (caseId: string) => {
    if (!confirm("Delete this case?")) return;
    try {
      await deleteCase(caseId);
      setCases((prev) => prev.filter((c) => c.id !== caseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete case");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Cases</h1>
          <p className="text-sm text-muted-foreground py-2 sm:text-base sm:py-3">
            Manage and track all litigation matters
          </p>
        </div>
        <div>
          <Button onClick={() => setOpen(true)}>+ New Case</Button>
        </div>
        <NewCaseDialog
          open={open}
          onOpenChange={setOpen}
          onCreateCase={handleCreateCase}
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <Button variant="outline" size="sm" className="ml-4" onClick={loadCases}>
            Retry
          </Button>
        </div>
      ) : null}

   

      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Case Records</h2>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading…"
              : cases.length === 0
                ? "No cases yet"
                : `${cases.length} case(s) available`}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case Name</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Docs</TableHead>
              <TableHead>Analysis</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Create a case to see it listed here.
                </TableCell>
              </TableRow>
            ) : (
              cases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.caseName}</TableCell>
                  <TableCell>{c.currentStage}</TableCell>
                  <TableCell>{c.documentCount}</TableCell>
                  <TableCell>{c.analysis}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/cases/${c.id}`}>Open</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(c.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Cases;