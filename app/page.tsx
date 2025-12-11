"use client"
import { useAppStore, useLoadStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import LoginPage from "@/components/login-page"
import { Spinner } from "@/components/ui/spinner"

export default function Home() {
  useLoadStore()
  const { user, isLoading } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        router.push("/admin/users")
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <Spinner className="w-8 h-8 text-blue-400 mx-auto mb-4" />
        <p className="text-slate-400">Redirecting...</p>
      </div>
    </div>
  );
}
