import { useState, useEffect, useRef } from 'react'

export function useMobileOptimized() {
  const [isMobile, setIsMobile] = useState(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      
      rafRef.current = requestAnimationFrame(() => {
        setIsMobile(window.innerWidth <= 768)
      })
    }

    checkMobile()
    window.addEventListener('resize', checkMobile, { passive: true })
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return isMobile
}

export function useTouchOptimized() {
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return
    
    const touchEnd = e.changedTouches[0].clientX
    const distance = Math.abs(touchEnd - touchStart)
    
    // Reset after a short delay
    setTimeout(() => setTouchStart(null), 100)
    
    return distance < 10 // Consider it a tap if distance is small
  }

  return { handleTouchStart, handleTouchEnd }
}
