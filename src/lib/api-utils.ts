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

