"use client"

import { useState } from "react"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material"

// Update the interface to include initialEndpoint
interface ApiSubmissionDialogProps {
    data: any[]
    onClose: () => void
    initialEndpoint?: string
}

// Update the function signature to include initialEndpoint
export function ApiSubmissionDialog({ data, onClose, initialEndpoint = "" }: ApiSubmissionDialogProps) {
    // Update the useState to use initialEndpoint
    const [apiEndpoint, setApiEndpoint] = useState<string>(initialEndpoint)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorData = await response.json()
                setError(`Submission failed: ${response.status} - ${errorData.message || "Unknown error"}`)
            } else {
                onClose() // Close the dialog on successful submission
            }
        } catch (e: any) {
            setError(`Submission failed: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open onClose={onClose}>
            <DialogTitle>Submit Data to API</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    id="api-endpoint"
                    label="API Endpoint"
                    type="url"
                    fullWidth
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    error={!!error}
                    helperText={error}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Submitting..." : "Submit"}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

