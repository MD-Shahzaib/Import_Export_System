import type {
    ColumnConfig,
    ValidationError,
    ValidationResult,
    HeaderValidationResult,
    FileValidationResult,
} from "./types"

/**
 * Validates Excel file headers against expected column configuration
 */
export function validateHeaders(fileHeaders: string[], expectedConfig: ColumnConfig[]): HeaderValidationResult {
    const present: string[] = []
    const missingRequired: string[] = []
    const unrecognized: string[] = []

    // Check which expected headers are present
    expectedConfig.forEach((config) => {
        if (fileHeaders.includes(config.name)) {
            present.push(config.name)
        } else if (config.required) {
            missingRequired.push(config.name)
        }
    })

    // Check for unrecognized headers
    fileHeaders.forEach((header) => {
        if (!expectedConfig.some((config) => config.name === header)) {
            unrecognized.push(header)
        }
    })

    return {
        valid: missingRequired.length === 0,
        expected: expectedConfig,
        present,
        missingRequired,
        unrecognized,
    }
}

/**
 * Validates file format
 */
export function validateFileFormat(fileName: string): boolean {
    const validExtensions = [".xlsx", ".xls"]
    const extension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase()
    return validExtensions.includes(extension)
}

/**
 * Validates data against column configuration with improved error handling
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
                    type: "missing",
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
                    type: "format",
                })
            }

            // Custom validation rules
            config.validationRules.forEach((rule) => {
                let isValid = true
                let errorType: "format" | "invalid" | "other" = "invalid"

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
                        errorType = "format"
                        break

                    case "email":
                        if (typeof value === "string") {
                            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                            isValid = emailPattern.test(value)
                        }
                        errorType = "format"
                        break

                    case "phone":
                        if (typeof value === "string") {
                            // Simple phone validation - can be made more complex
                            const phonePattern = /^[\d+\-$$$$ ]{7,20}$/
                            isValid = phonePattern.test(value)
                        }
                        errorType = "format"
                        break

                    case "date":
                        if (typeof value === "string") {
                            const date = new Date(value)
                            isValid = !isNaN(date.getTime())
                        }
                        errorType = "format"
                        break

                    case "custom":
                        if (rule.validator) {
                            isValid = rule.validator(value)
                        }
                        errorType = "other"
                        break
                }

                if (!isValid) {
                    errors.push({
                        row: rowIndex + 2,
                        column: columnName,
                        value: value,
                        message: rule.message,
                        type: errorType,
                    })
                }
            })
        })
    })

    // Group errors by type
    const errorsByType = {
        missing: errors.filter((e) => e.type === "missing"),
        format: errors.filter((e) => e.type === "format"),
        invalid: errors.filter((e) => e.type === "invalid"),
        other: errors.filter((e) => e.type === "other"),
    }

    return {
        valid: errors.length === 0,
        errors,
        errorsByType,
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
                return `Value must be text, got ${typeof value}`
            }
            break

        case "number":
            if (typeof value !== "number" || isNaN(value)) {
                return `Value must be a number, got ${typeof value}`
            }
            break

        case "date":
            if (!(value instanceof Date)) {
                const date = new Date(String(value))
                if (isNaN(date.getTime())) {
                    return `Value must be a valid date`
                }
            }
            break

        case "boolean":
            if (typeof value !== "boolean") {
                // Check for string representations of booleans
                if (typeof value === "string") {
                    const normalized = value.toLowerCase().trim()
                    if (!["true", "false", "yes", "no", "1", "0"].includes(normalized)) {
                        return `Value must be a boolean (true/false, yes/no, 1/0)`
                    }
                } else {
                    return `Value must be a boolean, got ${typeof value}`
                }
            }
            break

        case "email":
            if (typeof value !== "string") {
                return `Email must be text, got ${typeof value}`
            } else {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                if (!emailPattern.test(value)) {
                    return `Invalid email format`
                }
            }
            break

        case "phone":
            if (typeof value !== "string" && typeof value !== "number") {
                return `Phone must be text or number, got ${typeof value}`
            } else {
                const phoneStr = String(value)
                const phonePattern = /^[\d+\-$$$$ ]{7,20}$/
                if (!phonePattern.test(phoneStr)) {
                    return `Invalid phone number format`
                }
            }
            break
    }

    return null
}

/**
 * Performs complete file validation
 */
export function validateFile(
    fileName: string,
    headers: string[],
    data: any[],
    columnConfig: ColumnConfig[],
): FileValidationResult {
    // Validate file format
    const formatValid = validateFileFormat(fileName)

    // Validate headers
    const headerResult = validateHeaders(headers, columnConfig)

    // Only validate data if headers are valid
    let dataResult: ValidationResult | null = null
    if (headerResult.valid) {
        dataResult = validateData(data, columnConfig)
    }

    return {
        valid: formatValid && headerResult.valid && (dataResult ? dataResult.valid : false),
        format: formatValid,
        headers: headerResult,
        data: dataResult,
    }
}

/**
 * Gets row highlight class based on validation errors
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

    const error = errors.find((error) => error.row === displayRowIndex && error.column === columnName)

    if (!error) return ""

    switch (error.type) {
        case "missing":
            return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700"
        case "format":
            return "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700"
        case "invalid":
            return "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700"
        default:
            return "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700"
    }
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

/**
 * Gets error icon for a specific cell based on error type
 */
export function getCellErrorIcon(rowIndex: number, columnName: string, errors: ValidationError[]) {
    // Add 2 because row 0 is headers and we're 1-indexing for users
    const displayRowIndex = rowIndex + 2

    const error = errors.find((error) => error.row === displayRowIndex && error.column === columnName)

    if (!error) return null

    return error.type
}

/**
 * Generates a suggestion to fix an error
 */
export function getSuggestionForError(error: ValidationError): string {
    switch (error.type) {
        case "missing":
            return `Add a value for the "${error.column}" field`

        case "format":
            if (error.message.includes("email")) {
                return `Use a valid email format (e.g., user@example.com)`
            } else if (error.message.includes("phone")) {
                return `Use a valid phone format (e.g., +1 555-123-4567)`
            } else if (error.message.includes("date")) {
                return `Use a valid date format (e.g., YYYY-MM-DD)`
            } else if (error.message.includes("number")) {
                return `Enter a numeric value`
            } else {
                return `Check the format of your data`
            }

        case "invalid":
            if (error.message.includes("min")) {
                return `Value is too small`
            } else if (error.message.includes("max")) {
                return `Value is too large`
            } else {
                return `Enter a valid value`
            }

        default:
            return `Review and correct the data`
    }
}

