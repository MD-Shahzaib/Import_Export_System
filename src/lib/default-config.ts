import type { ImporterConfig, DataTypeConfig } from "./types"

export const defaultDataTypeConfig: DataTypeConfig = {
    string: {
        minLength: 0,
        maxLength: 255,
        trim: true,
    },
    number: {
        min: null,
        max: null,
        precision: 2,
        integerOnly: false,
    },
    date: {
        format: "YYYY-MM-DD",
    },
    boolean: {
        trueValues: ["true", "yes", "1", "y"],
        falseValues: ["false", "no", "0", "n"],
        caseSensitive: false,
    },
    email: {
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        allowedDomains: [],
    },
    phone: {
        pattern: "^[\\d\\+\\-$$$$ ]{7,20}$",
        format: "(###) ###-####",
        allowInternational: true,
    },
}

export const defaultImporterConfig: ImporterConfig = {
    columns: [],
    acceptedFormats: [".xlsx", ".xls", ".csv"],
    invalidColumnHandling: "warn",
    dataTypeConfig: defaultDataTypeConfig,
}

export function createDefaultColumnConfig(name: string) {
    return {
        name,
        displayName: name,
        required: false,
        type: "string" as const,
        description: "",
        validationRules: [],
        format: null,
        invalidHandling: "flag" as const,
    }
}

