import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { bookingApi } from './bookingApi'
import { useAuthStore } from '@/features/auth/authStore'
import { useHub } from '@/shared/realtime/useHub'
import { getErrorMessage } from '@/shared/api/axios'
import { formatTime } from '@/shared/lib/format'

// المراسلة مفتوحة 14 يوم بعد الكشف المكتمل (الباك بيتحقق من ExpiresAt)
export default function ChatPanel({ appointmentId }) {
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const [text, setText] = useState('')
  const bottom = useRef(null)
  const key = ['messages', appointmentId]

  const messages = useQuery({ queryKey: key, queryFn: () => bookingApi.messages(appointmentId) })

  // رسالة جديدة من الطرف التاني بتيجي من SignalR
  useHub('/hubs/chat', {
    ReceiveMessage: (m) => {
      if (m?.appointmentId === appointmentId) qc.invalidateQueries({ queryKey: key })
    },
  })

  const send = useMutation({
    mutationFn: () => bookingApi.sendMessage(appointmentId, text.trim()),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: key })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.data?.length])

  return (
    <div className="flex h-80 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
        {messages.isLoading && <p className="text-center text-sm text-slate-500">...</p>}
        {messages.data?.map((m) => {
          const mine = m.senderId === me?.id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-700'
                }`}
              >
                {m.body}
                <span className="mt-1 block text-[10px] opacity-70">{formatTime(m.sentAt)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottom} />
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) send.mutate()
        }}
      >
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
        <button className="btn-primary" disabled={send.isPending || !text.trim()}>
          ➤
        </button>
      </form>
    </div>
  )
}
