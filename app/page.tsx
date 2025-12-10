"use client";
import { useAppStore, useLoadStore } from "@/lib/store";
import LoginPage from "@/components/login-page";
import AdminDashboard from "@/components/admin-dashboard";
import UserDashboard from "@/components/user-dashboard";
import { useEffect, useState } from "react";
import PredictionDashboard from "@/components/prediction-dashboard";

export default function Home() {
  useLoadStore();
  const { user } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give the store time to hydrate from localStorage/storage
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  return <PredictionDashboard />;
}
