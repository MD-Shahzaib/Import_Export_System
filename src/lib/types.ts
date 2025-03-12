export interface ColumnConfig {
    name: string
    required: boolean
    type: "string" | "number" | "date" | "boolean"
    validationRules: ValidationRule[]
}

export interface ValidationRule {
    type: "min" | "max" | "pattern" | "custom"
    value?: any
    message: string
    validator?: (value: any) => boolean
}

export interface ValidationError {
    row: number
    column: string
    value: any
    message: string
}

export interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
}

