"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
    AlertCircle,
    Clock,
    Code,
    FileText,
    RefreshCw,
    Trash2,
    Edit,
    ExternalLink,
    FileWarning,
    Database,
    FileUp,
    CheckCircle,
    X,
} from "lucide-react"
import { submitDataToApi } from "@/lib/api-utils"
import { formatDistanceToNow } from "date-fns"
import { ApiSubmissionDialog } from "./api-submission-dialog"
import type { FailedSubmission } from "@/lib/types"
import { useFailedSubmissionsStore } from "./failed-submissions-store"

interface FailedSubmissionsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function FailedSubmissionsDialog({ open, onOpenChange }: FailedSubmissionsDialogProps) {
    const { submissions, removeFailedSubmission, clearAllFailedSubmissions, incrementRetryCount } =
        useFailedSubmissionsStore()

    const [selectedSubmission, setSelectedSubmission] = useState<FailedSubmission | null>(null)
    const [activeTab, setActiveTab] = useState("list")
    const [isRetrying, setIsRetrying] = useState(false)
    const [retryProgress, setRetryProgress] = useState(0)
    const [retryResult, setRetryResult] = useState<{ success: boolean; message: string } | null>(null)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showResponseDetails, setShowResponseDetails] = useState(false)

    const handleViewDetails = (submission: FailedSubmission) => {
        setSelectedSubmission(submission)
        setActiveTab("details")
        setRetryResult(null)
    }

    const handleRetry = async (submission: FailedSubmission) => {
        setIsRetrying(true)
        setRetryProgress(0)
        setRetryResult(null)

        try {
            let result

            if (submission.submissionType === "json" && submission.data) {
                result = await submitDataToApi(submission.data, submission.endpoint, {
                    method: submission.method,
                    headers: submission.headers,
                    onProgress: setRetryProgress,
                    trackFailures: false, // Don't track this retry as a new failure
                })
            } else if (submission.submissionType === "file" && submission.file) {
                // For file submissions, we would need the actual File object
                // Since we can't store File objects in state/localStorage, we'll show an error
                setRetryResult({
                    success: false,
                    message: "Cannot retry file submission directly. Please edit and resubmit.",
                })
                setIsRetrying(false)
                return
            } else {
                setRetryResult({
                    success: false,
                    message: "Invalid submission data",
                })
                setIsRetrying(false)
                return
            }

            setRetryResult({
                success: result.success,
                message: result.message,
            })

            if (result.success) {
                // Remove the submission from the failed list if successful
                removeFailedSubmission(submission.id)
            } else {
                // Increment retry count
                incrementRetryCount(submission.id)
            }
        } catch (error) {
            setRetryResult({
                success: false,
                message: error instanceof Error ? error.message : "Unknown error occurred",
            })
            // Increment retry count
            incrementRetryCount(submission.id)
        } finally {
            setIsRetrying(false)
        }
    }

    const handleEdit = (submission: FailedSubmission) => {
        setSelectedSubmission(submission)
        setShowEditDialog(true)
    }

    const handleDelete = (id: string) => {
        removeFailedSubmission(id)
        if (selectedSubmission?.id === id) {
            setSelectedSubmission(null)
            setActiveTab("list")
        }
    }

    const handleClearAll = () => {
        clearAllFailedSubmissions()
        setSelectedSubmission(null)
        setActiveTab("list")
    }

    const formatTimestamp = (timestamp: number) => {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <FileWarning className="mr-2 h-5 w-5" />
                            Failed Submissions
                        </DialogTitle>
                        <DialogDescription>Review and manage submissions that failed to save to the database</DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="list">
                                <FileText className="mr-2 h-4 w-4" />
                                Submission List
                            </TabsTrigger>
                            <TabsTrigger value="details" disabled={!selectedSubmission}>
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Error Details
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="list" className="flex-1 overflow-hidden">
                            {submissions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[400px] text-center p-4">
                                    <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-medium mb-2">No Failed Submissions</h3>
                                    <p className="text-muted-foreground max-w-md">
                                        All your data submissions have been processed successfully. Failed submissions will appear here if
                                        any errors occur.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-sm text-muted-foreground">
                                            {submissions.length} failed {submissions.length === 1 ? "submission" : "submissions"}
                                        </p>
                                        <Button variant="outline" size="sm" onClick={handleClearAll}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Clear All
                                        </Button>
                                    </div>

                                    <ScrollArea className="flex-1">
                                        <div className="space-y-2 pr-4">
                                            {submissions.map((submission) => (
                                                <Card key={submission.id} className="overflow-hidden">
                                                    <div className="flex items-center justify-between p-4">
                                                        <div className="space-y-1 flex-1 min-w-0">
                                                            <div className="flex items-center">
                                                                {submission.submissionType === "json" ? (
                                                                    <Database className="h-4 w-4 mr-2 text-blue-500" />
                                                                ) : (
                                                                    <FileUp className="h-4 w-4 mr-2 text-green-500" />
                                                                )}
                                                                <h4 className="font-medium truncate">
                                                                    {submission.submissionType === "json"
                                                                        ? `JSON Data (${submission.data?.length || 0} records)`
                                                                        : submission.file?.name || "Unknown file"}
                                                                </h4>
                                                            </div>
                                                            <div className="flex items-center text-sm text-muted-foreground">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                <span className="truncate">{formatTimestamp(submission.timestamp)}</span>
                                                            </div>
                                                            <p className="text-sm text-red-500 truncate">{submission.error.message}</p>
                                                        </div>

                                                        <div className="flex items-center space-x-2 ml-4">
                                                            <Badge variant={submission.retryCount > 0 ? "outline" : "secondary"}>
                                                                {submission.retryCount} {submission.retryCount === 1 ? "retry" : "retries"}
                                                            </Badge>
                                                            <Button variant="ghost" size="icon" onClick={() => handleViewDetails(submission)}>
                                                                <ExternalLink className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(submission.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="details" className="flex-1 overflow-hidden">
                            {selectedSubmission && (
                                <div className="flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-4">
                                        <Button variant="outline" size="sm" onClick={() => setActiveTab("list")}>
                                            <X className="mr-2 h-4 w-4" />
                                            Back to List
                                        </Button>
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(selectedSubmission)}
                                                disabled={isRetrying}
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit & Retry
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => handleRetry(selectedSubmission)}
                                                disabled={isRetrying || selectedSubmission.submissionType === "file"}
                                            >
                                                <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
                                                {isRetrying ? "Retrying..." : "Retry Submission"}
                                            </Button>
                                        </div>
                                    </div>

                                    {isRetrying && (
                                        <div className="mb-4">
                                            <Progress value={retryProgress} />
                                            <p className="text-sm text-center mt-1 text-muted-foreground">
                                                Retrying submission... {retryProgress}%
                                            </p>
                                        </div>
                                    )}

                                    {retryResult && (
                                        <Alert variant={retryResult.success ? "success" : "destructive"} className="mb-4">
                                            {retryResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                            <AlertTitle>{retryResult.success ? "Success" : "Retry Failed"}</AlertTitle>
                                            <AlertDescription>{retryResult.message}</AlertDescription>
                                        </Alert>
                                    )}

                                    <ScrollArea className="flex-1">
                                        <div className="space-y-4 pr-4">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Submission Details</CardTitle>
                                                    <CardDescription>Information about the failed submission</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-1">Submission Type</h4>
                                                                <div className="flex items-center">
                                                                    {selectedSubmission.submissionType === "json" ? (
                                                                        <>
                                                                            <Database className="h-4 w-4 mr-2 text-blue-500" />
                                                                            <span>JSON Data</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <FileUp className="h-4 w-4 mr-2 text-green-500" />
                                                                            <span>File Upload</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-1">Timestamp</h4>
                                                                <div className="flex items-center">
                                                                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                                                    <span>{new Date(selectedSubmission.timestamp).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h4 className="text-sm font-medium mb-1">API Endpoint</h4>
                                                            <code className="bg-muted px-2 py-1 rounded text-sm break-all">
                                                                {selectedSubmission.endpoint}
                                                            </code>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-1">HTTP Method</h4>
                                                                <Badge variant="outline">{selectedSubmission.method}</Badge>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-1">Retry Count</h4>
                                                                <Badge variant={selectedSubmission.retryCount > 0 ? "secondary" : "outline"}>
                                                                    {selectedSubmission.retryCount}{" "}
                                                                    {selectedSubmission.retryCount === 1 ? "retry" : "retries"}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {selectedSubmission.submissionType === "json" && selectedSubmission.data && (
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-1">Data Preview</h4>
                                                                <div className="bg-muted rounded-md p-3 overflow-auto max-h-[150px]">
                                                                    <pre className="text-xs">
                                                                        {JSON.stringify(selectedSubmission.data.slice(0, 2), null, 2)}
                                                                        {selectedSubmission.data.length > 2 && "\n..."}
                                                                    </pre>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    Showing {Math.min(2, selectedSubmission.data.length)} of{" "}
                                                                    {selectedSubmission.data.length} records
                                                                </p>
                                                            </div>
                                                        )}

                                                        {selectedSubmission.submissionType === "file" && selectedSubmission.file && (
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-1">File Information</h4>
                                                                <div className="bg-muted rounded-md p-3">
                                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                                        <div>
                                                                            <span className="text-muted-foreground">Name:</span>{" "}
                                                                            {selectedSubmission.file.name}
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-muted-foreground">Size:</span>{" "}
                                                                            {(selectedSubmission.file.size / 1024).toFixed(2)} KB
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-muted-foreground">Type:</span>{" "}
                                                                            {selectedSubmission.file.type || "Unknown"}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Error Information</CardTitle>
                                                    <CardDescription>Details about why the submission failed</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-4">
                                                        <Alert variant="destructive">
                                                            <AlertCircle className="h-4 w-4" />
                                                            <AlertTitle>Error Message</AlertTitle>
                                                            <AlertDescription>{selectedSubmission.error.message}</AlertDescription>
                                                        </Alert>

                                                        {selectedSubmission.error.details && (
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-1">Error Details</h4>
                                                                <div className="bg-muted rounded-md p-3 overflow-auto max-h-[100px]">
                                                                    <pre className="text-xs whitespace-pre-wrap">{selectedSubmission.error.details}</pre>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {selectedSubmission.error.response && (
                                                            <div>
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <h4 className="text-sm font-medium">Server Response</h4>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setShowResponseDetails(!showResponseDetails)}
                                                                    >
                                                                        <Code className="mr-2 h-4 w-4" />
                                                                        {showResponseDetails ? "Hide Details" : "Show Details"}
                                                                    </Button>
                                                                </div>

                                                                {showResponseDetails && (
                                                                    <div className="bg-muted rounded-md p-3 overflow-auto max-h-[200px]">
                                                                        <pre className="text-xs">
                                                                            {typeof selectedSubmission.error.response === "string"
                                                                                ? selectedSubmission.error.response
                                                                                : JSON.stringify(selectedSubmission.error.response, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                                <CardFooter className="flex justify-between">
                                                    <Button variant="outline" onClick={() => handleDelete(selectedSubmission.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete This Submission
                                                    </Button>

                                                    {selectedSubmission.submissionType === "json" && (
                                                        <Button
                                                            variant="default"
                                                            onClick={() => handleRetry(selectedSubmission)}
                                                            disabled={isRetrying}
                                                        >
                                                            <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
                                                            {isRetrying ? "Retrying..." : "Retry Now"}
                                                        </Button>
                                                    )}
                                                </CardFooter>
                                            </Card>

                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>HTTP Headers</CardTitle>
                                                    <CardDescription>Headers sent with the request</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Header Name</TableHead>
                                                                <TableHead>Value</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {Object.entries(selectedSubmission.headers).length > 0 ? (
                                                                Object.entries(selectedSubmission.headers).map(([key, value]) => (
                                                                    <TableRow key={key}>
                                                                        <TableCell className="font-medium">{key}</TableCell>
                                                                        <TableCell>{value}</TableCell>
                                                                    </TableRow>
                                                                ))
                                                            ) : (
                                                                <TableRow>
                                                                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                                                                        No custom headers
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {showEditDialog && selectedSubmission && (
                <ApiSubmissionDialog
                    data={selectedSubmission.data || []}
                    originalFile={
                        selectedSubmission.file
                            ? ({
                                name: selectedSubmission.file.name,
                                size: selectedSubmission.file.size,
                                type: selectedSubmission.file.type,
                            } as File)
                            : undefined
                    }
                    initialEndpoint={selectedSubmission.endpoint}
                    initialMethod={selectedSubmission.method}
                    initialHeaders={selectedSubmission.headers}
                    initialSubmissionType={selectedSubmission.submissionType}
                    onClose={() => {
                        setShowEditDialog(false)
                        // Remove the failed submission if it was successfully resubmitted
                        removeFailedSubmission(selectedSubmission.id)
                    }}
                />
            )}
        </>
    )
}