"use client"
import { SimpleExcelImporter } from "@/components/simple-excel-importer"
import { FailedSubmissionsIndicator } from "@/components/failed-submissions-indicator"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Excel Import & Export System</h1>
        <FailedSubmissionsIndicator />
      </div>

      <SimpleExcelImporter
        requiredColumns={[
          "payment_type",
          "customer_type",
          "extraChg",
          "booking_status",
          "booking_date",
          "booking_time",
          "customer_name",
          "customer_phone",
          "pickup_address",
          "drop_address",
          "vehicle_type",
          "is_paid",
        ]}
        optionalColumns={[
          "customer_email",
          "note",
          "waypoints",
        ]}
        acceptedFormats={[".xlsx", ".csv"]}
        strictSchema={true}
        title="Upload your bookings file, preview the data for verification, and import it into the system."
        apiEndpoint="http://localhost:3333/api/v1/booking/upload"
      />

      <div className="mt-8 p-4 bg-muted rounded-md">
        <h2 className="text-xl font-semibold mb-2">Enhanced API Submission</h2>
        <p className="mb-2">This system now supports sending data to an API endpoint in two formats:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-2">JSON Data Submission</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Send processed data as JSON</li>
              <li>Select specific fields to include</li>
              <li>Configure HTTP headers</li>
              <li>Choose HTTP method (POST, PUT, PATCH)</li>
              <li>Preview data before sending</li>
            </ul>
          </div>

          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-2">File Upload Submission</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Send the original file or upload a new one</li>
              <li>Add additional form data fields</li>
              <li>Customize the file field name</li>
              <li>Support for multipart/form-data</li>
              <li>File validation for size and format</li>
            </ul>
          </div>
        </div>

        <h3 className="text-lg font-medium mt-6 mb-2">API Integration Guide</h3>
        <p className="mb-2">To integrate with your backend API:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <strong>For JSON data:</strong> Ensure your API can accept JSON payloads. The data will be sent as an array
            of objects.
          </li>
          <li>
            <strong>For file uploads:</strong> Configure your API to handle multipart/form-data with file uploads. The
            file will be sent in the field specified (default: "file").
          </li>
          <li>
            <strong>Response format:</strong> Your API should return JSON responses with at least a "success" boolean
            and "message" string.
          </li>
          <li>
            <strong>Error handling:</strong> Return appropriate HTTP status codes and error messages for validation
            failures or server errors.
          </li>
        </ol>
      </div>
    </main>
  )
}