import type { ColumnConfig, ValidationError, ValidationResult } from "./types"

/**
 * Validates data against column configuration
 */
export function validateData(data: any[], columnConfig: ColumnConfig[]): ValidationResult {
    const errors: ValidationError[] = []

    // Create a map of column names to their configuration for faster lookup
    const configMap = new Map<string, ColumnConfig>()
    columnConfig.forEach((config) => {
        configMap.set(config.name, config)
    })

    // Validate each row
    data.forEach((row, rowIndex) => {
        // Check for required fields
        columnConfig.forEach((config) => {
            const { name, required } = config

            // Skip validation for non-required fields
            if (!required) return

            const value = row[name]

            // Check if required field is missing or empty
            if (value === undefined || value === null || value === "") {
                errors.push({
                    row: rowIndex + 2, // +2 because row 0 is headers and we're 1-indexing for users
                    column: name,
                    value: value,
                    message: `Required field "${name}" is missing or empty`,
                })
            }
        })

        // Validate each field against its validation rules
        Object.keys(row).forEach((columnName) => {
            const config = configMap.get(columnName)
            if (!config) return // Skip columns not in config

            const value = row[columnName]

            // Skip validation if value is empty and field is not required
            if ((value === undefined || value === null || value === "") && !config.required) {
                return
            }

            // Type validation
            const typeError = validateType(value, config.type)
            if (typeError) {
                errors.push({
                    row: rowIndex + 2,
                    column: columnName,
                    value: value,
                    message: typeError,
                })
            }

            // Custom validation rules
            config.validationRules.forEach((rule) => {
                let isValid = true

                switch (rule.type) {
                    case "min":
                        if (config.type === "number" && typeof value === "number") {
                            isValid = value >= rule.value
                        } else if (typeof value === "string") {
                            isValid = value.length >= rule.value
                        }
                        break

                    case "max":
                        if (config.type === "number" && typeof value === "number") {
                            isValid = value <= rule.value
                        } else if (typeof value === "string") {
                            isValid = value.length <= rule.value
                        }
                        break

                    case "pattern":
                        if (typeof value === "string") {
                            const pattern = new RegExp(rule.value)
                            isValid = pattern.test(value)
                        }
                        break

                    case "custom":
                        if (rule.validator) {
                            isValid = rule.validator(value)
                        }
                        break
                }

                if (!isValid) {
                    errors.push({
                        row: rowIndex + 2,
                        column: columnName,
                        value: value,
                        message: rule.message,
                    })
                }
            })
        })
    })

    return {
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Validates that a value matches the expected type
 */
function validateType(value: any, type: string): string | null {
    if (value === undefined || value === null || value === "") {
        return null // Empty values are handled by required check
    }

    switch (type) {
        case "string":
            if (typeof value !== "string") {
                return `Value must be a string, got ${typeof value}`
            }
            break

        case "number":
            if (typeof value !== "number" || isNaN(value)) {
                return `Value must be a number, got ${typeof value}`
            }
            break

        case "date":
            if (!(value instanceof Date) && isNaN(Date.parse(String(value)))) {
                return `Value must be a valid date`
            }
            break

        case "boolean":
            if (typeof value !== "boolean") {
                return `Value must be a boolean, got ${typeof value}`
            }
            break
    }

    return null
}

/**
 * Highlights rows with validation errors
 */
export function getRowHighlightClass(rowIndex: number, errors: ValidationError[]): string {
    // Add 2 because row 0 is headers and we're 1-indexing for users
    const displayRowIndex = rowIndex + 2

    const hasError = errors.some((error) => error.row === displayRowIndex)

    return hasError ? "bg-red-50 dark:bg-red-900/20" : ""
}

/**
 * Gets cell highlight class based on validation errors
 */
export function getCellHighlightClass(rowIndex: number, columnName: string, errors: ValidationError[]): string {
    // Add 2 because row 0 is headers and we're 1-indexing for users
    const displayRowIndex = rowIndex + 2

    const hasError = errors.some((error) => error.row === displayRowIndex && error.column === columnName)

    return hasError ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700" : ""
}

/**
 * Gets error message for a specific cell
 */
export function getCellErrorMessage(rowIndex: number, columnName: string, errors: ValidationError[]): string | null {
    // Add 2 because row 0 is headers and we're 1-indexing for users
    const displayRowIndex = rowIndex + 2

    const error = errors.find((error) => error.row === displayRowIndex && error.column === columnName)

    return error ? error.message : null
}

