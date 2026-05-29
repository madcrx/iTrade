import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { portfolioApi, type AddTradeRequest } from '../../api/portfolio'
import { Modal } from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'
import { format } from 'date-fns'

interface AddTradeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultSignalId?: number
  defaultSymbol?: string
}

export default function AddTradeModal({ isOpen, onClose, onSuccess, defaultSignalId, defaultSymbol }: AddTradeModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<AddTradeRequest>({
    symbol: defaultSymbol || '',
    trade_type: 'BUY',
    price: 0,
    quantity: 0,
    trade_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    signal_id: defaultSignalId,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof AddTradeRequest, string>>>({})

  const mutation = useMutation({
    mutationFn: portfolioApi.addTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] })
      queryClient.invalidateQueries({ queryKey: ['holdings'] })
      queryClient.invalidateQueries({ queryKey: ['performance'] })
      onSuccess?.()
      onClose()
    },
  })

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    if (!form.symbol.trim()) newErrors.symbol = 'Symbol is required'
    if (form.price <= 0) newErrors.price = 'Price must be greater than 0'
    if (form.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0'
    if (!form.trade_date) newErrors.trade_date = 'Date is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) mutation.mutate(form)
  }

  const update = (field: keyof AddTradeRequest, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const totalValue = form.price * form.quantity

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Trade" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Trade type */}
        <div className="flex gap-3">
          {(['BUY', 'SELL'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => update('trade_type', t)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all ${
                form.trade_type === t
                  ? t === 'BUY'
                    ? 'bg-bull/10 text-bull border-bull/40'
                    : 'bg-bear/10 text-bear border-bear/40'
                  : 'text-text-muted border-border hover:text-text-secondary'
              }`}
            >
              {t === 'BUY' ? '▲ BUY' : '▼ SELL'}
            </button>
          ))}
        </div>

        <Input
          label="Symbol"
          value={form.symbol}
          onChange={(e) => update('symbol', e.target.value.toUpperCase())}
          placeholder="AAPL, BTC-USD, CBA.AX"
          error={errors.symbol}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Price"
            type="number"
            step="0.01"
            value={form.price || ''}
            onChange={(e) => update('price', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            error={errors.price}
          />
          <Input
            label="Quantity"
            type="number"
            step="1"
            value={form.quantity || ''}
            onChange={(e) => update('quantity', parseFloat(e.target.value) || 0)}
            placeholder="0"
            error={errors.quantity}
          />
        </div>

        {totalValue > 0 && (
          <div className="px-3 py-2 bg-bg-card rounded-lg border border-border">
            <p className="text-sm text-text-secondary">
              Total:{' '}
              <span className="font-semibold text-text-primary">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        )}

        <Input
          label="Trade Date"
          type="date"
          value={form.trade_date}
          onChange={(e) => update('trade_date', e.target.value)}
          error={errors.trade_date}
        />

        <Textarea
          label="Notes (optional)"
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Reason for trade, strategy used, etc."
          rows={3}
        />

        {mutation.isError && (
          <p className="text-sm text-bear text-center">
            Failed to log trade. Please try again.
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={form.trade_type === 'BUY' ? 'success' : 'danger'}
            fullWidth
            loading={mutation.isPending}
          >
            Log {form.trade_type} Trade
          </Button>
        </div>
      </form>
    </Modal>
  )
}
