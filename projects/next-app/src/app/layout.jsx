import './globals.css'

export const metadata = {
  title: 'Next.js Benchmark App',
  description: 'Next.js application for benchmarking',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}