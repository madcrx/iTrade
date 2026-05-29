import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { User, Bell, Shield, Link2, Moon, Sun, Save, Check } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { SimpleTabs as Tabs } from '../components/ui/Tabs'
import { clsx } from 'clsx'

const BROKERS = [
  { id: 'stake', name: 'Stake', region: 'US + ASX', color: 'bg-green-500' },
  { id: 'commsec', name: 'CommSec', region: 'ASX', color: 'bg-yellow-500' },
  { id: 'selfwealth', name: 'SelfWealth', region: 'ASX', color: 'bg-blue-500' },
  { id: 'ibkr', name: 'Interactive Brokers', region: 'US + ASX', color: 'bg-red-500' },
  { id: 'etoro', name: 'eToro', region: 'Multi', color: 'bg-teal-500' },
  { id: 'kraken', name: 'Kraken', region: 'Crypto', color: 'bg-purple-600' },
  { id: 'coinbase', name: 'Coinbase', region: 'Crypto', color: 'bg-blue-600' },
  { id: 'binance', name: 'Binance', region: 'Crypto', color: 'bg-yellow-400' },
  { id: 'webull', name: 'Webull', region: 'US', color: 'bg-teal-600' },
  { id: 'tiger', name: 'Tiger Brokers', region: 'US + ASX', color: 'bg-orange-500' },
  { id: 'cmc', name: 'CMC Markets (AU)', region: 'AU + US', color: 'bg-gray-700' },
]

const RISK_OPTIONS = [
  { value: 'conservative', label: 'Conservative', desc: 'Smaller stop-losses (3%), lower position sizing. Prioritises capital preservation.' },
  { value: 'moderate', label: 'Moderate', desc: 'Balanced approach (5% stops). Suitable for most investors.' },
  { value: 'aggressive', label: 'Aggressive', desc: 'Wider stops (8%), larger positions. Higher risk, higher potential reward.' },
]

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const { isDark, toggle } = useThemeStore()
  const [tab, setTab] = useState<'profile' | 'notifications' | 'brokers' | 'risk'>('profile')
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState(user?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [defaultBroker, setDefaultBroker] = useState(user?.default_broker ?? 'stake')
  const [risk, setRisk] = useState<'conservative' | 'moderate' | 'aggressive'>(user?.risk_preference ?? 'moderate')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifPush, setNotifPush] = useState(true)
  const [notifBuyOnly, setNotifBuyOnly] = useState(false)
  const [minStrength, setMinStrength] = useState(5)

  const saveMutation = useMutation({
    mutationFn: async () => {
      updateUser({ full_name: name, default_broker: defaultBroker, risk_preference: risk })
    },
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage your account and preferences</p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          variant={saved ? 'success' : 'primary'}
        >
          {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { label: 'Profile', value: 'profile' },
          { label: 'Notifications', value: 'notifications' },
          { label: 'Brokers', value: 'brokers' },
          { label: 'Risk', value: 'risk' },
        ]}
        active={tab}
        onChange={v => setTab(v as typeof tab)}
      />

      {tab === 'profile' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-text-secondary" />
              <h2 className="font-semibold text-text-primary">Profile</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="email@example.com" />
              </div>
            </div>
            <hr className="border-border" />
            <h3 className="text-sm font-semibold text-text-primary">Change Password</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Current Password</label>
                <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">New Password</label>
                <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            <hr className="border-border" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Theme</p>
                <p className="text-xs text-text-muted mt-0.5">{isDark ? 'Dark mode active' : 'Light mode active'}</p>
              </div>
              <button
                onClick={toggle}
                className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary hover:border-border-light transition-colors"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-text-secondary" />
              <h2 className="font-semibold text-text-primary">Notification Preferences</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: 'Email alerts', desc: 'Receive signal alerts via email', value: notifEmail, set: setNotifEmail },
              { label: 'Push notifications', desc: 'Browser push notifications for new signals', value: notifPush, set: setNotifPush },
              { label: 'Buy signals only', desc: 'Only notify on BUY signals (skip SELL)', value: notifBuyOnly, set: setNotifBuyOnly },
            ].map(({ label, desc, value, set }) => (
              <div key={label} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">{label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => set(!value)}
                  className={clsx('w-11 h-6 rounded-full transition-colors relative flex-shrink-0', value ? 'bg-accent-blue' : 'bg-border')}
                >
                  <span className={clsx('absolute top-1 h-4 w-4 bg-white rounded-full shadow transition-transform', value ? 'translate-x-5' : 'translate-x-1')} />
                </button>
              </div>
            ))}
            <hr className="border-border" />
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Minimum signal strength to notify: <span className="text-text-primary font-semibold">{minStrength}/10</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={minStrength}
                onChange={e => setMinStrength(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>1 (all signals)</span>
                <span>10 (strongest only)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'brokers' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-text-secondary" />
              <h2 className="font-semibold text-text-primary">Default Broker</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary mb-4">
              Choose your preferred broker. When you click "Trade Now" on a signal, this broker's deep link opens first.
              You can always choose a different broker from the Trade Now modal.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BROKERS.map(broker => (
                <button
                  key={broker.id}
                  onClick={() => setDefaultBroker(broker.id)}
                  className={clsx(
                    'flex items-center gap-3 p-4 rounded-xl border text-left transition-all',
                    defaultBroker === broker.id
                      ? 'border-accent-blue bg-accent-blue/5 ring-1 ring-accent-blue/30'
                      : 'border-border hover:border-border-light'
                  )}
                >
                  <div className={clsx('w-8 h-8 rounded-lg flex-shrink-0', broker.color)} />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{broker.name}</p>
                    <p className="text-xs text-text-muted">{broker.region}</p>
                  </div>
                  {defaultBroker === broker.id && (
                    <Check className="h-4 w-4 text-accent-blue ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'risk' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-text-secondary" />
              <h2 className="font-semibold text-text-primary">Risk Preference</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-secondary">
              This affects the suggested stop-loss and position size shown on each signal.
              You are always free to use different levels when executing your trade.
            </p>
            {RISK_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRisk(opt.value as typeof risk)}
                className={clsx(
                  'w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all',
                  risk === opt.value
                    ? 'border-accent-blue bg-accent-blue/5'
                    : 'border-border hover:border-border-light'
                )}
              >
                <div className={clsx(
                  'w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors',
                  risk === opt.value ? 'border-accent-blue bg-accent-blue' : 'border-border'
                )}>
                  {risk === opt.value && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{opt.label}</p>
                  <p className="text-sm text-text-secondary mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
            <div className="bg-bg-secondary rounded-lg p-4 border border-border mt-2">
              <p className="text-xs text-text-muted leading-relaxed">
                ⚠️ These are suggested levels only. iTrade does not execute trades on your behalf.
                Always conduct your own analysis before placing any trade.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
