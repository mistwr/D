'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, Loader2 } from 'lucide-react'

type FormValues = {
  name: string
  email: string
  phone?: string
  message: string
  rgpd_consent: boolean
}

function validate(data: FormValues) {
  const errors: Partial<Record<keyof FormValues, { message: string }>> = {}
  if (!data.name || data.name.length < 2) errors.name = { message: 'Nome obrigatório (mín. 2 caracteres)' }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = { message: 'Email inválido' }
  if (!data.message || data.message.length < 10) errors.message = { message: 'Mensagem muito curta (mín. 10 caracteres)' }
  if (!data.rgpd_consent) errors.rgpd_consent = { message: 'É necessário aceitar a política de privacidade' }
  return errors
}

const segments = [
  { value: 'energia', label: 'Energia' },
  { value: 'telecom', label: 'Telecom' },
  { value: 'credito', label: 'Crédito' },
  { value: 'imobiliario', label: 'Imobiliário' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'outro', label: 'Outro' },
]

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [segment, setSegment] = useState<string>('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  async function onSubmit(data: FormValues) {
    const fieldErrors = validate(data)
    if (Object.keys(fieldErrors).length > 0) {
      Object.entries(fieldErrors).forEach(([k, v]) => setError(k as keyof FormValues, v!))
      return
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, segment: segment || null }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      toast.error('Erro ao enviar mensagem. Por favor tente novamente.')
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold mb-2">Mensagem enviada!</h3>
        <p className="text-muted-foreground max-w-xs">
          Entraremos em contacto consigo em breve, normalmente nas próximas 2 horas úteis.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" placeholder="O seu nome" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" placeholder="email@exemplo.pt" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" placeholder="+351 9XX XXX XXX" {...register('phone')} />
        </div>
        <div className="space-y-1.5">
          <Label>Serviço de interesse</Label>
          <Select onValueChange={(v: string | null) => { if (v) setSegment(v) }}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar serviço" />
            </SelectTrigger>
            <SelectContent>
              {segments.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Mensagem *</Label>
        <Textarea
          id="message"
          placeholder="Descreva a sua necessidade ou questão..."
          rows={5}
          {...register('message')}
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
      </div>

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="rgpd"
          className="mt-1"
          {...register('rgpd_consent')}
        />
        <label htmlFor="rgpd" className="text-sm text-muted-foreground leading-relaxed">
          Li e aceito a{' '}
          <a href="/privacidade" className="text-brand underline">Política de Privacidade</a>
          {' '}e autorizo o tratamento dos meus dados pessoais para resposta à minha questão. *
        </label>
      </div>
      {errors.rgpd_consent && <p className="text-xs text-destructive">{errors.rgpd_consent.message}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-brand hover:bg-brand-dark text-white h-11"
      >
        {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2" /> A enviar...</> : 'Enviar mensagem'}
      </Button>
    </form>
  )
}
