import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-blue-700">404</h1>
        <p className="text-xl text-slate-700 mt-4">Page not found</p>
        <p className="text-slate-500 mt-2">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
