"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Save } from "lucide-react"
import type { ColumnConfig } from "@/lib/types"

interface ColumnConfiguratorProps {
    columns: string[]
    initialConfig?: ColumnConfig[]
    onSave: (config: ColumnConfig[]) => void
    onCancel: () => void
}

export function ColumnConfigurator({ columns, initialConfig = [], onSave, onCancel }: ColumnConfiguratorProps) {
    // Initialize with existing config or default all columns to optional
    const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => {
        if (initialConfig.length > 0) {
            return initialConfig
        }

        return columns.map((column) => ({
            name: column,
            required: false,
            type: "string",
            validationRules: [],
        }))
    })

    const handleRequiredChange = (index: number, required: boolean) => {
        const newConfig = [...columnConfig]
        newConfig[index].required = required
        setColumnConfig(newConfig)
    }

    const handleSave = () => {
        onSave(columnConfig)
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Configure Data Fields</CardTitle>
                <CardDescription>Specify which fields are required and set validation rules</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                        {columnConfig.map((column, index) => (
                            <div key={index} className="flex items-center justify-between p-4 border rounded-md">
                                <div className="space-y-0.5">
                                    <div className="font-medium">{column.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {column.required ? (
                                            <Badge variant="default">Required</Badge>
                                        ) : (
                                            <Badge variant="outline">Optional</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id={`required-${index}`}
                                        checked={column.required}
                                        onCheckedChange={(checked) => handleRequiredChange(index, checked)}
                                    />
                                    <Label htmlFor={`required-${index}`}>Required</Label>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
                </Button>
            </CardFooter>
        </Card>
    )
}

