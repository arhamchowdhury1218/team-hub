"use client"; // This tells Next.js this is a Client Component (runs in the browser)
// We need this because we use useState, event handlers, and Zustand

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  // Local state for the form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Pull what we need from our Zustand store
  // These will re-render the component whenever they change
  const { login, isLoading, error, clearError, user } = useAuthStore();

  // Next.js router — used to redirect after login
  const router = useRouter();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Called when the form is submitted
  const handleSubmit = async (e) => {
    // Prevent the browser's default form submission (which would reload the page)
    e.preventDefault();
    clearError(); // clear any previous error

    // Call the login action from our Zustand store
    const success = await login(email, password);

    // If login succeeded, redirect to dashboard
    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    // Full screen centered layout
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-2">Sign in to your Team Hub account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Error message — only shows when there's an error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           transition"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           transition"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700
                         disabled:bg-indigo-400 disabled:cursor-not-allowed
                         text-white font-medium rounded-lg text-sm
                         transition duration-150"
            >
              {/* Show different text while loading */}
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Link to register */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-indigo-600 hover:underline font-medium"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
