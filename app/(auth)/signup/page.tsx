'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/actions/auth'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    startTransition(async () => {
      const result = await signUp(email, password)
      if (result?.error) setError(result.error)
      else if (result?.success) setSuccess(result.success)
    })
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-amber-400 text-sm hover:text-amber-300">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold text-stone-100 mt-4">Begin your quest</h1>
          <p className="text-stone-400 mt-2">Create an account to build your characters</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-700 rounded-xl p-6 space-y-5">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg px-4 py-3 text-sm">
              {success}
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
              placeholder="At least 6 characters"
              className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-3 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !!success}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-semibold py-3 rounded-lg transition-colors"
          >
            {isPending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-stone-400 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
