"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Gamepad2,
  LogOut,
  Menu,
  X,
  CreditCard,
  ArrowUpDown,
  Settings,
} from "lucide-react";
import { useState } from "react";
import SettingsModal from "./settings-modal";

export default function UserNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Wallet },
    { href: "/dashboard/wallet", label: "Wallet", icon: CreditCard },
    {
      href: "/dashboard/transactions",
      label: "Transactions",
      icon: ArrowUpDown,
    },
    { href: "/dashboard/withdrawals", label: "Withdrawals", icon: ArrowUpDown },
  ];

  return (
    <nav className="border-b border-slate-700 bg-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 md:gap-8">
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
            >
              <Image
                src="/logo.png"
                alt="Pop The Picture"
                width={120}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href === "/dashboard" && pathname === "/dashboard");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-slate-700 text-white"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop Wallet Balance */}
            <div className="hidden md:block text-right">
              <p className="text-xs md:text-sm text-slate-400">
                Wallet Balance
              </p>
              <p className="text-lg md:text-2xl font-bold text-green-400">
                ₹{user?.walletBalance.toFixed(2) || "0.00"}
              </p>
            </div>
            <Button
              onClick={() => setShowSettings(true)}
              variant="ghost"
              className="text-slate-400 hover:text-blue-400 hidden md:flex"
              size="sm"
            >
              <Settings className="w-4 h-4 md:mr-2" />
              <span className="hidden lg:inline">Settings</span>
            </Button>
            <Button
              onClick={logout}
              variant="ghost"
              className="text-slate-400 hover:text-red-400 hidden md:flex"
              size="sm"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden lg:inline">Logout</span>
            </Button>
            {/* Mobile Menu Button */}
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="ghost"
              className="text-slate-400 hover:text-white lg:hidden"
              size="sm"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-700 py-4 space-y-2">
            {/* Mobile Wallet Balance */}
            <div className="px-4 py-3 bg-slate-700/50 rounded-lg mb-2">
              <p className="text-xs text-slate-400">Wallet Balance</p>
              <p className="text-xl font-bold text-green-400">
                ₹{user?.walletBalance.toFixed(2) || "0.00"}
              </p>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === "/dashboard" && pathname === "/dashboard");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-slate-700 text-white"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-4 border-t border-slate-700 space-y-2">
              <Button
                onClick={() => {
                  setShowSettings(true);
                  setMobileMenuOpen(false);
                }}
                variant="ghost"
                className="w-full justify-start text-slate-300 hover:text-blue-400"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                variant="ghost"
                className="w-full justify-start text-slate-300 hover:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </nav>
  );
}
