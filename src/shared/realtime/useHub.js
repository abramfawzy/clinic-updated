import { useEffect, useRef } from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { HUB_URL } from '@/shared/config/env'
import { useAuthStore } from '@/features/auth/authStore'

export function useHub(path, handlers) {
  const ref = useRef(handlers)
  ref.current = handlers

  useEffect(() => {
    const token = useAuthStore.getState().token
    if (!token) return

    const conn = new HubConnectionBuilder()
      .withUrl(`${HUB_URL}${path}`, { accessTokenFactory: () => useAuthStore.getState().token ?? '' })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    Object.keys(ref.current).forEach((name) => conn.on(name, (...args) => ref.current[name]?.(...args)))
    conn.start().catch((e) => console.warn('SignalR connect failed', e))

    return () => {
      conn.stop()
    }
  }, [path])
}