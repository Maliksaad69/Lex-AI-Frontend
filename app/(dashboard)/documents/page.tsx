"use client";

import React, { useState } from "react";
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
} from "@/components/ui/table"
const Documents = () => {

  const [files, setFiles] = useState<File[]>([]);
  const handleFileUpload = (uploadedFiles: File[]) => {
  setFiles((prevFiles) => {
    const existing = new Set(
      prevFiles.map(
        (f) => `${f.name}-${f.size}-${f.lastModified}`
      )
    );

    const newFiles = uploadedFiles.filter(
      (f) => !existing.has(`${f.name}-${f.size}-${f.lastModified}`)
    );

    return [...prevFiles, ...newFiles];
  });
};
    const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
    
const uploadDocuments = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    if (files.length === 0){
        alert("Please upload at least one document before proceeding.");
        return;
    }
    const formData = new FormData();
    files.forEach((file) => {
        formData.append("files", file);
    });

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: "POST",
            body: formData
        });
        if(!response.ok) {
            throw new Error("Failed to upload documents");
        }
        const data = await response.json();
        console.log("Documents uploaded successfully:", data);
        alert("Documents uploaded successfully!");
    } catch (error) {
        console.error("Error uploading documents:", error);
        alert("Failed to upload documents.");
    }
}

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Documents</h1>
        <p className="text-sm text-muted-foreground py-2 sm:text-base sm:py-3">
          Upload Your Documents to LexAI Litigation Intelligence Platform.
        </p>
        </div>

        <div>
            <Button
            className="mt-6"
            onClick={uploadDocuments}
            disabled={files.length === 0}
            >
            Upload Documents
        </Button>
        </div>

      </div>

      

      {/* Upload + Table Container */}
      <div className="w-full min-w-0 rounded-lg border border-dashed border-neutral-200 bg-card p-4 dark:border-neutral-800 sm:p-6 lg:p-8">
        <FileUpload onChange={handleFileUpload} />

        {/* Table uses shadcn's built-in overflow-x-auto wrapper */}
        <div className="mt-6">
          <Table className="min-w-[550px] sm:min-w-0">
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

                        <TableCell className="max-w-[250px] truncate font-medium">
                        {file.name}
                        </TableCell>

                        <TableCell>{file.type || "Unknown"}</TableCell>

                        <TableCell>{formatFileSize(file.size)}</TableCell>

                        <TableCell>
                        {new Date(file.lastModified).toLocaleString()}
                        </TableCell>

                        <TableCell className="text-center">
                        Uploaded
                        </TableCell>

                        <TableCell className="text-right">
                        <button
                            onClick={() =>
                            setFiles((prev) =>
                                prev.filter((_, i) => i !== index)
                            )
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
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
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

export default Documents;