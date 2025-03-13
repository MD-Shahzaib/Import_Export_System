import type {
    ColumnConfig,
    ValidationError,
    ValidationResult,
    HeaderValidationResult,
    FileValidationResult,
    ImporterConfig,
    DataTypeConfig,
} from "./types"

/**
 * Validates Excel file headers against expected column configuration
 */
export function validateHeaders(fileHeaders: string[], config: ImporterConfig): HeaderValidationResult {
    const present: string[] = []
    const missingRequired: string[] = []
    const unrecognized: string[] = []

    // Check which expected headers are present
    config.columns.forEach((column) => {
        if (fileHeaders.includes(column.name)) {
            present.push(column.name)
        } else if (column.required) {
            missingRequired.push(column.name)
        }
    })

    // Check for unrecognized headers
    fileHeaders.forEach((header) => {
        if (!config.columns.some((column) => column.name === header)) {
            unrecognized.push(header)
        }
    })

    return {
        valid: missingRequired.length === 0,
        expected: config.columns,
        present,
        missingRequired,
        unrecognized,
    }
}

/**
 * Validates file format
 */
export function validateFileFormat(fileName: string, acceptedFormats: string[]): boolean {
    const extension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase()
    return acceptedFormats.includes(extension)
}

/**
 * Validates data against column configuration with improved error handling
 */
