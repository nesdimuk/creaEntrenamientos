'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Check } from 'lucide-react'

export default function SendInviteButton({ clientId, email }: { clientId: string; email: string }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/invite-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, clientId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al enviar')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-green-600">
        <Check className="w-4 h-4" />Invitación enviada
      </span>
    )
  }

  return (
    <div className="space-y-1">
      <Button variant="outline" size="sm" onClick={handleSend} disabled={loading}>
        <Mail className="w-3.5 h-3.5 mr-1.5" />
        {loading ? 'Enviando...' : 'Enviar invitación'}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
