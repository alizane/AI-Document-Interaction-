import "./globals.css"

export const metadata = {
  title: "CompressAI - AI-Powered PDF Compression & Interaction",
  description: "Compress your PDFs and interact with them using our advanced AI technology.",
    generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
