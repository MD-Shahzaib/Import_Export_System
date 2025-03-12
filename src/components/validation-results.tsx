"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import type { ValidationError } from "@/lib/types"

interface ValidationResultsProps {
    errors: ValidationError[]
    onContinue: () => void
    onCancel: () => void
}

export function ValidationResults({ errors, onContinue, onCancel }: ValidationResultsProps) {
    const hasErrors = errors.length > 0

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center">
                    {hasErrors ? (
                        <>
                            <XCircle className="mr-2 h-5 w-5 text-destructive" />
                            Validation Failed
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                            Validation Successful
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
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Validation Error</AlertTitle>
                        <AlertDescription>
                            {errors.length} {errors.length === 1 ? "issue" : "issues"} found in your data
                        </AlertDescription>
                    </Alert>

                    <ScrollArea className="h-[300px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Row</TableHead>
                                    <TableHead className="w-[200px]">Column</TableHead>
                                    <TableHead>Issue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {errors.map((error, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{error.row}</TableCell>
                                        <TableCell>{error.column}</TableCell>
                                        <TableCell>{error.message}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
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

