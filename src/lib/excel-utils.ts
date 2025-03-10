import * as XLSX from "xlsx"

/**
 * Parse an Excel file and return the data as an array of objects
 */
export async function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })

        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[worksheetName]

        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: "A",
          defval: "",
          blankrows: false,
        })

        // If using header: 'A', the first row will be column letters
        // We need to convert this to use the first row as headers
        if (jsonData.length > 0) {
          const headers = jsonData[0]
          const result = jsonData.slice(1).map((row) => {
            const obj: Record<string, any> = {}
            Object.keys(row).forEach((key) => {
              obj[headers[key] || key] = row[key]
            })
            return obj
          })

          resolve(result)
        } else {
          resolve([])
        }
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsBinaryString(file)
  })
}

/**
 * Export data to an Excel file
 */
export function exportToExcel(data: any[], fileName: string): void {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new()

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
  } catch (error) {
    console.error("Error exporting to Excel:", error)
    throw error
  }
}

/**
 * Get column names from Excel column letters
 */
export function getColumnName(colIndex: number): string {
  let columnName = ""

  while (colIndex >= 0) {
    columnName = String.fromCharCode((colIndex % 26) + 65) + columnName
    colIndex = Math.floor(colIndex / 26) - 1
  }

  return columnName
}

/**
 * Format cell value based on its type
 */
export function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return ""
  }

  if (typeof value === "number") {
    // Format numbers with 2 decimal places if they have decimals
    return Number.isInteger(value) ? value.toString() : value.toFixed(2)
  }

  if (value instanceof Date) {
    return value.toLocaleDateString()
  }

  return String(value)
}

