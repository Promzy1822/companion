'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Critical Error</h2>
            <p className="mb-6 text-zinc-400">{error.message}</p>
            <button
              onClick={() => reset()}
              className="bg-orange-600 px-6 py-3 rounded-xl"
            >
              Reload App
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
