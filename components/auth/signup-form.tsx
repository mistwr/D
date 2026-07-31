'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type FormValues = {
  first_name: string
  last_name: string
  email: string
  password: string
  confirmPassword: string
}

function validate(data: FormValues) {
  const errors: Partial<Record<keyof FormValues, { message: string }>> = {}
  if (!data.first_name || data.first_name.length < 2) errors.first_name = { message: 'Nome obrigatório (mín. 2 caracteres)' }
  if (!data.last_name || data.last_name.length < 2) errors.last_name = { message: 'Apelido obrigatório (mín. 2 caracteres)' }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = { message: 'Email inválido' }
  if (!data.password || data.password.length < 8) errors.password = { message: 'Mínimo 8 caracteres' }
  if (data.password !== data.confirmPassword) errors.confirmPassword = { message: 'As passwords não coincidem' }
  return errors
}

export function SignupForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const supabase = createClient()

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
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
        },
      },
    })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Conta criada! Verifique o seu email para confirmar o registo.')
    router.push('/auth/login')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">Nome</Label>
          <Input id="first_name" placeholder="João" {...register('first_name')} />
          {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name">Apelido</Label>
          <Input id="last_name" placeholder="Silva" {...register('last_name')} />
          {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="nome@parcendi.pt" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirmar password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Repetir password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-brand hover:bg-brand-dark text-white h-11"
      >
        {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2" /> A criar conta...</> : 'Criar conta'}
      </Button>
    </form>
  )
}
