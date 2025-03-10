"use client"

import { useState } from "react"
import { FileUploader } from "./file-uploader"
import { FilePreview } from "./file-preview"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Download, UploadCloud } from "lucide-react"
import { exportToExcel } from "@/lib/excel-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

export function ExcelImportExport() {
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<any[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const handleFileData = (fileData: any[], name: string) => {
    setError(null)

    if (!fileData.length) {
      setError("The uploaded file contains no data")
      return
    }

    // Take first 10 rows for preview
    setPreviewData(fileData.slice(0, 10))
    setFileName(name)

    // Generate columns from the first row (headers)
    if (fileData.length > 0) {
      const firstRow = fileData[0]
      const cols = Object.keys(firstRow).map((key) => ({
        accessorKey: key,
        header: key,
        cell: (info: any) => info.getValue() || "-",
      }))
      setColumns(cols)
    }

    setActiveTab("preview")
  }

  const handleImport = () => {
    setIsLoading(true)
    setProgress(0)

    // Simulate processing time for large files
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setIsLoading(false)
          setData(previewData)
          setActiveTab("data")
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const handleExport = () => {
    if (data.length === 0) {
      setError("No data to export")
      return
    }

    exportToExcel(data, fileName || "exported-data")
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="preview" disabled={!previewData.length}>
            Preview
          </TabsTrigger>
          <TabsTrigger value="data" disabled={!data.length}>
            Data Table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="py-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <FileUploader onFileData={handleFileData} />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="py-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Preview: {fileName}</h2>
              <Button onClick={handleImport} disabled={isLoading}>
                <UploadCloud className="mr-2 h-4 w-4" />
                {isLoading ? "Importing..." : "Import Data"}
              </Button>
            </div>

            {isLoading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground text-center">Processing file... {progress}%</p>
              </div>
            )}

            {previewData.length > 0 && <FilePreview data={previewData} columns={columns} />}
          </div>
        </TabsContent>

        <TabsContent value="data" className="py-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Imported Data</h2>
              <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            </div>

            {data.length > 0 && <DataTable data={data} columns={columns} />}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

