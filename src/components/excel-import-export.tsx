"use client"

import { useState } from "react"
import { FileUploader } from "./file-uploader"
import { FilePreview } from "./file-preview"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Download, Settings, UploadCloud } from "lucide-react"
import { exportToExcel } from "@/lib/excel-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ColumnConfigurator } from "./column-config"
import { EnhancedValidationResults } from "./enhanced-validation-results"
import { HeaderValidator } from "./header-validator"
import { validateData, validateHeaders } from "@/lib/validation-utils"
import type { ColumnConfig, ValidationError, ValidationResult, HeaderValidationResult } from "@/lib/types"

export function ExcelImportExport() {
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<any[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [showColumnConfig, setShowColumnConfig] = useState<boolean>(false)
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [headerValidationResult, setHeaderValidationResult] = useState<HeaderValidationResult | null>(null)
  const [showValidationResults, setShowValidationResults] = useState<boolean>(false)
  const [showHeaderValidation, setShowHeaderValidation] = useState<boolean>(false)
  const [fileHeaders, setFileHeaders] = useState<string[]>([])

  const handleFileData = (fileData: any[], name: string) => {
    setError(null)
    setValidationErrors([])
    setFileName(name)

    if (!fileData.length) {
      setError("The uploaded file contains no data")
      return
    }

    // Extract headers from the first row
    if (fileData.length > 0) {
      const firstRow = fileData[0]
      const headers = Object.keys(firstRow)
      setFileHeaders(headers)

      // Generate columns from the headers
      const cols = headers.map((key) => ({
        accessorKey: key,
        header: key,
        cell: (info: any) => info.getValue() || "-",
        required: false, // Default to not required
      }))
      setColumns(cols)

      // Initialize column config if it doesn't exist
      if (columnConfig.length === 0) {
        const initialConfig = headers.map((key) => ({
          name: key,
          required: false,
          type: "string",
          description: `Data for ${key}`,
          validationRules: [],
        }))
        setColumnConfig(initialConfig)

        // Validate headers against the initial config
        const headerResult = validateHeaders(headers, initialConfig)
        setHeaderValidationResult(headerResult)
        setShowHeaderValidation(true)
      } else {
        // Validate headers against existing config
        const headerResult = validateHeaders(headers, columnConfig)
        setHeaderValidationResult(headerResult)
        setShowHeaderValidation(true)
      }
    }

    // Take first 10 rows for preview
    setPreviewData(fileData.slice(0, 10))
  }

  const handleHeaderValidationContinue = () => {
    setShowHeaderValidation(false)

    // Validate data with column configuration
    validateDataWithConfig(previewData)

    setActiveTab("preview")
  }

  const handleConfigureSave = (config: ColumnConfig[]) => {
    setColumnConfig(config)

    // Update columns with required status
    const updatedColumns = columns.map((col) => ({
      ...col,
      required: config.find((c) => c.name === col.accessorKey)?.required || false,
    }))
    setColumns(updatedColumns)

    setShowColumnConfig(false)

    // Validate data with new configuration
    validateDataWithConfig(previewData)
  }

  const validateDataWithConfig = (dataToValidate: any[]) => {
    const result = validateData(dataToValidate, columnConfig)
    setValidationResult(result)
    setValidationErrors(result.errors)

    if (result.errors.length > 0) {
      setShowValidationResults(true)
    }

    return result.valid
  }

  const handleImport = () => {
    // Validate all data before importing
    const isValid = validateDataWithConfig(previewData)

    if (!isValid) {
      return
    }

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

      {showHeaderValidation && headerValidationResult ? (
        <HeaderValidator
          validationResult={headerValidationResult}
          onContinue={handleHeaderValidationContinue}
          onCancel={() => setShowHeaderValidation(false)}
        />
      ) : showColumnConfig ? (
        <ColumnConfigurator
          columns={columns.map((col) => col.accessorKey)}
          initialConfig={columnConfig}
          onSave={handleConfigureSave}
          onCancel={() => setShowColumnConfig(false)}
        />
      ) : showValidationResults && validationResult ? (
        <EnhancedValidationResults
          validationResult={validationResult}
          onContinue={() => {
            setShowValidationResults(false)
            if (validationResult.valid) {
              handleImport()
            }
          }}
          onCancel={() => setShowValidationResults(false)}
        />
      ) : (
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
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setShowColumnConfig(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Fields
                  </Button>
                  <Button
                    onClick={() => {
                      const isValid = validateDataWithConfig(previewData)
                      if (isValid) {
                        handleImport()
                      } else {
                        setShowValidationResults(true)
                      }
                    }}
                    disabled={isLoading}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {isLoading ? "Importing..." : "Validate & Import"}
                  </Button>
                </div>
              </div>

              {isLoading && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-muted-foreground text-center">Processing file... {progress}%</p>
                </div>
              )}

              {previewData.length > 0 && (
                <FilePreview data={previewData} columns={columns} validationErrors={validationErrors} />
              )}
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
      )}
    </div>
  )
}

