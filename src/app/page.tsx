import { SimpleExcelImporter } from "@/components/simple-excel-importer"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Excel Import & Export System</h1>

      <SimpleExcelImporter
        requiredColumns={["Name", "Email", "Department"]}
        optionalColumns={["Phone", "Address", "StartDate", "Salary"]}
        acceptedFormats={[".xlsx", ".csv"]}
        title="Employee Data Import"
      />
    </main>
  )
}

