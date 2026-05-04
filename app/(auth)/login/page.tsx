'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { signIn } from '@/app/actions/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await signIn(email, password)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-amber-400 text-sm hover:text-amber-300">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold text-stone-100 mt-4">Welcome back</h1>
          <p className="text-stone-400 mt-2">Sign in to see your characters</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-700 rounded-xl p-6 space-y-5">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-stone-300 text-sm font-medium mb-2" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-3 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-stone-300 text-sm font-medium mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-3 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-semibold py-3 rounded-lg transition-colors"
          >
            {isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-stone-400 text-sm mt-6">
          New adventurer?{' '}
          <Link href="/signup" className="text-amber-400 hover:text-amber-300 font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}
