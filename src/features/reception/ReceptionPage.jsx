import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/shared/api/axios'
import { receptionApi } from './receptionApi'
import { EmptyState, ErrorBox, PageLoader, StatusBadge } from '@/shared/components/ui'
import { formatMoney, formatTime } from '@/shared/lib/format'

export default function ReceptionPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [apptId, setApptId] = useState('')
  const [couponCode, setCouponCode] = useState('')

  const q = useQuery({ queryKey: ['reception-today'], queryFn: receptionApi.today, refetchInterval: 30_000 })
  const done = () => {
    toast.success(t('common.confirm'))
    qc.invalidateQueries({ queryKey: ['reception-today'] })
  }
  const onError = (e) => toast.error(getErrorMessage(e))

  const checkIn = useMutation({ mutationFn: receptionApi.checkIn, onSuccess: done, onError })
  const pay = useMutation({
    mutationFn: ({ id, coupon }) => receptionApi.confirmPayment(id, coupon || null),
    onSuccess: done,
    onError,
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">{t('reception.title')}</h1>

      <div className="card space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label">ID</label>
            <input
              type="number"
              className="input !w-36"
              dir="ltr"
              placeholder="12"
              value={apptId}
              onChange={(e) => setApptId(e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t('booking.coupon')}</label>
            <input
              className="input !w-40"
              dir="ltr"
              placeholder="WELCOME10"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
          </div>
          <button
            className="btn-primary"
            disabled={!apptId || checkIn.isPending}
            onClick={() => checkIn.mutate(Number(apptId))}
          >
            {t('reception.checkIn')}
          </button>
          <button
            className="btn-outline"
            disabled={!apptId || pay.isPending}
            onClick={() => pay.mutate({ id: Number(apptId), coupon: couponCode.trim() })}
          >
            {t('reception.confirmPayment')}
          </button>
        </div>
      </div>

      {q.isLoading ? (
        <PageLoader />
      ) : q.isError ? (
        <ErrorBox message={getErrorMessage(q.error)} onRetry={q.refetch} />
      ) : q.data.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 text-start">{t('common.time')}</th>
                <th className="text-start">{t('common.patient')}</th>
                <th className="text-start">{t('common.doctor')}</th>
                <th className="text-start">{t('common.status')}</th>
                <th className="text-start">{t('common.price')}</th>
                <th className="text-start">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {q.data.map((a) => (
                <tr key={a.id}>
                  <td className="py-3 font-bold">{formatTime(a.start)}</td>
                  <td>{a.patientName}</td>
                  <td>{a.doctorName}</td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td>
                    {formatMoney(a.price)}{' '}
                    <span className={a.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}>
                      ({a.paymentStatus === 'Paid' ? t('reception.paid') : t('reception.unpaid')})
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2 py-2">
                      {a.status === 'Confirmed' && (
                        <button
                          className="btn-primary !px-3 !py-1.5"
                          disabled={checkIn.isPending}
                          onClick={() => checkIn.mutate(a.id)}
                        >
                          {t('reception.checkIn')}
                        </button>
                      )}
                      {a.paymentStatus !== 'Paid' && a.paymentMethod === 'Clinic' && (
                        <button
                          className="btn-outline !px-3 !py-1.5"
                          disabled={pay.isPending}
                          onClick={() => pay.mutate({ id: a.id, coupon: couponCode.trim() })}
                        >
                          {t('reception.confirmPayment')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}