export interface ColumnConfig {
    name: string
    displayName?: string
    required: boolean
    type: "string" | "number" | "date" | "boolean" | "email" | "phone"
    description?: string
    validationRules: ValidationRule[]
    format?: string | null
    invalidHandling: InvalidDataHandling
    defaultValue?: string
}

export interface ValidationRule {
    type:
    | "min"
    | "max"
    | "pattern"
    | "custom"
    | "email"
    | "phone"
    | "date"
    | "required"
    | "enum"
    | "precision"
    | "range"
    | "domain"
    | "length"
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
    suggestion?: string
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

export type InvalidDataHandling = "flag" | "remove" | "default" | "reject"

export type InvalidColumnHandling = "ignore" | "warn" | "reject" | "include"

export interface StringTypeConfig {
    minLength: number
    maxLength: number
    format?: string
    trim: boolean
}

export interface NumberTypeConfig {
    min?: number | null
    max?: number | null
    precision: number
    integerOnly: boolean
}

export interface DateTypeConfig {
    min?: string
    max?: string
    format?: string
}

export interface BooleanTypeConfig {
    trueValues: string[]
    falseValues: string[]
    caseSensitive: boolean
}

export interface EmailTypeConfig {
    pattern?: string
    allowedDomains: string[]
}

export interface PhoneTypeConfig {
    pattern?: string
    format?: string
    allowInternational: boolean
}

export interface DataTypeConfig {
    string: StringTypeConfig
    number: NumberTypeConfig
    date: DateTypeConfig
    boolean: BooleanTypeConfig
    email: EmailTypeConfig
    phone: PhoneTypeConfig
}

export interface ImporterConfig {
    columns: ColumnConfig[]
    acceptedFormats: string[]
    invalidColumnHandling: InvalidColumnHandling
    dataTypeConfig: DataTypeConfig
}

