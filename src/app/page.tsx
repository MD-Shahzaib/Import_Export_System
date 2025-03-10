import { ExcelImportExport } from "@/components/excel-import-export"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Excel Import & Export System</h1>
      <ExcelImportExport />
    </main>
  )
}

