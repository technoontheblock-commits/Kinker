'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Kritischer Fehler</h2>
          <p className="text-neutral-400 mb-6">
            Die Anwendung konnte nicht geladen werden. Bitte lade die Seite neu.
          </p>
          <button
            onClick={reset}
            className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors"
          >
            Seite neu laden
          </button>
        </div>
      </body>
    </html>
  )
}
