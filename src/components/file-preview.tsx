"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react"
import type { ValidationError } from "@/lib/types"
import {
  getCellErrorMessage,
  getCellHighlightClass,
  getRowHighlightClass,
  getCellErrorIcon,
} from "@/lib/validation-utils"

interface FilePreviewProps {
  data: any[]
  columns: any[]
  validationErrors?: ValidationError[]
}

export function FilePreview({ data, columns, validationErrors = [] }: FilePreviewProps) {
  if (!data.length || !columns.length) {
    return <p className="text-center text-muted-foreground">No preview data available</p>
  }

  return (
    <Card>
      <div className="rounded-md border">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index} className="relative">
                    <div className="flex items-center">
                      {column.header}
                      {column.required && <span className="ml-1 text-red-500">*</span>}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex} className={getRowHighlightClass(rowIndex, validationErrors)}>
                  {columns.map((column, colIndex) => {
                    const cellValue = row[column.accessorKey] || "-"
                    const cellClass = getCellHighlightClass(rowIndex, column.accessorKey, validationErrors)
                    const errorMessage = getCellErrorMessage(rowIndex, column.accessorKey, validationErrors)
                    const errorType = getCellErrorIcon(rowIndex, column.accessorKey, validationErrors)

                    return (
                      <TableCell key={colIndex} className={cellClass}>
                        {errorMessage ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center">
                                  <span className="mr-1">{cellValue}</span>
                                  {errorType === "missing" && <XCircle className="h-4 w-4 text-destructive" />}
                                  {errorType === "format" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                  {errorType === "invalid" && <AlertCircle className="h-4 w-4 text-orange-500" />}
                                  {errorType === "other" && <HelpCircle className="h-4 w-4 text-blue-500" />}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{errorMessage}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          cellValue
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
      <div className="p-2 text-center text-sm text-muted-foreground">
        Showing preview of first {data.length} rows
        {validationErrors.length > 0 && (
          <span className="text-destructive ml-2">
            ({validationErrors.length} validation {validationErrors.length === 1 ? "error" : "errors"})
          </span>
        )}
      </div>
    </Card>
  )
}

