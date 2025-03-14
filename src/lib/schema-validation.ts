import type { SchemaValidationResult, ImporterConfig } from "@/lib/types"

/**
 * Validates data against a schema, specifically checking for extra/unrequired columns
 */
export function validateSchema(data: any[], config: ImporterConfig): SchemaValidationResult {
    // Extract column names from the schema
    const schemaColumns = config.columns.map((col) => col.name)

    // If there's no data, return early
    if (!data.length) {
        return {
            valid: true,
            extraColumns: [],
            validData: data,
            errorReport: null,
        }
    }

    // Get all column names from the data
    const dataColumns = Object.keys(data[0])

    // Find columns in the data that aren't in the schema
    const extraColumns = dataColumns.filter((col) => !schemaColumns.includes(col))

    // Check if there are any extra columns
    const valid = extraColumns.length === 0 || config.invalidColumnHandling === "include"

    // Create error report if there are extra columns
    const errorReport =
        extraColumns.length > 0
            ? {
                message: `Found ${extraColumns.length} column(s) not defined in the schema`,
                details: extraColumns.map((col) => ({
                    column: col,
                    message: `Column "${col}" is not defined in the schema`,
                })),
            }
            : null

    // Process data based on configuration
    let validData = data

    if (extraColumns.length > 0) {
        switch (config.invalidColumnHandling) {
            case "reject":
                // Keep the data as is, but mark as invalid
                break

            case "ignore":
            case "warn":
                // Remove extra columns from the data
                validData = data.map((row) => {
                    const newRow = { ...row }
                    extraColumns.forEach((col) => {
                        delete newRow[col]
                    })
                    return newRow
                })
                break

            case "include":
                // Keep all columns
                break
        }
    }

    return {
        valid,
        extraColumns,
        validData,
        errorReport,
    }
}

/**
 * Removes specific columns from data
 */
export function removeColumns(data: any[], columnsToRemove: string[]): any[] {
    if (!data.length || !columnsToRemove.length) return data

    return data.map((row) => {
        const newRow = { ...row }
        columnsToRemove.forEach((col) => {
            delete newRow[col]
        })
        return newRow
    })
}

/**
 * Keeps only specified columns in data
 */
export function keepOnlyColumns(data: any[], columnsToKeep: string[]): any[] {
    if (!data.length) return data

    return data.map((row) => {
        const newRow: Record<string, any> = {}
        columnsToKeep.forEach((col) => {
            if (col in row) {
                newRow[col] = row[col]
            }
        })
        return newRow
    })
}

/**
 * Renames columns in data
 */
export function renameColumns(data: any[], columnMap: Record<string, string>): any[] {
    if (!data.length || !Object.keys(columnMap).length) return data

    return data.map((row) => {
        const newRow: Record<string, any> = { ...row }

        Object.entries(columnMap).forEach(([oldName, newName]) => {
            if (oldName in newRow) {
                newRow[newName] = newRow[oldName]
                delete newRow[oldName]
            }
        })

        return newRow
    })
}

