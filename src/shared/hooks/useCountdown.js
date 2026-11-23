import { useEffect, useState } from 'react'

// عداد تنازلي لحد وقت معين (مثلاً انتهاء الحجز المؤقت 15 دقيقة)
export function useCountdown(expiresAt) {
  const target = expiresAt ? new Date(expiresAt).getTime() : null
  const [left, setLeft] = useState(() => (target ? Math.max(0, target - Date.now()) : 0))

  useEffect(() => {
    if (!target) return
    const tick = () => setLeft(Math.max(0, target - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  const totalSec = Math.floor(left / 1000)
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const ss = String(totalSec % 60).padStart(2, '0')
  return { left, expired: !!target && left === 0, label: `${mm}:${ss}` }
}
