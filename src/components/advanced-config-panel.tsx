"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { PlusCircle, Save, Trash2, Settings2 } from "lucide-react"
import type { ColumnConfig, ValidationRule, ImporterConfig, DataTypeConfig, InvalidDataHandling } from "@/lib/types"

interface AdvancedConfigPanelProps {
    config: ImporterConfig
    onSave: (config: ImporterConfig) => void
    onCancel: () => void
}

export function AdvancedConfigPanel({ config, onSave, onCancel }: AdvancedConfigPanelProps) {
    const [currentConfig, setCurrentConfig] = useState<ImporterConfig>({ ...config })
    const [activeTab, setActiveTab] = useState("columns")
    const [editingColumn, setEditingColumn] = useState<ColumnConfig | null>(null)
    const [editingIndex, setEditingIndex] = useState<number>(-1)

    // Handle column configuration changes
    const handleColumnChange = (index: number, field: keyof ColumnConfig, value: any) => {
        const updatedColumns = [...currentConfig.columns]
        updatedColumns[index] = {
            ...updatedColumns[index],
            [field]: value,
        }
        setCurrentConfig({
            ...currentConfig,
            columns: updatedColumns,
        })
    }

    // Handle adding a new validation rule to a column
    const handleAddValidationRule = (columnIndex: number) => {
        const updatedColumns = [...currentConfig.columns]
        updatedColumns[columnIndex].validationRules.push({
            type: "custom",
            message: "Invalid value",
            value: "",
        })
        setCurrentConfig({
            ...currentConfig,
            columns: updatedColumns,
        })
    }

    // Handle updating a validation rule
    const handleUpdateValidationRule = (
        columnIndex: number,
        ruleIndex: number,
        field: keyof ValidationRule,
        value: any,
    ) => {
        const updatedColumns = [...currentConfig.columns]
        updatedColumns[columnIndex].validationRules[ruleIndex] = {
            ...updatedColumns[columnIndex].validationRules[ruleIndex],
            [field]: value,
        }
        setCurrentConfig({
            ...currentConfig,
            columns: updatedColumns,
        })
    }

    // Handle removing a validation rule
    const handleRemoveValidationRule = (columnIndex: number, ruleIndex: number) => {
        const updatedColumns = [...currentConfig.columns]
        updatedColumns[columnIndex].validationRules.splice(ruleIndex, 1)
        setCurrentConfig({
            ...currentConfig,
            columns: updatedColumns,
        })
    }

    // Handle adding a new column
    const handleAddColumn = () => {
        const newColumn: ColumnConfig = {
            name: `Column ${currentConfig.columns.length + 1}`,
            displayName: `Column ${currentConfig.columns.length + 1}`,
            required: false,
            type: "string",
            description: "",
            validationRules: [],
            format: null,
            invalidHandling: "flag",
        }

        setCurrentConfig({
            ...currentConfig,
            columns: [...currentConfig.columns, newColumn],
        })

        // Set this as the editing column
        setEditingColumn(newColumn)
        setEditingIndex(currentConfig.columns.length)
    }

    // Handle removing a column
    const handleRemoveColumn = (index: number) => {
        const updatedColumns = [...currentConfig.columns]
        updatedColumns.splice(index, 1)
        setCurrentConfig({
            ...currentConfig,
            columns: updatedColumns,
        })

        // Clear editing if this was the column being edited
        if (editingIndex === index) {
            setEditingColumn(null)
            setEditingIndex(-1)
        }
    }

    // Handle editing a column
    const handleEditColumn = (column: ColumnConfig, index: number) => {
        setEditingColumn({ ...column })
        setEditingIndex(index)
    }

    // Handle saving column edits
    const handleSaveColumnEdit = () => {
        if (editingColumn && editingIndex >= 0) {
            const updatedColumns = [...currentConfig.columns]
            updatedColumns[editingIndex] = editingColumn
            setCurrentConfig({
                ...currentConfig,
                columns: updatedColumns,
            })
            setEditingColumn(null)
            setEditingIndex(-1)
        }
    }

    // Handle canceling column edits
    const handleCancelColumnEdit = () => {
        setEditingColumn(null)
        setEditingIndex(-1)
    }

    // Handle updating file format settings
    const handleFileFormatChange = (format: string, checked: boolean) => {
        const updatedFormats = checked
            ? [...currentConfig.acceptedFormats, format]
            : currentConfig.acceptedFormats.filter((f) => f !== format)

        setCurrentConfig({
            ...currentConfig,
            acceptedFormats: updatedFormats,
        })
    }

    // Handle updating invalid column handling
    const handleInvalidColumnChange = (value: string) => {
        setCurrentConfig({
            ...currentConfig,
            invalidColumnHandling: value as InvalidDataHandling,
        })
    }

    // Handle updating data type configuration
    const handleDataTypeConfigChange = (type: string, field: keyof DataTypeConfig, value: any) => {
        setCurrentConfig({
            ...currentConfig,
            dataTypeConfig: {
                ...currentConfig.dataTypeConfig,
                [type]: {
                    ...currentConfig.dataTypeConfig[type as keyof typeof currentConfig.dataTypeConfig],
                    [field]: value,
                },
            },
        })
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Settings2 className="mr-2 h-5 w-5" />
                    Advanced Import Configuration
                </CardTitle>
                <CardDescription>Configure file requirements, column validation, and data handling options</CardDescription>
            </CardHeader>

            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="columns">Columns</TabsTrigger>
                        <TabsTrigger value="formats">File Formats</TabsTrigger>
                        <TabsTrigger value="validation">Data Validation</TabsTrigger>
                    </TabsList>

                    {/* Columns Configuration */}
                    <TabsContent value="columns" className="space-y-4 py-4">
                        {editingColumn ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium">Edit Column</h3>
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" onClick={handleCancelColumnEdit}>
                                            Cancel
                                        </Button>
                                        <Button size="sm" onClick={handleSaveColumnEdit}>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="column-name">Column Name</Label>
                                            <Input
                                                id="column-name"
                                                value={editingColumn.name}
                                                onChange={(e) => setEditingColumn({ ...editingColumn, name: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">The exact name of the column in the Excel file</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="column-display-name">Display Name</Label>
                                            <Input
                                                id="column-display-name"
                                                value={editingColumn.displayName}
                                                onChange={(e) => setEditingColumn({ ...editingColumn, displayName: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">How the column should be displayed in the UI</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="column-description">Description</Label>
                                        <Input
                                            id="column-description"
                                            value={editingColumn.description || ""}
                                            onChange={(e) => setEditingColumn({ ...editingColumn, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="column-type">Data Type</Label>
                                            <Select
                                                value={editingColumn.type}
                                                onValueChange={(value) => setEditingColumn({ ...editingColumn, type: value })}
                                            >
                                                <SelectTrigger id="column-type">
                                                    <SelectValue placeholder="Select data type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="string">Text</SelectItem>
                                                    <SelectItem value="number">Number</SelectItem>
                                                    <SelectItem value="date">Date</SelectItem>
                                                    <SelectItem value="boolean">Boolean</SelectItem>
                                                    <SelectItem value="email">Email</SelectItem>
                                                    <SelectItem value="phone">Phone</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="invalid-handling">Invalid Data Handling</Label>
                                            <Select
                                                value={editingColumn.invalidHandling}
                                                onValueChange={(value) =>
                                                    setEditingColumn({
                                                        ...editingColumn,
                                                        invalidHandling: value as InvalidDataHandling,
                                                    })
                                                }
                                            >
                                                <SelectTrigger id="invalid-handling">
                                                    <SelectValue placeholder="Select handling" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="flag">Flag for Review</SelectItem>
                                                    <SelectItem value="remove">Remove Value</SelectItem>
                                                    <SelectItem value="default">Use Default Value</SelectItem>
                                                    <SelectItem value="reject">Reject Import</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="column-required"
                                            checked={editingColumn.required}
                                            onCheckedChange={(checked) => setEditingColumn({ ...editingColumn, required: checked })}
                                        />
                                        <Label htmlFor="column-required">Required Field</Label>
                                    </div>

                                    {editingColumn.invalidHandling === "default" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="default-value">Default Value</Label>
                                            <Input
                                                id="default-value"
                                                value={editingColumn.defaultValue || ""}
                                                onChange={(e) => setEditingColumn({ ...editingColumn, defaultValue: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="column-format">Format Pattern</Label>
                                        <Input
                                            id="column-format"
                                            value={editingColumn.format || ""}
                                            onChange={(e) => setEditingColumn({ ...editingColumn, format: e.target.value })}
                                            placeholder={getFormatPlaceholder(editingColumn.type)}
                                        />
                                        <p className="text-xs text-muted-foreground">{getFormatDescription(editingColumn.type)}</p>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Validation Rules</Label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const rules = [...editingColumn.validationRules]
                                                    rules.push({
                                                        type: "custom",
                                                        message: "Invalid value",
                                                        value: "",
                                                    })
                                                    setEditingColumn({ ...editingColumn, validationRules: rules })
                                                }}
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Add Rule
                                            </Button>
                                        </div>

                                        {editingColumn.validationRules.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No validation rules defined</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {editingColumn.validationRules.map((rule, ruleIndex) => (
                                                    <Card key={ruleIndex}>
                                                        <CardContent className="p-4">
                                                            <div className="grid gap-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Label>Rule Type</Label>
                                                                        <Select
                                                                            value={rule.type}
                                                                            onValueChange={(value) => {
                                                                                const rules = [...editingColumn.validationRules]
                                                                                rules[ruleIndex] = { ...rules[ruleIndex], type: value as any }
                                                                                setEditingColumn({ ...editingColumn, validationRules: rules })
                                                                            }}
                                                                        >
                                                                            <SelectTrigger className="w-[180px]">
                                                                                <SelectValue placeholder="Select rule type" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {getValidationRuleTypes(editingColumn.type).map((type) => (
                                                                                    <SelectItem key={type.value} value={type.value}>
                                                                                        {type.label}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => {
                                                                            const rules = [...editingColumn.validationRules]
                                                                            rules.splice(ruleIndex, 1)
                                                                            setEditingColumn({ ...editingColumn, validationRules: rules })
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>

                                                                {rule.type !== "custom" && (
                                                                    <div className="space-y-2">
                                                                        <Label>Value</Label>
                                                                        <Input
                                                                            value={rule.value || ""}
                                                                            onChange={(e) => {
                                                                                const rules = [...editingColumn.validationRules]
                                                                                rules[ruleIndex] = { ...rules[ruleIndex], value: e.target.value }
                                                                                setEditingColumn({ ...editingColumn, validationRules: rules })
                                                                            }}
                                                                            placeholder={getValidationPlaceholder(rule.type)}
                                                                        />
                                                                    </div>
                                                                )}

                                                                <div className="space-y-2">
                                                                    <Label>Error Message</Label>
                                                                    <Input
                                                                        value={rule.message}
                                                                        onChange={(e) => {
                                                                            const rules = [...editingColumn.validationRules]
                                                                            rules[ruleIndex] = { ...rules[ruleIndex], message: e.target.value }
                                                                            setEditingColumn({ ...editingColumn, validationRules: rules })
                                                                        }}
                                                                        placeholder="Error message to display"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium">Column Configuration</h3>
                                    <Button onClick={handleAddColumn}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Column
                                    </Button>
                                </div>

                                <ScrollArea className="h-[400px] rounded-md border">
                                    <div className="p-4 space-y-4">
                                        {currentConfig.columns.map((column, index) => (
                                            <Card key={index} className="overflow-hidden">
                                                <div className="flex items-center justify-between p-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2">
                                                            <h4 className="font-medium">{column.displayName || column.name}</h4>
                                                            {column.required ? (
                                                                <Badge variant="default">Required</Badge>
                                                            ) : (
                                                                <Badge variant="outline">Optional</Badge>
                                                            )}
                                                            <Badge variant="secondary">{getDataTypeLabel(column.type)}</Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {column.description || `Column name: ${column.name}`}
                                                        </p>
                                                    </div>

                                                    <div className="flex space-x-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleEditColumn(column, index)}>
                                                            Edit
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveColumn(index)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}

                                        {currentConfig.columns.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <p className="text-muted-foreground">No columns configured</p>
                                                <Button variant="outline" className="mt-4" onClick={handleAddColumn}>
                                                    <PlusCircle className="mr-2 h-4 w-4" />
                                                    Add Your First Column
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </>
                        )}
                    </TabsContent>

                    {/* File Formats Configuration */}
                    <TabsContent value="formats" className="space-y-4 py-4">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-medium">Accepted File Formats</h3>
                                <p className="text-sm text-muted-foreground">Select which file formats can be imported</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Card className="p-4">
                                    <div className="flex items-start space-x-2">
                                        <Checkbox
                                            id="format-xlsx"
                                            checked={currentConfig.acceptedFormats.includes(".xlsx")}
                                            onCheckedChange={(checked) => handleFileFormatChange(".xlsx", checked as boolean)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="format-xlsx" className="font-medium">
                                                Excel (.xlsx)
                                            </Label>
                                            <p className="text-sm text-muted-foreground">Modern Excel format (Excel 2007+)</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4">
                                    <div className="flex items-start space-x-2">
                                        <Checkbox
                                            id="format-xls"
                                            checked={currentConfig.acceptedFormats.includes(".xls")}
                                            onCheckedChange={(checked) => handleFileFormatChange(".xls", checked as boolean)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="format-xls" className="font-medium">
                                                Excel 97-2003 (.xls)
                                            </Label>
                                            <p className="text-sm text-muted-foreground">Legacy Excel format</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4">
                                    <div className="flex items-start space-x-2">
                                        <Checkbox
                                            id="format-csv"
                                            checked={currentConfig.acceptedFormats.includes(".csv")}
                                            onCheckedChange={(checked) => handleFileFormatChange(".csv", checked as boolean)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="format-csv" className="font-medium">
                                                CSV (.csv)
                                            </Label>
                                            <p className="text-sm text-muted-foreground">Comma-separated values</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4">
                                    <div className="flex items-start space-x-2">
                                        <Checkbox
                                            id="format-txt"
                                            checked={currentConfig.acceptedFormats.includes(".txt")}
                                            onCheckedChange={(checked) => handleFileFormatChange(".txt", checked as boolean)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="format-txt" className="font-medium">
                                                Text (.txt)
                                            </Label>
                                            <p className="text-sm text-muted-foreground">Tab or comma delimited text files</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium">Invalid Column Handling</h3>
                                    <p className="text-sm text-muted-foreground">
                                        How to handle columns in the file that don't match your configuration
                                    </p>
                                </div>

                                <Select value={currentConfig.invalidColumnHandling} onValueChange={handleInvalidColumnChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select handling method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ignore">Ignore unrecognized columns</SelectItem>
                                        <SelectItem value="warn">Warn but continue import</SelectItem>
                                        <SelectItem value="reject">Reject file with unrecognized columns</SelectItem>
                                        <SelectItem value="include">Include all columns in import</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Data Validation Configuration */}
                    <TabsContent value="validation" className="space-y-4 py-4">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-medium">Data Type Validation</h3>
                                <p className="text-sm text-muted-foreground">Configure validation rules for each data type</p>
                            </div>

                            <Tabs defaultValue="string">
                                <TabsList className="grid w-full grid-cols-6">
                                    <TabsTrigger value="string">Text</TabsTrigger>
                                    <TabsTrigger value="number">Number</TabsTrigger>
                                    <TabsTrigger value="date">Date</TabsTrigger>
                                    <TabsTrigger value="boolean">Boolean</TabsTrigger>
                                    <TabsTrigger value="email">Email</TabsTrigger>
                                    <TabsTrigger value="phone">Phone</TabsTrigger>
                                </TabsList>

                                <TabsContent value="string" className="space-y-4 py-4">
                                    <Card className="p-4">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="string-min-length">Minimum Length</Label>
                                                    <Input
                                                        id="string-min-length"
                                                        type="number"
                                                        min="0"
                                                        value={currentConfig.dataTypeConfig.string.minLength.toString()}
                                                        onChange={(e) =>
                                                            handleDataTypeConfigChange("string", "minLength", Number.parseInt(e.target.value) || 0)
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="string-max-length">Maximum Length</Label>
                                                    <Input
                                                        id="string-max-length"
                                                        type="number"
                                                        min="0"
                                                        value={currentConfig.dataTypeConfig.string.maxLength.toString()}
                                                        onChange={(e) =>
                                                            handleDataTypeConfigChange("string", "maxLength", Number.parseInt(e.target.value) || 0)
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="string-format">Default Format Pattern</Label>
                                                <Input
                                                    id="string-format"
                                                    value={currentConfig.dataTypeConfig.string.format || ""}
                                                    onChange={(e) => handleDataTypeConfigChange("string", "format", e.target.value)}
                                                    placeholder="Regular expression pattern"
                                                />
                                                <p className="text-xs text-muted-foreground">Regular expression pattern for text validation</p>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="string-trim"
                                                    checked={currentConfig.dataTypeConfig.string.trim}
                                                    onCheckedChange={(checked) => handleDataTypeConfigChange("string", "trim", checked)}
                                                />
                                                <Label htmlFor="string-trim">Trim whitespace</Label>
                                            </div>
                                        </div>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="number" className="space-y-4 py-4">
                                    <Card className="p-4">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="number-min">Minimum Value</Label>
                                                    <Input
                                                        id="number-min"
                                                        type="number"
                                                        value={currentConfig.dataTypeConfig.number.min?.toString() || ""}
                                                        onChange={(e) =>
                                                            handleDataTypeConfigChange(
                                                                "number",
                                                                "min",
                                                                e.target.value ? Number.parseFloat(e.target.value) : null,
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="number-max">Maximum Value</Label>
                                                    <Input
                                                        id="number-max"
                                                        type="number"
                                                        value={currentConfig.dataTypeConfig.number.max?.toString() || ""}
                                                        onChange={(e) =>
                                                            handleDataTypeConfigChange(
                                                                "number",
                                                                "max",
                                                                e.target.value ? Number.parseFloat(e.target.value) : null,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="number-precision">Decimal Precision</Label>
                                                <Input
                                                    id="number-precision"
                                                    type="number"
                                                    min="0"
                                                    value={currentConfig.dataTypeConfig.number.precision.toString()}
                                                    onChange={(e) =>
                                                        handleDataTypeConfigChange("number", "precision", Number.parseInt(e.target.value) || 0)
                                                    }
                                                />
                                                <p className="text-xs text-muted-foreground">Number of decimal places to allow</p>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="number-integer-only"
                                                    checked={currentConfig.dataTypeConfig.number.integerOnly}
                                                    onCheckedChange={(checked) => handleDataTypeConfigChange("number", "integerOnly", checked)}
                                                />
                                                <Label htmlFor="number-integer-only">Integer values only</Label>
                                            </div>
                                        </div>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="date" className="space-y-4 py-4">
                                    <Card className="p-4">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="date-min">Minimum Date</Label>
                                                    <Input
                                                        id="date-min"
                                                        type="date"
                                                        value={currentConfig.dataTypeConfig.date.min || ""}
                                                        onChange={(e) => handleDataTypeConfigChange("date", "min", e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="date-max">Maximum Date</Label>
                                                    <Input
                                                        id="date-max"
                                                        type="date"
                                                        value={currentConfig.dataTypeConfig.date.max || ""}
                                                        onChange={(e) => handleDataTypeConfigChange("date", "max", e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="date-format">Date Format</Label>
                                                <Input
                                                    id="date-format"
                                                    value={currentConfig.dataTypeConfig.date.format || ""}
                                                    onChange={(e) => handleDataTypeConfigChange("date", "format", e.target.value)}
                                                    placeholder="YYYY-MM-DD"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Format pattern for date validation (e.g., YYYY-MM-DD, MM/DD/YYYY)
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="boolean" className="space-y-4 py-4">
                                    <Card className="p-4">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Accepted True Values</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {["true", "yes", "1", "y"].map((value) => (
                                                        <div key={value} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`bool-true-${value}`}
                                                                checked={currentConfig.dataTypeConfig.boolean.trueValues.includes(value)}
                                                                onCheckedChange={(checked) => {
                                                                    const newValues = checked
                                                                        ? [...currentConfig.dataTypeConfig.boolean.trueValues, value]
                                                                        : currentConfig.dataTypeConfig.boolean.trueValues.filter((v) => v !== value)

                                                                    handleDataTypeConfigChange("boolean", "trueValues", newValues)
                                                                }}
                                                            />
                                                            <Label htmlFor={`bool-true-${value}`}>{value}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Accepted False Values</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {["false", "no", "0", "n"].map((value) => (
                                                        <div key={value} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`bool-false-${value}`}
                                                                checked={currentConfig.dataTypeConfig.boolean.falseValues.includes(value)}
                                                                onCheckedChange={(checked) => {
                                                                    const newValues = checked
                                                                        ? [...currentConfig.dataTypeConfig.boolean.falseValues, value]
                                                                        : currentConfig.dataTypeConfig.boolean.falseValues.filter((v) => v !== value)

                                                                    handleDataTypeConfigChange("boolean", "falseValues", newValues)
                                                                }}
                                                            />
                                                            <Label htmlFor={`bool-false-${value}`}>{value}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="bool-case-sensitive">Case Sensitivity</Label>
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id="bool-case-sensitive"
                                                        checked={currentConfig.dataTypeConfig.boolean.caseSensitive}
                                                        onCheckedChange={(checked) =>
                                                            handleDataTypeConfigChange("boolean", "caseSensitive", checked)
                                                        }
                                                    />
                                                    <Label htmlFor="bool-case-sensitive">Case sensitive matching</Label>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="email" className="space-y-4 py-4">
                                    <Card className="p-4">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="email-pattern">Email Validation Pattern</Label>
                                                <Input
                                                    id="email-pattern"
                                                    value={currentConfig.dataTypeConfig.email.pattern || ""}
                                                    onChange={(e) => handleDataTypeConfigChange("email", "pattern", e.target.value)}
                                                    placeholder="Regular expression for email validation"
                                                />
                                                <p className="text-xs text-muted-foreground">Custom regular expression for email validation</p>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="email-allow-domains"
                                                    checked={currentConfig.dataTypeConfig.email.allowedDomains.length > 0}
                                                    onCheckedChange={(checked) => {
                                                        if (!checked) {
                                                            handleDataTypeConfigChange("email", "allowedDomains", [])
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor="email-allow-domains">Restrict to specific domains</Label>
                                            </div>

                                            {currentConfig.dataTypeConfig.email.allowedDomains.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="email-domains">Allowed Domains</Label>
                                                    <Input
                                                        id="email-domains"
                                                        value={currentConfig.dataTypeConfig.email.allowedDomains.join(", ")}
                                                        onChange={(e) =>
                                                            handleDataTypeConfigChange(
                                                                "email",
                                                                "allowedDomains",
                                                                e.target.value
                                                                    .split(",")
                                                                    .map((d) => d.trim())
                                                                    .filter(Boolean),
                                                            )
                                                        }
                                                        placeholder="example.com, company.org"
                                                    />
                                                    <p className="text-xs text-muted-foreground">Comma-separated list of allowed email domains</p>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="phone" className="space-y-4 py-4">
                                    <Card className="p-4">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="phone-pattern">Phone Validation Pattern</Label>
                                                <Input
                                                    id="phone-pattern"
                                                    value={currentConfig.dataTypeConfig.phone.pattern || ""}
                                                    onChange={(e) => handleDataTypeConfigChange("phone", "pattern", e.target.value)}
                                                    placeholder="Regular expression for phone validation"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Custom regular expression for phone number validation
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="phone-format">Display Format</Label>
                                                <Input
                                                    id="phone-format"
                                                    value={currentConfig.dataTypeConfig.phone.format || ""}
                                                    onChange={(e) => handleDataTypeConfigChange("phone", "format", e.target.value)}
                                                    placeholder="(###) ###-####"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Format for displaying phone numbers (use # as placeholder)
                                                </p>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="phone-international"
                                                    checked={currentConfig.dataTypeConfig.phone.allowInternational}
                                                    onCheckedChange={(checked) =>
                                                        handleDataTypeConfigChange("phone", "allowInternational", checked)
                                                    }
                                                />
                                                <Label htmlFor="phone-international">Allow international formats</Label>
                                            </div>
                                        </div>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button onClick={() => onSave(currentConfig)}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
                </Button>
            </CardFooter>
        </Card>
    )
}

// Helper functions
function getDataTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        string: "Text",
        number: "Number",
        date: "Date",
        boolean: "Boolean",
        email: "Email",
        phone: "Phone",
    }
    return labels[type] || type
}

function getFormatPlaceholder(type: string): string {
    switch (type) {
        case "string":
            return "Any text format"
        case "number":
            return "#,###.##"
        case "date":
            return "YYYY-MM-DD"
        case "email":
            return "user@example.com"
        case "phone":
            return "(###) ###-####"
        default:
            return ""
    }
}

function getFormatDescription(type: string): string {
    switch (type) {
        case "string":
            return "Format pattern or regular expression for text validation"
        case "number":
            return "Number format pattern (e.g., #,###.## for 1,234.56)"
        case "date":
            return "Date format pattern (e.g., YYYY-MM-DD, MM/DD/YYYY)"
        case "email":
            return "Email format validation pattern"
        case "phone":
            return "Phone number format (e.g., (###) ###-####)"
        case "boolean":
            return "Boolean representation format"
        default:
            return ""
    }
}

function getValidationRuleTypes(columnType: string): { value: string; label: string }[] {
    const commonRules = [
        { value: "required", label: "Required" },
        { value: "custom", label: "Custom" },
    ]

    switch (columnType) {
        case "string":
            return [
                ...commonRules,
                { value: "min", label: "Min Length" },
                { value: "max", label: "Max Length" },
                { value: "pattern", label: "Pattern Match" },
                { value: "enum", label: "Allowed Values" },
            ]
        case "number":
            return [
                ...commonRules,
                { value: "min", label: "Min Value" },
                { value: "max", label: "Max Value" },
                { value: "precision", label: "Decimal Precision" },
                { value: "range", label: "Value Range" },
            ]
        case "date":
            return [
                ...commonRules,
                { value: "min", label: "Min Date" },
                { value: "max", label: "Max Date" },
                { value: "range", label: "Date Range" },
            ]
        case "email":
            return [
                ...commonRules,
                { value: "pattern", label: "Pattern Match" },
                { value: "domain", label: "Domain Restriction" },
            ]
        case "phone":
            return [...commonRules, { value: "pattern", label: "Pattern Match" }, { value: "length", label: "Length Check" }]
        default:
            return commonRules
    }
}

function getValidationPlaceholder(ruleType: string): string {
    switch (ruleType) {
        case "min":
            return "Minimum value or length"
        case "max":
            return "Maximum value or length"
        case "pattern":
            return "Regular expression pattern"
        case "enum":
            return "Comma-separated list of allowed values"
        case "range":
            return "min-max (e.g., 1-100)"
        case "precision":
            return "Number of decimal places"
        case "domain":
            return "Comma-separated list of allowed domains"
        case "length":
            return "Exact length or min-max range"
        default:
            return ""
    }
}