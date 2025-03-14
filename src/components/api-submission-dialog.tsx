"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, FileWarning, Send, X, Code, Settings, Key } from "lucide-react"
import { submitDataToApi } from "@/lib/api-utils"

interface ApiSubmissionDialogProps {
    data: any[]
    onClose: () => void
    initialEndpoint?: string
}

export function ApiSubmissionDialog({ data, onClose, initialEndpoint = "" }: ApiSubmissionDialogProps) {
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

        const dataToSubmit = prepareDataForSubmission()

        const result = await submitDataToApi(dataToSubmit, apiEndpoint, {
            method,
            headers: headerObject,
            onProgress: setSubmitProgress,
        })

        setSubmitResult(result)
        setIsSubmitting(false)
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
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-4 py-4">
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
                                        <pre className="text-xs">{JSON.stringify(submitResult.response, null, 2)}</pre>
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
                    <Button onClick={handleSubmit} disabled={isSubmitting || !apiEndpoint}>
                        <Send className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Sending..." : "Send Data"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

