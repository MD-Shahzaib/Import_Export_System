"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FilePreviewProps {
  data: any[]
  columns: any[]
}

export function FilePreview({ data, columns }: FilePreviewProps) {
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
                  <TableHead key={index}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>{row[column.accessorKey] || "-"}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
      <div className="p-2 text-center text-sm text-muted-foreground">Showing preview of first {data.length} rows</div>
    </Card>
  )
}

