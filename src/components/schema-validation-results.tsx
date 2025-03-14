"use client"

import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, CheckCircle2, FileWarning, Trash2 } from "lucide-react"
import type { SchemaValidationProps } from "@/lib/types"

export function SchemaValidationResults({
    data,
    schemaValidationResult,
    onContinue,
    onRemoveColumns,
    onCancel,
}: SchemaValidationProps) {
    const { valid, extraColumns, validData, errorReport } = schemaValidationResult
    const [selectedColumns, setSelectedColumns] = useState<string[]>([...extraColumns])
    const [showSampleData, setShowSampleData] = useState(true)

    const handleColumnToggle = (column: string, checked: boolean) => {
        if (checked) {
            setSelectedColumns((prev) => [...prev, column])
        } else {
            setSelectedColumns((prev) => prev.filter((col) => col !== column))
        }
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedColumns([...extraColumns])
        } else {
            setSelectedColumns([])
        }
    }

    const handleRemoveSelected = () => {
        onRemoveColumns(selectedColumns)
    }

    const handleContinue = () => {
        onContinue(validData)
    }

    // Get sample data for display
    const sampleData = data.slice(0, 3)

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center">
                    {valid ? (
                        <>
                            <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                            Schema Validation Passed
                        </>
                    ) : (
                        <>
                            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                            Schema Validation Warning
                        </>
                    )}
                </CardTitle>
                <CardDescription>
                    {valid
                        ? "All columns in the data match the defined schema."
                        : errorReport?.message || "The data contains columns not defined in the schema."}
                </CardDescription>
            </CardHeader>

            {!valid && (
                <CardContent className="space-y-4">
                    <Alert variant="warning" className="bg-amber-50 border-amber-200">
                        <FileWarning className="h-4 w-4 text-amber-500" />
                        <AlertTitle>Extra Columns Detected</AlertTitle>
                        <AlertDescription>
                            The following columns are not defined in your schema. You can remove them or continue with all columns.
                        </AlertDescription>
                    </Alert>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={selectedColumns.length === extraColumns.length}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Select all columns"
                                        />
                                    </TableHead>
                                    <TableHead>Column Name</TableHead>
                                    {showSampleData && <TableHead>Sample Data</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {extraColumns.map((column, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedColumns.includes(column)}
                                                onCheckedChange={(checked) => handleColumnToggle(column, checked as boolean)}
                                                aria-label={`Select ${column}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {column}
                                            <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                                                Extra
                                            </Badge>
                                        </TableCell>
                                        {showSampleData && (
                                            <TableCell className="text-sm text-muted-foreground">
                                                <ScrollArea className="h-[80px] w-[300px]">
                                                    <div className="space-y-1 p-1">
                                                        {sampleData.map((row, i) => (
                                                            <div key={i} className="truncate">
                                                                {row[column] !== undefined ? String(row[column]) : <em>empty</em>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveSelected}
                            disabled={selectedColumns.length === 0}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Selected Columns
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowSampleData(!showSampleData)}>
                            {showSampleData ? "Hide Sample Data" : "Show Sample Data"}
                        </Button>
                    </div>
                </CardContent>
            )}

            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button onClick={handleContinue}>Continue {!valid && "With All Columns"}</Button>
            </CardFooter>
        </Card>
    )
}

