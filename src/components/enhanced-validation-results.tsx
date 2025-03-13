"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle, HelpCircle, FileWarning } from "lucide-react"
import type { ValidationError, ValidationResult } from "@/lib/types"
import { getSuggestionForError } from "@/lib/validation-utils"
import { Badge } from "@/components/ui/badge"

interface EnhancedValidationResultsProps {
    validationResult: ValidationResult
    onContinue: () => void
    onCancel: () => void
}

export function EnhancedValidationResults({ validationResult, onContinue, onCancel }: EnhancedValidationResultsProps) {
    const { valid, errors, errorsByType } = validationResult
    const hasErrors = errors.length > 0

    // Count errors by type
    const missingCount = errorsByType.missing.length
    const formatCount = errorsByType.format.length
    const invalidCount = errorsByType.invalid.length
    const otherCount = errorsByType.other.length

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center">
                    {hasErrors ? (
                        <>
                            <XCircle className="mr-2 h-5 w-5 text-destructive" />
                            Data Validation Failed
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                            Data Validation Successful
                        </>
                    )}
                </CardTitle>
                <CardDescription>
                    {hasErrors
                        ? "The following issues were found in your data. Please correct them before proceeding."
                        : "All required fields are present and valid."}
                </CardDescription>
            </CardHeader>

            {hasErrors && (
                <CardContent>
                    <Alert variant="destructive" className="mb-4">
                        <FileWarning className="h-4 w-4" />
                        <AlertTitle>Validation Error</AlertTitle>
                        <AlertDescription>
                            {errors.length} {errors.length === 1 ? "issue" : "issues"} found in your data
                        </AlertDescription>
                    </Alert>

                    <Tabs defaultValue="all" className="mt-4">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="all">All ({errors.length})</TabsTrigger>
                            <TabsTrigger value="missing" disabled={missingCount === 0}>
                                Missing ({missingCount})
                            </TabsTrigger>
                            <TabsTrigger value="format" disabled={formatCount === 0}>
                                Format ({formatCount})
                            </TabsTrigger>
                            <TabsTrigger value="invalid" disabled={invalidCount === 0}>
                                Invalid ({invalidCount})
                            </TabsTrigger>
                            <TabsTrigger value="other" disabled={otherCount === 0}>
                                Other ({otherCount})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            <ErrorTable errors={errors} />
                        </TabsContent>

                        <TabsContent value="missing">
                            <ErrorTable errors={errorsByType.missing} />
                        </TabsContent>

                        <TabsContent value="format">
                            <ErrorTable errors={errorsByType.format} />
                        </TabsContent>

                        <TabsContent value="invalid">
                            <ErrorTable errors={errorsByType.invalid} />
                        </TabsContent>

                        <TabsContent value="other">
                            <ErrorTable errors={errorsByType.other} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            )}

            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={onCancel}>
                    {hasErrors ? "Cancel" : "Back"}
                </Button>
                <Button onClick={onContinue} disabled={hasErrors} variant={hasErrors ? "outline" : "default"}>
                    {hasErrors ? "Fix Data" : "Continue"}
                </Button>
            </CardFooter>
        </Card>
    )
}

interface ErrorTableProps {
    errors: ValidationError[]
}

function ErrorTable({ errors }: ErrorTableProps) {
    return (
        <ScrollArea className="h-[300px]">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Row</TableHead>
                        <TableHead className="w-[150px]">Column</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead className="w-[250px]">Suggestion</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {errors.map((error, index) => (
                        <TableRow key={index}>
                            <TableCell>{error.row}</TableCell>
                            <TableCell>{error.column}</TableCell>
                            <TableCell>
                                {error.type === "missing" && (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
                                        <XCircle className="h-3 w-3 mr-1" /> Missing
                                    </Badge>
                                )}
                                {error.type === "format" && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center">
                                        <AlertTriangle className="h-3 w-3 mr-1" /> Format
                                    </Badge>
                                )}
                                {error.type === "invalid" && (
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center">
                                        <AlertCircle className="h-3 w-3 mr-1" /> Invalid
                                    </Badge>
                                )}
                                {error.type === "other" && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center">
                                        <HelpCircle className="h-3 w-3 mr-1" /> Other
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell>{error.message}</TableCell>
                            <TableCell className="text-muted-foreground">{getSuggestionForError(error)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    )
}

