"use client"

import { useState } from "react"
import { FileUploader } from "./file-uploader"
import { FilePreview } from "./file-preview"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Download, Settings, UploadCloud, FileWarning, FileCheck } from "lucide-react"
import { exportToExcel } from "@/lib/excel-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AdvancedConfigPanel } from "./advanced-config-panel"
import { EnhancedValidationResults } from "./enhanced-validation-results"
import { HeaderValidator } from "./header-validator"
import { validateData, validateHeaders, handleInvalidData, formatValue } from "@/lib/enhanced-validation-utils"
import type {
  ValidationError,
  ValidationResult,
  HeaderValidationResult,
  ImporterConfig,
  ColumnConfig,
} from "@/lib/types"
import { defaultImporterConfig, createDefaultColumnConfig } from "@/lib/default-config"

interface ExcelImportExportProps {
  requiredColumns?: string[]
  optionalColumns?: string[]
  acceptedFormats?: string[]
}

export function ExcelImportExport({
  requiredColumns = [],
  optionalColumns = [],
  acceptedFormats = [".xlsx", ".xls", ".csv"],
}: ExcelImportExportProps) {
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<any[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [showAdvancedConfig, setShowAdvancedConfig] = useState<boolean>(false)

  // Initialize the importer config with the provided props
  const [importerConfig, setImporterConfig] = useState<ImporterConfig>(() => {
    // Create initial configuration from props
    const initialColumns: ColumnConfig[] = [
      ...requiredColumns.map((name) => ({
        ...createDefaultColumnConfig(name),
        required: true,
      })),
      ...optionalColumns.map((name) => ({
        ...createDefaultColumnConfig(name),
        required: false,
      })),
    ]

    return {
      ...defaultImporterConfig,
      columns: initialColumns,
      acceptedFormats: acceptedFormats,
    }
  })

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [headerValidationResult, setHeaderValidationResult] = useState<HeaderValidationResult | null>(null)
  const [showValidationResults, setShowValidationResults] = useState<boolean>(false)
  const [showHeaderValidation, setShowHeaderValidation] = useState<boolean>(false)
  const [fileHeaders, setFileHeaders] = useState<string[]>([])
  const [processedData, setProcessedData] = useState<any[]>([])

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
      const cols = headers.map((key) => {
        // Check if this column is in our configuration
        const configColumn = importerConfig.columns.find((col) => col.name === key)

        return {
          accessorKey: key,
          header: configColumn?.displayName || key,
          cell: (info: any) => info.getValue() || "-",
          required: configColumn?.required || false,
        }
      })
      setColumns(cols)

      // If we have pre-configured columns, we need to check if they exist in the file
      // and add any new columns from the file
      const existingColumnNames = importerConfig.columns.map((col) => col.name)
      const newHeaders = headers.filter((header) => !existingColumnNames.includes(header))

      if (newHeaders.length > 0 || importerConfig.columns.length === 0) {
        // We have new columns to add to the configuration
        const updatedColumns = [
          ...importerConfig.columns,
          ...newHeaders.map((header) => createDefaultColumnConfig(header)),
        ]

        setImporterConfig({
          ...importerConfig,
          columns: updatedColumns,
        })

        // Validate headers against the updated config
        const headerResult = validateHeaders(headers, {
          ...importerConfig,
          columns: updatedColumns,
        })
        setHeaderValidationResult(headerResult)
        setShowHeaderValidation(true)
      } else {
        // Just validate headers against existing config
        const headerResult = validateHeaders(headers, importerConfig)
        setHeaderValidationResult(headerResult)
        setShowHeaderValidation(true)
      }
    }

    // Take first 10 rows for preview
    setPreviewData(fileData.slice(0, 10))
    setProcessedData(fileData)
  }

  const handleHeaderValidationContinue = () => {
    setShowHeaderValidation(false)

    // Validate data with column configuration
    validateDataWithConfig(processedData)

    setActiveTab("preview")
  }

  const handleConfigSave = (config: ImporterConfig) => {
    setImporterConfig(config)

    // Update columns with required status
    const updatedColumns = columns.map((col) => ({
      ...col,
      required: config.columns.find((c) => c.name === col.accessorKey)?.required || false,
    }))
    setColumns(updatedColumns)

    setShowAdvancedConfig(false)

    // Validate data with new configuration
    if (processedData.length > 0) {
      validateDataWithConfig(processedData)
    }
  }

  const validateDataWithConfig = (dataToValidate: any[]) => {
    const result = validateData(dataToValidate, importerConfig)
    setValidationResult(result)
    setValidationErrors(result.errors)

    if (result.errors.length > 0) {
      setShowValidationResults(true)
    }

    return result.valid
  }

  const handleImport = () => {
    // Validate all data before importing
    const isValid = validateDataWithConfig(processedData)

    if (!isValid) {
      return
    }

    setIsLoading(true)
    setProgress(0)

    // Process data according to column configuration
    const processedImportData = processedData.map((row) => {
      const processedRow: Record<string, any> = {}

      importerConfig.columns.forEach((column) => {
        const value = row[column.name]

        // Skip columns that aren't in the data
        if (value === undefined) return

        // Handle invalid data according to column configuration
        const isValid = !validationErrors.some(
          (error) => error.column === column.name && String(error.value) === String(value),
        )

        if (isValid) {
          // Format valid data
          processedRow[column.name] = value
        } else {
          // Handle invalid data
          processedRow[column.name] = handleInvalidData(value, column)
        }
      })

      return processedRow
    })

    // Simulate processing time for large files
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setIsLoading(false)
          setData(processedImportData)
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

    // Format data for export according to column configuration
    const formattedData = data.map((row) => {
      const formattedRow: Record<string, any> = {}

      importerConfig.columns.forEach((column) => {
        const value = row[column.name]

        // Skip columns that aren't in the data
        if (value === undefined) return

        // Format the value according to column configuration
        formattedRow[column.displayName || column.name] = formatValue(value, column)
      })

      return formattedRow
    })

    exportToExcel(formattedData, fileName || "exported-data")
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <FileWarning className="h-4 w-4" />
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
      ) : showAdvancedConfig ? (
        <AdvancedConfigPanel
          config={importerConfig}
          onSave={handleConfigSave}
          onCancel={() => setShowAdvancedConfig(false)}
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
              <FileUploader onFileData={handleFileData} acceptedFormats={importerConfig.acceptedFormats} />

              <Button variant="outline" onClick={() => setShowAdvancedConfig(true)} className="mt-4">
                <Settings className="mr-2 h-4 w-4" />
                Configure Import Settings
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="py-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Preview: {fileName}</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setShowAdvancedConfig(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Fields
                  </Button>
                  <Button
                    onClick={() => {
                      const isValid = validateDataWithConfig(processedData)
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

              {validationResult && validationResult.valid && (
                <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
                  <FileCheck className="h-4 w-4" />
                  <AlertTitle>Validation Passed</AlertTitle>
                  <AlertDescription>All data meets the required format and validation rules</AlertDescription>
                </Alert>
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

