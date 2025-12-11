"use client";

import { useAppStore, useLoadStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminNavbar from "@/components/admin-navbar";
import LoginPage from "@/components/login-page";
import { Spinner } from "@/components/ui/spinner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useLoadStore();
  const { user, isLoading } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

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
    return <LoginPage />;
  }

  if (user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <AdminNavbar />
      <main>{children}</main>
    </div>
  );
}

