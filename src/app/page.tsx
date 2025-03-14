import { SimpleExcelImporter } from "@/components/simple-excel-importer"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Excel Import & Export System</h1>

      <SimpleExcelImporter
        requiredColumns={["Name", "Email", "Department"]}
        optionalColumns={["Phone", "Address", "StartDate", "Salary"]}
        acceptedFormats={[".xlsx", ".csv"]}
        strictSchema={true}
        title="Employee Data Import with API Submission"
        apiEndpoint="https://api.example.com/employees"
      />

      <div className="mt-8 p-4 bg-muted rounded-md">
        <h2 className="text-xl font-semibold mb-2">API Submission</h2>
        <p className="mb-2">This system now supports sending validated data to an API endpoint in JSON format.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Configure HTTP method (POST, PUT, PATCH)</li>
          <li>Add custom HTTP headers</li>
          <li>Select which fields to include in the submission</li>
          <li>Preview the data before sending</li>
          <li>View API response details</li>
        </ul>
      </div>
    </main>
  )
}

