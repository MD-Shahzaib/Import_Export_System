"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileSpreadsheet, Upload, FileX } from "lucide-react"
import { parseExcelFile } from "@/lib/excel-utils"
import { cn } from "@/lib/utils"
import { validateFileFormat } from "@/lib/validation-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface FileUploaderProps {
  onFileData: (data: any[], fileName: string) => void
}

export function FileUploader({ onFileData }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formatError, setFormatError] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length) {
      processFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  const processFile = async (file: File) => {
    setError(null)
    setFormatError(false)

    // Check if file is an Excel file
    const isValidFormat = validateFileFormat(file.name)

    if (!isValidFormat) {
      setError("Please upload a valid Excel file (.xls, .xlsx)")
      setFormatError(true)
      return
    }

    try {
      setIsProcessing(true)
      const data = await parseExcelFile(file)
      onFileData(data, file.name)
    } catch (err) {
      setError("Failed to parse Excel file. Please check the file format.")
      console.error(err)
    } finally {
      setIsProcessing(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {formatError && (
          <Alert variant="destructive" className="mb-4">
            <FileX className="h-4 w-4" />
            <AlertTitle>Invalid File Format</AlertTitle>
            <AlertDescription>
              {error}
              <div className="mt-2 text-sm">
                Please ensure your file has one of the following extensions: .xlsx, .xls
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            isProcessing && "opacity-50 cursor-not-allowed",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xls,.xlsx"
            className="hidden"
            disabled={isProcessing}
          />

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <FileSpreadsheet className="h-10 w-10 text-primary" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">{isProcessing ? "Processing file..." : "Upload Excel File"}</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Drag and drop your Excel file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">Supports .xls and .xlsx formats</p>
            </div>

            <Button variant="outline" disabled={isProcessing}>
              <Upload className="mr-2 h-4 w-4" />
              Select File
            </Button>
          </div>
        </div>

        {error && !formatError && <p className="mt-4 text-sm text-destructive text-center">{error}</p>}
      </CardContent>
    </Card>
  )
}

