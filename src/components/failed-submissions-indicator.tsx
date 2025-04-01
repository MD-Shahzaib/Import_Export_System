"use client"

import { useEffect, useState } from "react"
import { useFailedSubmissionsStore } from "./failed-submissions-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"
import { FailedSubmissionsDialog } from "./failed-submissions-dialog"

export function FailedSubmissionsIndicator() {
    const { submissions } = useFailedSubmissionsStore()
    const [showDialog, setShowDialog] = useState(false)
    const [isNew, setIsNew] = useState(false)
    const [prevCount, setPrevCount] = useState(submissions.length)

    useEffect(() => {
        // Check if there are new failed submissions
        if (submissions.length > prevCount) {
            setIsNew(true)

            // Reset the new indicator after 5 seconds
            const timer = setTimeout(() => {
                setIsNew(false)
            }, 5000)

            return () => clearTimeout(timer)
        }

        setPrevCount(submissions.length)
    }, [submissions.length, prevCount])

    if (submissions.length === 0) {
        return null
    }

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className={`relative ${isNew ? "animate-pulse" : ""}`}
                onClick={() => setShowDialog(true)}
            >
                <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
                Failed Submissions
                <Badge variant="destructive" className="ml-2 text-xs">
                    {submissions.length}
                </Badge>
            </Button>

            <FailedSubmissionsDialog open={showDialog} onOpenChange={setShowDialog} />
        </>
    )
}