"use client"

import { ExcelImportExport } from "./excel-import-export"

interface SimpleExcelImporterProps {
    requiredColumns: string[]
    optionalColumns?: string[]
    acceptedFormats?: string[]
    strictSchema?: boolean
    title?: string
}

export function SimpleExcelImporter({
    requiredColumns,
    optionalColumns = [],
    acceptedFormats = [".xlsx", ".xls"],
    strictSchema = false,
    title = "Excel Import & Export System",
}: SimpleExcelImporterProps) {
    return (
        <div className="space-y-4">
            {title && <h1 className="text-2xl font-bold">{title}</h1>}

            <ExcelImportExport
                requiredColumns={requiredColumns}
                optionalColumns={optionalColumns}
                acceptedFormats={acceptedFormats}
                strictSchema={strictSchema}
            />
        </div>
    )
}

