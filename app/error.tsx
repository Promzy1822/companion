'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">😵</div>
        <h2 className="text-2xl font-bold mb-3">Something went wrong</h2>
        <p className="text-zinc-400 mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={() => reset()}
          className="bg-orange-600 hover:bg-orange-700 px-8 py-3 rounded-full font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
