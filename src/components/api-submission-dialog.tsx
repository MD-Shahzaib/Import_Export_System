"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, FileWarning, Send, X, Code, Settings, Key, Upload, FileUp, Database } from "lucide-react"
import { submitDataToApi, submitFileToApi, validateFile } from "@/lib/api-utils"
import { exportToExcel } from "@/lib/excel-utils"

interface ApiSubmissionDialogProps {
    data: any[]
    originalFile?: File
    acceptedFormats?: string[]
    onClose: () => void
    initialEndpoint?: string
}

export function ApiSubmissionDialog({
    data,
    originalFile,
    acceptedFormats = [".xlsx", ".xls", ".csv"],
    onClose,
    initialEndpoint = "",
}: ApiSubmissionDialogProps) {
    const [apiEndpoint, setApiEndpoint] = useState<string>(initialEndpoint)
    const [method, setMethod] = useState<string>("POST")
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [submitProgress, setSubmitProgress] = useState<number>(0)
    const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; response?: any } | null>(null)
    const [activeTab, setActiveTab] = useState<string>("basic")
    const [headers, setHeaders] = useState<{ key: string; value: string }[]>([
        { key: "Content-Type", value: "application/json" },
    ])
    const [includeAllFields, setIncludeAllFields] = useState<boolean>(true)
    const [selectedFields, setSelectedFields] = useState<string[]>([])
    const [showResponse, setShowResponse] = useState<boolean>(false)
    const [submissionType, setSubmissionType] = useState<"json" | "file">("json")
    const [customFile, setCustomFile] = useState<File | null>(null)
    const [fileFieldName, setFileFieldName] = useState<string>("file")
    const [additionalData, setAdditionalData] = useState<{ key: string; value: string }[]>([])
    const [fileError, setFileError] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Get all available fields from the data
    const allFields = data.length > 0 ? Object.keys(data[0]) : []

    const handleAddHeader = () => {
        setHeaders([...headers, { key: "", value: "" }])
    }

    const handleRemoveHeader = (index: number) => {
        const newHeaders = [...headers]
        newHeaders.splice(index, 1)
        setHeaders(newHeaders)
    }

    const handleHeaderChange = (index: number, field: "key" | "value", value: string) => {
        const newHeaders = [...headers]
        newHeaders[index][field] = value
        setHeaders(newHeaders)
    }

    const handleFieldToggle = (field: string, checked: boolean) => {
        if (checked) {
            setSelectedFields((prev) => [...prev, field])
        } else {
            setSelectedFields((prev) => prev.filter((f) => f !== field))
        }
    }

    const handleSelectAllFields = (checked: boolean) => {
        if (checked) {
            setSelectedFields([...allFields])
        } else {
            setSelectedFields([])
        }
    }

    const handleAddAdditionalData = () => {
        setAdditionalData([...additionalData, { key: "", value: "" }])
    }

    const handleRemoveAdditionalData = (index: number) => {
        const newData = [...additionalData]
        newData.splice(index, 1)
        setAdditionalData(newData)
    }

    const handleAdditionalDataChange = (index: number, field: "key" | "value", value: string) => {
        const newData = [...additionalData]
        newData[index][field] = value
        setAdditionalData(newData)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError(null)
        const files = e.target.files
        if (files && files.length > 0) {
            const file = files[0]

            // Validate file
            const validation = validateFile(file, {
                maxSizeMB: 10,
                acceptedFormats,
            })

            if (!validation.valid) {
                setFileError(validation.message)
                return
            }

            setCustomFile(file)
        }
    }

    const prepareDataForSubmission = () => {
        if (includeAllFields) {
            return data
        }

        return data.map((item) => {
            const filteredItem: Record<string, any> = {}
            selectedFields.forEach((field) => {
                if (field in item) {
                    filteredItem[field] = item[field]
                }
            })
            return filteredItem
        })
    }

    const handleSubmit = async () => {
        if (!apiEndpoint) {
            return
        }

        setIsSubmitting(true)
        setSubmitProgress(0)
        setSubmitResult(null)
        setShowResponse(false)

        const headerObject: Record<string, string> = {}
        headers.forEach((header) => {
            if (header.key && header.value) {
                headerObject[header.key] = header.value
            }
        })

        let result

        if (submissionType === "json") {
            const dataToSubmit = prepareDataForSubmission()
            result = await submitDataToApi(dataToSubmit, apiEndpoint, {
                method,
                headers: headerObject,
                onProgress: setSubmitProgress,
            })
        } else {
            // File submission
            const fileToSubmit = customFile || originalFile
            if (!fileToSubmit) {
                setIsSubmitting(false)
                setFileError("No file selected for upload")
                return
            }

            // Convert additionalData to object
            const additionalDataObj: Record<string, string> = {}
            additionalData.forEach((item) => {
                if (item.key && item.value) {
                    additionalDataObj[item.key] = item.value
                }
            })

            result = await submitFileToApi(fileToSubmit, apiEndpoint, {
                method,
                headers: headerObject,
                fieldName: fileFieldName,
                additionalData: additionalDataObj,
                onProgress: setSubmitProgress,
            })
        }

        setSubmitResult(result)
        setIsSubmitting(false)
    }

    const handleExportToExcel = () => {
        if (data.length === 0) return

        const dataToExport = prepareDataForSubmission()
        exportToExcel(dataToExport, "api_submission_data")
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Send className="mr-2 h-5 w-5" />
                        Send Data to API
                    </DialogTitle>
                    <DialogDescription>Configure API settings and send your validated data</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Submission Type</Label>
                        <RadioGroup
                            value={submissionType}
                            onValueChange={(value) => setSubmissionType(value as "json" | "file")}
                            className="flex flex-col space-y-1"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="json" id="json-option" />
                                <Label htmlFor="json-option" className="flex items-center cursor-pointer">
                                    <Database className="mr-2 h-4 w-4" />
                                    Send as JSON data
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="file" id="file-option" />
                                <Label htmlFor="file-option" className="flex items-center cursor-pointer">
                                    <FileUp className="mr-2 h-4 w-4" />
                                    Send as file upload
                                </Label>
                            </div>
                        </RadioGroup>
                        <p className="text-sm text-muted-foreground">Choose whether to send the data as JSON or as a file upload</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">
                            <Send className="mr-2 h-4 w-4" />
                            Basic
                        </TabsTrigger>
                        <TabsTrigger value="advanced">
                            <Settings className="mr-2 h-4 w-4" />
                            Advanced
                        </TabsTrigger>
                        <TabsTrigger value="headers">
                            <Key className="mr-2 h-4 w-4" />
                            Headers
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="api-endpoint">API Endpoint URL</Label>
                            <Input
                                id="api-endpoint"
                                type="url"
                                value={apiEndpoint}
                                onChange={(e) => setApiEndpoint(e.target.value)}
                                placeholder="https://api.example.com/data"
                                disabled={isSubmitting}
                            />
                            <p className="text-sm text-muted-foreground">Enter the URL where the data should be sent</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="http-method">HTTP Method</Label>
                            <Select value={method} onValueChange={setMethod} disabled={isSubmitting}>
                                <SelectTrigger id="http-method">
                                    <SelectValue placeholder="Select HTTP method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="POST">POST</SelectItem>
                                    <SelectItem value="PUT">PUT</SelectItem>
                                    <SelectItem value="PATCH">PATCH</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {submissionType === "file" && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="file-field-name">File Field Name</Label>
                                    <Input
                                        id="file-field-name"
                                        value={fileFieldName}
                                        onChange={(e) => setFileFieldName(e.target.value)}
                                        placeholder="file"
                                        disabled={isSubmitting}
                                    />
                                    <p className="text-sm text-muted-foreground">The name of the form field that will contain the file</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>File to Upload</Label>
                                    <div
                                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept={acceptedFormats.join(",")}
                                            className="hidden"
                                            disabled={isSubmitting}
                                        />
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">
                                                    {customFile ? customFile.name : originalFile ? "Using original file" : "Click to upload file"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {customFile
                                                        ? `${(customFile.size / (1024 * 1024)).toFixed(2)} MB`
                                                        : originalFile
                                                            ? `${(originalFile.size / (1024 * 1024)).toFixed(2)} MB`
                                                            : `Supports ${acceptedFormats.join(", ")} up to 10MB`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {fileError && <p className="text-sm text-destructive mt-2">{fileError}</p>}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Additional Form Data</Label>
                                        <Button variant="outline" size="sm" onClick={handleAddAdditionalData} disabled={isSubmitting}>
                                            Add Field
                                        </Button>
                                    </div>

                                    {additionalData.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No additional data fields. Click "Add Field" to include extra form data.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {additionalData.map((item, index) => (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <Input
                                                        placeholder="Field name"
                                                        value={item.key}
                                                        onChange={(e) => handleAdditionalDataChange(index, "key", e.target.value)}
                                                        disabled={isSubmitting}
                                                        className="flex-1"
                                                    />
                                                    <Input
                                                        placeholder="Value"
                                                        value={item.value}
                                                        onChange={(e) => handleAdditionalDataChange(index, "value", e.target.value)}
                                                        disabled={isSubmitting}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveAdditionalData(index)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-4 py-4">
                        {submissionType === "json" && (
                            <>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="include-all-fields"
                                            checked={includeAllFields}
                                            onCheckedChange={(checked) => setIncludeAllFields(!!checked)}
                                            disabled={isSubmitting}
                                        />
                                        <Label htmlFor="include-all-fields">Include all fields</Label>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        When enabled, all fields will be included in the API submission
                                    </p>
                                </div>

                                {!includeAllFields && (
                                    <div className="space-y-2 border rounded-md p-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Select fields to include</Label>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSelectAllFields(true)}
                                                    disabled={isSubmitting}
                                                >
                                                    Select All
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSelectAllFields(false)}
                                                    disabled={isSubmitting}
                                                >
                                                    Clear All
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {allFields.map((field) => (
                                                <div key={field} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`field-${field}`}
                                                        checked={selectedFields.includes(field)}
                                                        onCheckedChange={(checked) => handleFieldToggle(field, !!checked)}
                                                        disabled={isSubmitting}
                                                    />
                                                    <Label htmlFor={`field-${field}`} className="text-sm">
                                                        {field}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Data Preview</Label>
                                    <div className="bg-muted rounded-md p-4 overflow-auto max-h-[200px]">
                                        <pre className="text-xs">
                                            {JSON.stringify(prepareDataForSubmission().slice(0, 2), null, 2)}
                                            {data.length > 2 && "\n..."}
                                        </pre>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Preview of the first 2 records that will be sent</p>
                                </div>

                                <div className="flex justify-end">
                                    <Button variant="outline" size="sm" onClick={handleExportToExcel} disabled={isSubmitting}>
                                        Export Data to Excel
                                    </Button>
                                </div>
                            </>
                        )}

                        {submissionType === "file" && (
                            <div className="space-y-4">
                                <Alert className="bg-blue-50 border-blue-200">
                                    <AlertTitle className="text-blue-800">File Upload Information</AlertTitle>
                                    <AlertDescription className="text-blue-700">
                                        <ul className="list-disc pl-5 space-y-1 mt-2">
                                            <li>Files will be sent as multipart/form-data</li>
                                            <li>Maximum file size: 10MB</li>
                                            <li>Accepted formats: {acceptedFormats.join(", ")}</li>
                                            <li>Add additional form fields in the Basic tab if needed</li>
                                        </ul>
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-2">
                                    <Label>File Details</Label>
                                    {customFile || originalFile ? (
                                        <div className="bg-muted rounded-md p-4">
                                            <div className="flex items-center space-x-4">
                                                <FileUp className="h-8 w-8 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">{customFile ? customFile.name : originalFile?.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {customFile
                                                            ? `${(customFile.size / (1024 * 1024)).toFixed(2)} MB · ${customFile.type || "Unknown type"}`
                                                            : originalFile
                                                                ? `${(originalFile.size / (1024 * 1024)).toFixed(2)} MB · ${originalFile.type || "Unknown type"}`
                                                                : "No file selected"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No file selected. Please upload a file in the Basic tab.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="headers" className="space-y-4 py-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>HTTP Headers</Label>
                                <Button variant="outline" size="sm" onClick={handleAddHeader} disabled={isSubmitting}>
                                    Add Header
                                </Button>
                            </div>

                            {headers.map((header, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <Input
                                        placeholder="Header name"
                                        value={header.key}
                                        onChange={(e) => handleHeaderChange(index, "key", e.target.value)}
                                        disabled={isSubmitting}
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder="Value"
                                        value={header.value}
                                        onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                                        disabled={isSubmitting}
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveHeader(index)}
                                        disabled={isSubmitting || headers.length === 1}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <p className="text-sm text-muted-foreground">Add custom HTTP headers to send with the request</p>

                            {submissionType === "file" && (
                                <Alert className="bg-amber-50 border-amber-200">
                                    <AlertTitle className="text-amber-800">Content-Type Header Note</AlertTitle>
                                    <AlertDescription className="text-amber-700">
                                        For file uploads, the Content-Type header will be automatically set to "multipart/form-data" with
                                        the appropriate boundary. Any manually set Content-Type header will be ignored.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {isSubmitting && (
                    <div className="space-y-2 mt-4">
                        <Progress value={submitProgress} />
                        <p className="text-sm text-muted-foreground text-center">Submitting data... {submitProgress}%</p>
                    </div>
                )}

                {submitResult && (
                    <div className="mt-4 space-y-2">
                        <Alert
                            variant={submitResult.success ? "success" : "destructive"}
                            className={
                                submitResult.success
                                    ? "bg-green-50 text-green-800 border-green-200"
                                    : "bg-red-50 text-red-800 border-red-200"
                            }
                        >
                            {submitResult.success ? <CheckCircle className="h-4 w-4" /> : <FileWarning className="h-4 w-4" />}
                            <AlertTitle>{submitResult.success ? "Success" : "Error"}</AlertTitle>
                            <AlertDescription>{submitResult.message}</AlertDescription>
                        </Alert>

                        {submitResult.response && (
                            <div className="space-y-2">
                                <Button variant="outline" size="sm" onClick={() => setShowResponse(!showResponse)} className="w-full">
                                    <Code className="mr-2 h-4 w-4" />
                                    {showResponse ? "Hide Response" : "Show Response"}
                                </Button>

                                {showResponse && (
                                    <div className="bg-muted rounded-md p-4 overflow-auto max-h-[200px]">
                                        <pre className="text-xs">
                                            {typeof submitResult.response === "string"
                                                ? submitResult.response
                                                : JSON.stringify(submitResult.response, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        {submitResult?.success ? "Close" : "Cancel"}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !apiEndpoint || (submissionType === "file" && !customFile && !originalFile)}
                    >
                        <Send className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Sending..." : "Send Data"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

