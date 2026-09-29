import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Next.js Benchmark App</h1>
      <p className="text-lg text-gray-600 mb-8">
        A realistic Next.js application for benchmarking
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  )
}