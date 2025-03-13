export interface ColumnConfig {
    name: string
    required: boolean
    type: "string" | "number" | "date" | "boolean" | "email" | "phone"
    description?: string
    validationRules: ValidationRule[]
}

export interface ValidationRule {
    type: "min" | "max" | "pattern" | "custom" | "email" | "phone" | "date"
    value?: any
    message: string
    validator?: (value: any) => boolean
}

export interface ValidationError {
    row: number
    column: string
    value: any
    message: string
    type: "missing" | "format" | "invalid" | "other"
}

export interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
    errorsByType: {
        missing: ValidationError[]
        format: ValidationError[]
        invalid: ValidationError[]
        other: ValidationError[]
    }
}

export interface HeaderValidationResult {
    valid: boolean
    expected: ColumnConfig[]
    present: string[]
    missingRequired: string[]
    unrecognized: string[]
}

export interface FileValidationResult {
    valid: boolean
    format: boolean
    headers: HeaderValidationResult
    data: ValidationResult | null
}