export function validateData(data: any[], config: ImporterConfig): ValidationResult {
    const errors: ValidationError[] = []

    // Create a map of column names to their configuration for faster lookup
    const configMap = new Map<string, ColumnConfig>()
    config.columns.forEach((column) => {
        configMap.set(column.name, column)
    })

    // Validate each row
    data.forEach((row, rowIndex) => {
        // Check for required fields
        config.columns.forEach((column) => {
            const { name, required } = column

            // Skip validation for non-required fields
            if (!required) return

            const value = row[name]

            // Check if required field is missing or empty
            if (value === undefined || value === null || value === "") {
                errors.push({
                    row: rowIndex + 2, // +2 because row 0 is headers and we're 1-indexing for users
                    column: name,
                    value: value,
                    message: `Required field "${column.displayName || name}" is missing or empty`,
                    type: "missing",
                    suggestion: `Add a value for the "${column.displayName || name}" field`,
                })
            }
        })

        // Validate each field against its validation rules
        Object.keys(row).forEach((columnName) => {
            const column = configMap.get(columnName)
            if (!column) return // Skip columns not in config

            const value = row[columnName]

            // Skip validation if value is empty and field is not required
            if ((value === undefined || value === null || value === "") && !column.required) {
                return
            }

            // Type validation
            const typeError = validateType(value, column.type, config.dataTypeConfig)
            if (typeError) {
                errors.push({
                    row: rowIndex + 2,
                    column: columnName,
                    value: value,
                    message: typeError.message,
                    type: typeError.type,
                    suggestion: typeError.suggestion,
                })
            }

            // Format validation if a specific format is defined
            if (column.format && value !== undefined && value !== null && value !== "") {
                const formatError = validateFormat(value, column.type, column.format)
                if (formatError) {
                    errors.push({
                        row: rowIndex + 2,
                        column: columnName,
                        value: value,
                        message: formatError.message,
                        type: "format",
                        suggestion: formatError.suggestion,
                    })
                }
            }

            // Custom validation rules
            column.validationRules.forEach((rule) => {
                const validationResult = validateRule(value, rule, column.type, config.dataTypeConfig)
                if (!validationResult.valid) {
                    errors.push({
                        row: rowIndex + 2,
                        column: columnName,
                        value: value,
                        message: rule.message || validationResult.message,
                        type: validationResult.type,
                        suggestion: validationResult.suggestion,
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
function validateType(
    value: any,
    type: string,
    typeConfig: DataTypeConfig,
): { message: string; type: "format" | "invalid" | "other"; suggestion: string } | null {
    if (value === undefined || value === null || value === "") {
        return null // Empty values are handled by required check
    }

    switch (type) {
        case "string":
            if (typeof value !== "string") {
                return {
                    message: `Value must be text, got ${typeof value}`,
                    type: "format",
                    suggestion: "Enter a text value",
                }
            }

            // Check string length constraints
            if (typeof value === "string") {
                const { minLength, maxLength } = typeConfig.string

                if (minLength > 0 && value.length < minLength) {
                    return {
                        message: `Text is too short (minimum ${minLength} characters)`,
                        type: "invalid",
                        suggestion: `Enter at least ${minLength} characters`,
                    }
                }

                if (maxLength > 0 && value.length > maxLength) {
                    return {
                        message: `Text is too long (maximum ${maxLength} characters)`,
                        type: "invalid",
                        suggestion: `Enter no more than ${maxLength} characters`,
                    }
                }
            }
            break

        case "number":
            let numValue: number

            if (typeof value === "number") {
                numValue = value
            } else if (typeof value === "string") {
                // Try to convert string to number
                const parsed = Number.parseFloat(value)
                if (isNaN(parsed)) {
                    return {
                        message: `Value must be a number, got "${value}"`,
                        type: "format",
                        suggestion: "Enter a numeric value",
                    }
                }
                numValue = parsed
            } else {
                return {
                    message: `Value must be a number, got ${typeof value}`,
                    type: "format",
                    suggestion: "Enter a numeric value",
                }
            }

            // Check number constraints
            const { min, max, integerOnly } = typeConfig.number

            if (integerOnly && !Number.isInteger(numValue)) {
                return {
                    message: `Value must be an integer, got ${numValue}`,
                    type: "format",
                    suggestion: "Enter a whole number without decimals",
                }
            }

            if (min !== null && numValue < min) {
                return {
                    message: `Value is too small (minimum ${min})`,
                    type: "invalid",
                    suggestion: `Enter a value of at least ${min}`,
                }
            }

            if (max !== null && numValue > max) {
                return {
                    message: `Value is too large (maximum ${max})`,
                    type: "invalid",
                    suggestion: `Enter a value no greater than ${max}`,
                }
            }
            break

        case "date":
            let dateValue: Date

            if (value instanceof Date) {
                dateValue = value
            } else if (typeof value === "string") {
                // Try to parse date string
                const date = new Date(value)
                if (isNaN(date.getTime())) {
                    return {
                        message: `Value must be a valid date, got "${value}"`,
                        type: "format",
                        suggestion: `Enter a date in ${typeConfig.date.format || "YYYY-MM-DD"} format`,
                    }
                }
                dateValue = date
            } else {
                return {
                    message: `Value must be a date, got ${typeof value}`,
                    type: "format",
                    suggestion: `Enter a date in ${typeConfig.date.format || "YYYY-MM-DD"} format`,
                }
            }

            // Check date constraints
            const { min: minDate, max: maxDate } = typeConfig.date

            if (minDate) {
                const minDateValue = new Date(minDate)
                if (dateValue < minDateValue) {
                    return {
                        message: `Date is too early (minimum ${minDate})`,
                        type: "invalid",
                        suggestion: `Enter a date on or after ${minDate}`,
                    }
                }
            }

            if (maxDate) {
                const maxDateValue = new Date(maxDate)
                if (dateValue > maxDateValue) {
                    return {
                        message: `Date is too late (maximum ${maxDate})`,
                        type: "invalid",
                        suggestion: `Enter a date on or before ${maxDate}`,
                    }
                }
            }
            break

        case "boolean":
            const { trueValues, falseValues, caseSensitive } = typeConfig.boolean

            if (typeof value === "boolean") {
                // Already a boolean, no validation needed
                break
            }

            if (typeof value === "string") {
                const strValue = caseSensitive ? value : value.toLowerCase()
                const normalizedTrueValues = caseSensitive ? trueValues : trueValues.map((v) => v.toLowerCase())
                const normalizedFalseValues = caseSensitive ? falseValues : falseValues.map((v) => v.toLowerCase())

                if (!normalizedTrueValues.includes(strValue) && !normalizedFalseValues.includes(strValue)) {
                    return {
                        message: `Value must be a boolean (${trueValues.join("/")} or ${falseValues.join("/")})`,
                        type: "format",
                        suggestion: `Enter one of: ${[...trueValues, ...falseValues].join(", ")}`,
                    }
                }
            } else {
                return {
                    message: `Value must be a boolean, got ${typeof value}`,
                    type: "format",
                    suggestion: `Enter one of: ${[...trueValues, ...falseValues].join(", ")}`,
                }
            }
            break

        case "email":
            if (typeof value !== "string") {
                return {
                    message: `Email must be text, got ${typeof value}`,
                    type: "format",
                    suggestion: "Enter a valid email address",
                }
            }

            // Check email format
            const emailPattern = typeConfig.email.pattern
                ? new RegExp(typeConfig.email.pattern)
                : /^[^\s@]+@[^\s@]+\.[^\s@]+$/

            if (!emailPattern.test(value)) {
                return {
                    message: `Invalid email format`,
                    type: "format",
                    suggestion: "Enter a valid email address (e.g., user@example.com)",
                }
            }

            // Check domain restrictions if any
            if (typeConfig.email.allowedDomains.length > 0) {
                const domain = value.split("@")[1]
                if (!typeConfig.email.allowedDomains.includes(domain)) {
                    return {
                        message: `Email domain not allowed`,
                        type: "invalid",
                        suggestion: `Use an email with one of these domains: ${typeConfig.email.allowedDomains.join(", ")}`,
                    }
                }
            }
            break

        case "phone":
            if (typeof value !== "string" && typeof value !== "number") {
                return {
                    message: `Phone must be text or number, got ${typeof value}`,
                    type: "format",
                    suggestion: "Enter a valid phone number",
                }
            }

            const phoneStr = String(value)

            // Check phone format
            const phonePattern = typeConfig.phone.pattern ? new RegExp(typeConfig.phone.pattern) : /^[\d+\-$$$$ ]{7,20}$/

            if (!phonePattern.test(phoneStr)) {
                return {
                    message: `Invalid phone number format`,
                    type: "format",
                    suggestion: typeConfig.phone.format
                        ? `Enter a phone number in ${typeConfig.phone.format} format`
                        : "Enter a valid phone number",
                }
            }

            // Check international format if not allowed
            if (!typeConfig.phone.allowInternational && phoneStr.includes("+")) {
                return {
                    message: `International phone numbers not allowed`,
                    type: "invalid",
                    suggestion: "Enter a local phone number without country code",
                }
            }
            break
    }

    return null
}

/**
 * Validates a value against a specific format
 */
function validateFormat(value: any, type: string, format: string): { message: string; suggestion: string } | null {
    if (!format || value === undefined || value === null || value === "") {
        return null
    }

    switch (type) {
        case "string":
            if (typeof value === "string") {
                try {
                    const regex = new RegExp(format)
                    if (!regex.test(value)) {
                        return {
                            message: `Text does not match required format`,
                            suggestion: `Format should match pattern: ${format}`,
                        }
                    }
                } catch (e) {
                    // Invalid regex pattern, skip validation
                    console.error("Invalid regex pattern:", format)
                }
            }
            break

        case "date":
            // Date format validation would require a more complex implementation
            // with date-fns or similar library to validate against specific formats
            break

        case "number":
            // Number format validation would require a more complex implementation
            // to validate against specific number formats like "#,###.##"
            break
    }

    return null
}

/**
 * Validates a value against a validation rule
 */
function validateRule(
    value: any,
    rule: { type: string; value?: any; message: string },
    columnType: string,
    typeConfig: DataTypeConfig,
): { valid: boolean; message: string; type: "format" | "invalid" | "other"; suggestion: string } {
    // Skip validation for empty values (handled by required check)
    if (value === undefined || value === null || value === "") {
        return { valid: true, message: "", type: "other", suggestion: "" }
    }

    switch (rule.type) {
        case "min":
            if (columnType === "number" && typeof value === "number") {
                if (value < rule.value) {
                    return {
                        valid: false,
                        message: `Value must be at least ${rule.value}`,
                        type: "invalid",
                        suggestion: `Enter a value of at least ${rule.value}`,
                    }
                }
            } else if (typeof value === "string") {
                if (value.length < rule.value) {
                    return {
                        valid: false,
                        message: `Text must be at least ${rule.value} characters`,
                        type: "invalid",
                        suggestion: `Enter at least ${rule.value} characters`,
                    }
                }
            }
            break

        case "max":
            if (columnType === "number" && typeof value === "number") {
                if (value > rule.value) {
                    return {
                        valid: false,
                        message: `Value must be at most ${rule.value}`,
                        type: "invalid",
                        suggestion: `Enter a value no greater than ${rule.value}`,
                    }
                }
            } else if (typeof value === "string") {
                if (value.length > rule.value) {
                    return {
                        valid: false,
                        message: `Text must be at most ${rule.value} characters`,
                        type: "invalid",
                        suggestion: `Enter no more than ${rule.value} characters`,
                    }
                }
            }
            break

        case "pattern":
            if (typeof value === "string") {
                try {
                    const pattern = new RegExp(rule.value)
                    if (!pattern.test(value)) {
                        return {
                            valid: false,
                            message: rule.message || `Value does not match required pattern`,
                            type: "format",
                            suggestion: `Enter a value matching the pattern: ${rule.value}`,
                        }
                    }
                } catch (e) {
                    // Invalid regex pattern, skip validation
                    console.error("Invalid regex pattern:", rule.value)
                }
            }
            break

        case "enum":
            if (rule.value) {
                const allowedValues = Array.isArray(rule.value)
                    ? rule.value
                    : String(rule.value)
                        .split(",")
                        .map((v) => v.trim())

                if (!allowedValues.includes(value)) {
                    return {
                        valid: false,
                        message: rule.message || `Value must be one of: ${allowedValues.join(", ")}`,
                        type: "invalid",
                        suggestion: `Choose one of: ${allowedValues.join(", ")}`,
                    }
                }
            }
            break

        case "range":
            if (columnType === "number" && typeof value === "number") {
                const [min, max] = String(rule.value).split("-").map(Number)
                if (value < min || value > max) {
                    return {
                        valid: false,
                        message: rule.message || `Value must be between ${min} and ${max}`,
                        type: "invalid",
                        suggestion: `Enter a value between ${min} and ${max}`,
                    }
                }
            } else if (columnType === "date") {
                const [minStr, maxStr] = String(rule.value).split("-")
                const date = new Date(value)
                const minDate = new Date(minStr)
                const maxDate = new Date(maxStr)

                if (date < minDate || date > maxDate) {
                    return {
                        valid: false,
                        message: rule.message || `Date must be between ${minStr} and ${maxStr}`,
                        type: "invalid",
                        suggestion: `Enter a date between ${minStr} and ${maxStr}`,
                    }
                }
            }
            break

        case "precision":
            if (columnType === "number" && typeof value === "number") {
                const decimalStr = value.toString().split(".")[1] || ""
                if (decimalStr.length > rule.value) {
                    return {
                        valid: false,
                        message: rule.message || `Value must have at most ${rule.value} decimal places`,
                        type: "format",
                        suggestion: `Enter a number with at most ${rule.value} decimal places`,
                    }
                }
            }
            break

        case "domain":
            if (columnType === "email" && typeof value === "string") {
                const domain = value.split("@")[1]
                const allowedDomains = Array.isArray(rule.value)
                    ? rule.value
                    : String(rule.value)
                        .split(",")
                        .map((v) => v.trim())

                if (!allowedDomains.includes(domain)) {
                    return {
                        valid: false,
                        message: rule.message || `Email domain must be one of: ${allowedDomains.join(", ")}`,
                        type: "invalid",
                        suggestion: `Use an email with one of these domains: ${allowedDomains.join(", ")}`,
                    }
                }
            }
            break

        case "length":
            if (typeof value === "string") {
                if (String(rule.value).includes("-")) {
                    const [min, max] = String(rule.value).split("-").map(Number)
                    if (value.length < min || value.length > max) {
                        return {
                            valid: false,
                            message: rule.message || `Text length must be between ${min} and ${max} characters`,
                            type: "invalid",
                            suggestion: `Enter text between ${min} and ${max} characters long`,
                        }
                    }
                } else {
                    const exactLength = Number.parseInt(String(rule.value))
                    if (value.length !== exactLength) {
                        return {
                            valid: false,
                            message: rule.message || `Text must be exactly ${exactLength} characters`,
                            type: "invalid",
                            suggestion: `Enter exactly ${exactLength} characters`,
                        }
                    }
                }
            }
            break
    }

    return { valid: true, message: "", type: "other", suggestion: "" }
}

/**
 * Performs complete file validation
 */
export function validateFile(
    fileName: string,
    headers: string[],
    data: any[],
    config: ImporterConfig,
): FileValidationResult {
    // Validate file format
    const formatValid = validateFileFormat(fileName, config.acceptedFormats)

    // Validate headers
    const headerResult = validateHeaders(headers, config)

    // Only validate data if headers are valid
    let dataResult: ValidationResult | null = null
    if (headerResult.valid) {
        dataResult = validateData(data, config)
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
    return error.suggestion || "Review and correct the data"
}

/**
 * Format a value according to column configuration
 */
export function formatValue(value: any, column: ColumnConfig): string {
    if (value === undefined || value === null || value === "") {
        return ""
    }

    switch (column.type) {
        case "number":
            if (typeof value === "number") {
                if (column.format) {
                    // Simple number formatting - in a real app, use a library like Intl or numeral.js
                    return value.toLocaleString()
                }
                return value.toString()
            }
            return value

        case "date":
            if (value instanceof Date) {
                if (column.format) {
                    // Simple date formatting - in a real app, use a library like date-fns
                    return value.toLocaleDateString()
                }
                return value.toISOString().split("T")[0]
            }
            return value

        case "boolean":
            if (typeof value === "boolean") {
                return value ? "Yes" : "No"
            }
            return value

        default:
            return String(value)
    }
}

/**
 * Handle invalid data according to column configuration
 */
export function handleInvalidData(value: any, column: ColumnConfig): any {
    switch (column.invalidHandling) {
        case "remove":
            return null

        case "default":
            return column.defaultValue || null

        case "flag":
        case "reject":
        default:
            return value
    }
}

