"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { HeaderValidationResult } from "@/lib/types"

interface HeaderValidatorProps {
    validationResult: HeaderValidationResult
    onContinue: () => void
    onCancel: () => void
}

export function HeaderValidator({ validationResult, onContinue, onCancel }: HeaderValidatorProps) {
    const { valid, missingRequired, unrecognized, present } = validationResult
    const hasMissingRequired = missingRequired.length > 0
    const hasUnrecognized = unrecognized.length > 0

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle>Header Validation</CardTitle>
                        {valid ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Valid
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                <XCircle className="h-3 w-3 mr-1" /> Invalid
                            </Badge>
                        )}
                    </div>
                </div>
                <CardDescription>Validating Excel file headers against expected column configuration</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {hasMissingRequired && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Missing Required Headers</AlertTitle>
                        <AlertDescription>
                            The following required headers are missing from your Excel file:
                            <div className="mt-2 flex flex-wrap gap-2">
                                {missingRequired.map((header, index) => (
                                    <Badge key={index} variant="outline" className="bg-red-50 border-red-200">
                                        {header}
                                    </Badge>
                                ))}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {hasUnrecognized && (
                    <Alert variant="warning">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Unrecognized Headers</AlertTitle>
                        <AlertDescription>
                            The following headers in your Excel file are not recognized:
                            <div className="mt-2 flex flex-wrap gap-2">
                                {unrecognized.map((header, index) => (
                                    <Badge key={index} variant="outline" className="bg-amber-50 border-amber-200">
                                        {header}
                                    </Badge>
                                ))}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="rounded-md border">
                    <ScrollArea className="h-[300px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Expected Header</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead>Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {validationResult.expected.map((header, index) => {
                                    const isPresent = present.includes(header.name)
                                    const status = header.required
                                        ? isPresent
                                            ? "present"
                                            : "missing"
                                        : isPresent
                                            ? "present"
                                            : "optional"

                                    return (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">
                                                {header.displayName || header.name}
                                                {header.required && <span className="text-red-500 ml-1">*</span>}
                                            </TableCell>
                                            <TableCell>
                                                {status === "present" && (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Present
                                                    </Badge>
                                                )}
                                                {status === "missing" && (
                                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                        <XCircle className="h-3 w-3 mr-1" /> Missing
                                                    </Badge>
                                                )}
                                                {status === "optional" && (
                                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                                        Optional
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {header.description || `${header.required ? "Required" : "Optional"} ${header.type} field`}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </CardContent>

            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button onClick={onContinue} disabled={!valid} variant={valid ? "default" : "outline"}>
                    {valid ? "Continue" : "Fix Headers"}
                </Button>
            </CardFooter>
        </Card>
    )
}

