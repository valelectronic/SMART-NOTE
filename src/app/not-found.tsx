'use client';
import { useRouter } from 'next/navigation';
import { Frown } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  return (
    <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[70vh] text-center">
      <Frown size={64} className="text-amber-600 mb-4" />
      <h1 className="text-4xl font-bold text-gray-800 mb-2">Oops!</h1>
      <p className="text-lg text-gray-600 mb-6 font-bold">
        Looks like this page is still learning how to teach.
      </p>
      <button
        onClick={() => router.push('/')}
        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-xl transition"
      >
        Head back home
      </button>
    </main>
  );
}