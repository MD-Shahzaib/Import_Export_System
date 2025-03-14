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
    } = {},
): Promise<{ success: boolean; message: string; response?: any }> {
    const {
        method = "POST",
        headers = {
            "Content-Type": "application/json",
        },
        onProgress,
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
            return {
                success: false,
                message: responseData.message || `Error: ${response.status} ${response.statusText}`,
                response: responseData,
            }
        }

        return {
            success: true,
            message: "Data submitted successfully",
            response: responseData,
        }
    } catch (error) {
        console.error("API submission error:", error)
        return {
            success: false,
            message: error instanceof Error ? error.message : "Unknown error occurred",
        }
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
    } = {},
): Promise<{ success: boolean; message: string; response?: any }> {
    const { method = "POST", headers = {}, additionalData = {}, fieldName = "file", onProgress } = options

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
            return {
                success: false,
                message:
                    typeof responseData === "object" && responseData.message
                        ? responseData.message
                        : `Error: ${response.status} ${response.statusText}`,
                response: responseData,
            }
        }

        return {
            success: true,
            message: "File submitted successfully",
            response: responseData,
        }
    } catch (error) {
        console.error("File submission error:", error)
        return {
            success: false,
            message: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

/**
 * Validates file size and type
 */
export function validateFile(
    file: File,
    options: {
        maxSizeMB?: number
        acceptedFormats?: string[]
    } = {},
): { valid: boolean; message?: string } {
    const { maxSizeMB = 10, acceptedFormats = [] } = options

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024)
    if (fileSizeInMB > maxSizeMB) {
        return {
            valid: false,
            message: `File size exceeds the maximum allowed size of ${maxSizeMB}MB`,
        }
    }

    // Check file format if acceptedFormats is provided
    if (acceptedFormats.length > 0) {
        const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
        if (!acceptedFormats.includes(fileExtension)) {
            return {
                valid: false,
                message: `File format not supported. Accepted formats: ${acceptedFormats.join(", ")}`,
            }
        }
    }

    return { valid: true }
}

