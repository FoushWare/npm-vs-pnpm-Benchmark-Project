export default function Dashboard() {
  return (
    <main className="flex min-h-screen flex-col p-24">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-medium mb-2">Total Users</h2>
          <p className="text-3xl font-bold">1,234</p>
        </div>
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-medium mb-2">Active Sessions</h2>
          <p className="text-3xl font-bold">567</p>
        </div>
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-medium mb-2">Revenue</h2>
          <p className="text-3xl font-bold">$12,345</p>
        </div>
      </div>
    </main>
  )
}