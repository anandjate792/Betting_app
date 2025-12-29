"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const { login, register } = useAppStore()
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const success = await login(email, password)
    setLoading(false)
    if (success) {
      setEmail("")
      setPassword("")
    } else {
      setError("Invalid email or password")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name || !email || !password) {
      setError("Please fill in all required fields")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    const success = await register(name, email, password, referralCode || undefined)
    setLoading(false)
    if (success) {
      setName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setReferralCode("")
    } else {
      setError("Registration failed. Email may already exist.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <Image
                src="/logo.png"
                alt="Pop The Picture"
                width={180}
                height={60}
                className="h-16 w-auto"
                priority
              />
            </div>
            <CardDescription className="text-slate-400">
              {isSignup ? "Create a new account" : "Admin & User Portal"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSignup ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Full Name</label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">
                    Referral Code <span className="text-slate-500">(Optional)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  {loading ? "Creating Account..." : "Sign Up"}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(false)
                      setError("")
                      setName("")
                      setEmail("")
                      setPassword("")
                      setConfirmPassword("")
                      setReferralCode("")
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Already have an account? Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(true)
                      setError("")
                      setEmail("")
                      setPassword("")
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Don't have an account? Sign Up
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
