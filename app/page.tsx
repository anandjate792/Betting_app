"use client"
import Image from "next/image"
import { useAppStore, useLoadStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import LoginPage from "@/components/login-page"
import { Spinner } from "@/components/ui/spinner"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

const ICONS = [
  {
    id: "umbrella",
    name: "Umbrella",
    image: "/umbrella.webp",
  },
  {
    id: "football",
    name: "Football",
    image: "/football.webp",
  },
  { id: "sun", name: "Sun", image: "/sun.webp" },
  { id: "lamp", name: "Lamp", image: "/lamp.webp" },
  { id: "cow", name: "Cow", image: "/cow.webp" },
  {
    id: "bucket",
    name: "Bucket",
    image: "/bucket.webp",
  },
  { id: "kite", name: "Kite", image: "/kite.webp" },
  {
    id: "spinning-top",
    name: "Spinning Top",
    image: "/spinning-top.webp",
  },
  { id: "rose", name: "Rose", image: "/rose.webp" },
  {
    id: "butterfly",
    name: "Butterfly",
    image: "/butterfly.webp",
  },
  { id: "sparrow", name: "Sparrow", image: "/sparrow.webp" },
  { id: "rabbit", name: "Rabbit", image: "/rabbit.webp" },
]

export default function Home() {
  console.log("🚀 Page component started")
  useLoadStore()
  console.log("📦 useLoadStore called")
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
          {ICONS.map(({ id, name, image }) => (
            <button
              key={id}
              onClick={() => setShowLoginModal(true)}
              className="p-6 rounded-lg border-2 border-slate-600 bg-slate-800 hover:border-blue-500 hover:bg-slate-700 transition-all flex flex-col items-center gap-2"
            >
              <Image
                src={image}
                alt={name}
                width={64}
                height={64}
                className="w-16 h-16 object-contain"
              />
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
          <DialogTitle className="sr-only">Login</DialogTitle>
          <LoginPage />
        </DialogContent>
      </Dialog>
    </>
  )
}
