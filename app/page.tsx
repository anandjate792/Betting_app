"use client"
import Image from "next/image"
import { useAppStore, useLoadStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import LoginPage from "@/components/login-page"
import { Spinner } from "@/components/ui/spinner"
import {
  Umbrella,
  Egg,
  Coins,
  Star,
  Heart,
  Diamond,
  Spade,
  Club,
  Trophy,
  Crown,
  Gem,
  Fish,
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const ICONS = [
  { id: "umbrella", name: "Umbrella", Icon: Umbrella, color: "text-blue-500" },
  { id: "fish", name: "Fish", Icon: Fish, color: "text-yellow-500" },
  { id: "hen", name: "Hen", Icon: Egg, color: "text-orange-500" },
  { id: "coin", name: "Coin", Icon: Coins, color: "text-amber-500" },
  { id: "star", name: "Star", Icon: Star, color: "text-yellow-400" },
  { id: "heart", name: "Heart", Icon: Heart, color: "text-red-500" },
  { id: "diamond", name: "Diamond", Icon: Diamond, color: "text-cyan-500" },
  { id: "spade", name: "Spade", Icon: Spade, color: "text-slate-700" },
  { id: "club", name: "Club", Icon: Club, color: "text-green-600" },
  { id: "trophy", name: "Trophy", Icon: Trophy, color: "text-yellow-600" },
  { id: "crown", name: "Crown", Icon: Crown, color: "text-purple-500" },
  { id: "gem", name: "Gem", Icon: Gem, color: "text-pink-500" },
]

export default function Home() {
  useLoadStore()
  const { user, isLoading } = useAppStore()
  const router = useRouter()
  const [showLoginModal, setShowLoginModal] = useState(false)

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
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Pop The Picture"
              width={240}
              height={80}
              className="h-20 w-auto"
              priority
            />
          </div>
          <p className="text-slate-400">Choose an icon to start betting</p>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-6 gap-4 max-w-4xl w-full">
          {ICONS.map(({ id, name, Icon, color }) => (
            <button
              key={id}
              onClick={() => setShowLoginModal(true)}
              className="p-6 rounded-lg border-2 border-slate-600 bg-slate-800 hover:border-blue-500 hover:bg-slate-700 transition-all flex flex-col items-center gap-2"
            >
              <Icon className={`w-8 h-8 ${color}`} />
              <span className="text-xs text-slate-300">{name}</span>
            </button>
          ))}
        </div>

        <p className="text-slate-400 text-sm mt-8 text-center">
          Click any icon to login or signup
        </p>
      </div>

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="border-0 p-0 max-w-md">
          <LoginPage />
        </DialogContent>
      </Dialog>
    </>
  )
}
