import Link from 'next/link';

export default function NoPermissionsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
      <p className="text-lg mb-6">You do not have the necessary permissions to access this page.</p>
      <Link href="/" className="text-blue-600 hover:underline">
        Go back to Home
      </Link>
    </div>
  );
} 