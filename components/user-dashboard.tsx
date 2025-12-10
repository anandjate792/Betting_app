"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletIcon, LogOutIcon, Upload, Settings } from "lucide-react"
import SettingsModal from "./settings-modal"

export default function UserDashboard() {
  const { user, logout, addTransaction, transactions } = useAppStore()
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("wallet")
  const [showSettings, setShowSettings] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userTransactions = transactions.filter((t) => t.userId === user?.id)
  const pendingCount = userTransactions.filter((t) => t.status === "pending").length

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setScreenshotImage(base64)
        setImagePreview(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    if (amount && description && screenshotImage) {
      addTransaction(Number.parseFloat(amount), description, screenshotImage)
      setAmount("")
      setDescription("")
      setScreenshotImage(null)
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">User Dashboard</h1>
              <p className="text-slate-400 text-sm">Welcome, {user?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSettings(true)}
                variant="ghost"
                className="text-slate-400 hover:text-blue-400"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button onClick={logout} variant="ghost" className="text-slate-400 hover:text-red-400">
                <LogOutIcon className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 space-y-6">
          {/* Wallet Balance */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <WalletIcon className="w-5 h-5" />
                Wallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-400">${user?.walletBalance.toFixed(2)}</div>
              <p className="text-slate-400 text-sm mt-2">Your current wallet balance</p>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="wallet">Upload Transaction</TabsTrigger>
              <TabsTrigger value="history">
                History
                {pendingCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">{pendingCount}</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wallet" className="mt-6">
              <Card className="border-slate-700 bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Submit Gpay Transaction</CardTitle>
                  <CardDescription>Upload your payment screenshot for admin approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitTransaction} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-300">Amount ($)</label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300">Description</label>
                      <Input
                        type="text"
                        placeholder="Gpay payment for..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-300">Upload Screenshot</label>
                      <div className="mt-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                          variant="outline"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {imagePreview ? "Change Image" : "Choose Image"}
                        </Button>
                      </div>
                    </div>

                    {imagePreview && (
                      <div className="mt-4">
                        <p className="text-sm text-slate-300 mb-2">Preview:</p>
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Screenshot preview"
                          className="w-full max-h-48 object-cover rounded-lg border border-slate-600"
                        />
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={!screenshotImage}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit for Approval
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-6 space-y-3">
              {userTransactions.length === 0 ? (
                <Card className="border-slate-700 bg-slate-800">
                  <CardContent className="pt-6">
                    <p className="text-slate-400 text-center">No transactions yet</p>
                  </CardContent>
                </Card>
              ) : (
                userTransactions.map((transaction) => (
                  <Card key={transaction.id} className="border-slate-700 bg-slate-800">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-white">{transaction.description}</p>
                          <p className="text-sm text-slate-400">{new Date(transaction.createdAt).toLocaleString()}</p>
                          {transaction.status === "approved" && (
                            <p className="text-xs text-green-400 mt-1">✓ Approved</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-400">${transaction.amount.toFixed(2)}</p>
                          <span
                            className={`text-xs px-3 py-1 rounded-full ${
                              transaction.status === "pending"
                                ? "bg-yellow-600 text-white"
                                : transaction.status === "approved"
                                  ? "bg-green-600 text-white"
                                  : "bg-red-600 text-white"
                            }`}
                          >
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
