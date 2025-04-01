import { useFailedSubmissionsStore } from "@/components/failed-submissions-store"
import { validateFile as enhancedValidateFile } from "@/lib/enhanced-validation-utils"

/**
 * Submits data to an API endpoint
 */
export async function submitDataToApi(
    data: any[],
    endpoint: string,
    options: {
        method?: string
        headers?: Record<string, string>
        onProgress?: (progress: number) => void
        trackFailures?: boolean
    } = {},
): Promise<{ success: boolean; message: string; response?: any }> {
    const {
        method = "POST",
        headers = {
            "Content-Type": "application/json",
        },
        onProgress,
        trackFailures = true,
    } = options

    try {
        // Simulate progress for better UX
        if (onProgress) {
            onProgress(10)
            await new Promise((resolve) => setTimeout(resolve, 300))
            onProgress(30)
        }

        const response = await fetch(endpoint, {
            method,
            headers,
            body: JSON.stringify(data),
        })

        if (onProgress) {
            onProgress(70)
            await new Promise((resolve) => setTimeout(resolve, 200))
            onProgress(90)
        }

        const responseData = await response.json()

        if (onProgress) {
            onProgress(100)
        }

        if (!response.ok) {
            const errorResult = {
                success: false,
                message: responseData.message || `Error: ${response.status} ${response.statusText}`,
                response: responseData,
            }

            // Track the failed submission if enabled
            if (trackFailures) {
                useFailedSubmissionsStore.getState().addFailedSubmission({
                    data,
                    file: null,
                    endpoint,
                    method,
                    headers,
                    error: {
                        message: errorResult.message,
                        details: `Status: ${response.status} ${response.statusText}`,
                        response: responseData,
                    },
                    submissionType: "json",
                    retryCount: 0,
                })
            }

            return errorResult
        }

        return {
            success: true,
            message: "Data submitted successfully",
            response: responseData,
        }
    } catch (error) {
        console.error("API submission error:", error)

        const errorResult = {
            success: false,
            message: error instanceof Error ? error.message : "Unknown error occurred",
        }

        // Track the failed submission if enabled
        if (trackFailures) {
            useFailedSubmissionsStore.getState().addFailedSubmission({
                data,
                file: null,
                endpoint,
                method,
                headers,
                error: {
                    message: errorResult.message,
                    details: error instanceof Error ? error.stack : "No details available",
                },
                submissionType: "json",
                retryCount: 0,
            })
        }

        return errorResult
    }
}

/**
 * Submits a file to an API endpoint
 */
export async function submitFileToApi(
    file: File,
    endpoint: string,
    options: {
        method?: string
        headers?: Record<string, string>
        additionalData?: Record<string, any>
        fieldName?: string
        onProgress?: (progress: number) => void
        trackFailures?: boolean
    } = {},
): Promise<{ success: boolean; message: string; response?: any }> {
    const {
        method = "POST",
        headers = {},
        additionalData = {},
        fieldName = "file",
        onProgress,
        trackFailures = true,
    } = options

    try {
        // Create FormData
        const formData = new FormData()
        formData.append(fieldName, file)

        // Add any additional data
        Object.entries(additionalData).forEach(([key, value]) => {
            if (typeof value === "object" && value !== null) {
                formData.append(key, JSON.stringify(value))
            } else {
                formData.append(key, String(value))
            }
        })

        // Simulate progress for better UX
        if (onProgress) {
            onProgress(10)
            await new Promise((resolve) => setTimeout(resolve, 300))
            onProgress(30)
        }

        // Don't include Content-Type header as it will be set automatically with the boundary
        const requestHeaders: Record<string, string> = { ...headers }
        delete requestHeaders["Content-Type"]

        const response = await fetch(endpoint, {
            method,
            headers: requestHeaders,
            body: formData,
        })

        if (onProgress) {
            onProgress(70)
            await new Promise((resolve) => setTimeout(resolve, 200))
            onProgress(90)
        }

        let responseData
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
            responseData = await response.json()
        } else {
            responseData = await response.text()
        }

        if (onProgress) {
            onProgress(100)
        }

        if (!response.ok) {
            const errorResult = {
                success: false,
                message:
                    typeof responseData === "object" && responseData.message
                        ? responseData.message
                        : `Error: ${response.status} ${response.statusText}`,
                response: responseData,
            }

            // Track the failed submission if enabled
            if (trackFailures) {
                useFailedSubmissionsStore.getState().addFailedSubmission({
                    data: null,
                    file: {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                    },
                    endpoint,
                    method,
                    headers: requestHeaders,
                    error: {
                        message: errorResult.message,
                        details: `Status: ${response.status} ${response.statusText}`,
                        response: responseData,
                    },
                    submissionType: "file",
                    retryCount: 0,
                })
            }

            return errorResult
        }

        return {
            success: true,
            message: "File submitted successfully",
            response: responseData,
        }
    } catch (error) {
        console.error("File submission error:", error)

        const errorResult = {
            success: false,
            message: error instanceof Error ? error.message : "Unknown error occurred",
        }

        // Track the failed submission if enabled
        if (trackFailures) {
            useFailedSubmissionsStore.getState().addFailedSubmission({
                data: null,
                file: {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                },
                endpoint,
                method,
                headers,
                error: {
                    message: errorResult.message,
                    details: error instanceof Error ? error.stack : "No details available",
                },
                submissionType: "file",
                retryCount: 0,
            })
        }

        return errorResult
    }
}

interface FileValidationOptions {
    maxSizeMB: number
    acceptedFormats: string[]
}

interface FileValidationResult {
    valid: boolean
    message?: string
}

/**
 * Validates a file before submission
 */
export function validateFile(file: File, options: FileValidationOptions): FileValidationResult {
    const { maxSizeMB, acceptedFormats } = options

    if (!file) {
        return {
            valid: false,
            message: "No file selected",
        }
    }

    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
        return {
            valid: false,
            message: `File size exceeds the maximum limit of ${maxSizeMB}MB`,
        }
    }

    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
    if (!acceptedFormats.includes(fileExtension)) {
        return {
            valid: false,
            message: `Invalid file format. Accepted formats: ${acceptedFormats.join(", ")}`,
        }
    }

    return { valid: true }
}

export { enhancedValidateFile }