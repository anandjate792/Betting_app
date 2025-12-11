"use client"
import { useAppStore, useLoadStore } from "@/lib/store"
import LoginPage from "@/components/login-page"
import AdminDashboard from "@/components/admin-dashboard"
import PredictionDashboard from "@/components/prediction-dashboard"

export default function Home() {
  useLoadStore()

  const { user } = useAppStore()

  if (!user) {
    return <LoginPage />
  }

  if (user.role === "admin") {
    return <AdminDashboard />
  }

  return <PredictionDashboard />
}
