//authForm.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { registerUser } from '@/lib/actions/register.actions'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'

import CustomInput from './CustomInput'
import { authFormSchema } from '@/lib/utils'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  signIn,
  signUp,
} from '@/lib/actions/user.action'

const AuthForm = ({
  type,
}: {
  type: 'sign-in' | 'sign-up'
}) => {
  const router = useRouter()

  const [isLoading, setIsLoading] =
    useState(false)
  const [errorMessage, setErrorMessage] =
    useState("")

  const formSchema = authFormSchema(type)

  const form = useForm<
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  })

 const onSubmit = async (data: z.infer<typeof formSchema>) => {
  try {
    setIsLoading(true);
    setErrorMessage("");

    if (type === "sign-up") {
      const response = await registerUser({
        firstName: data.firstName!,
        lastName: data.lastName!,
        email: data.email,
        password: data.password,
      });

      if (response) {
        router.push("/sign-in");
      }
      return;
    }

    if (type === "sign-in") {
      const response = await signIn({
        email: data.email,
        password: data.password,
      });

      if (response) {
        router.push("/");
        router.refresh(); // 🔥 CRITICAL FIX
      }
    }
  } catch (error) {
    console.error("AUTH ERROR:", error);
    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again."
    );
  } finally {
    setIsLoading(false);
  }
};
  return (
    <section className="auth-form">
      <header className="flex flex-col gap-5 md:gap-8">
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <Image
            src="/icons/logo.svg"
            width={34}
            height={34}
            alt="Logo"
          />

          <h1 className="text-2xl font-bold">
            Cash
          </h1>
        </Link>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">
            {type === 'sign-in'
              ? 'Sign In'
              : 'Create Account'}
          </h1>

          <p className="text-gray-500">
            {type === 'sign-in'
              ? 'Sign in to continue'
              : 'Create your fintech account'}
          </p>
        </div>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            onSubmit
          )}
          className="space-y-6"
        >
          {type === 'sign-up' && (
            <div className="flex gap-4">
              <CustomInput
                control={form.control}
                name="firstName"
                label="First Name"
                placeholder="John"
              />

              <CustomInput
                control={form.control}
                name="lastName"
                label="Last Name"
                placeholder="Doe"
              />
            </div>
          )}

          <CustomInput
            control={form.control}
            name="email"
            label="Email"
            placeholder="john@example.com"
          />

          <CustomInput
            control={form.control}
            name="password"
            label="Password"
            placeholder="••••••••"
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : type === 'sign-in' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </Button>

          {errorMessage && (
            <p className="text-14 text-red-500">
              {errorMessage}
            </p>
          )}
        </form>
      </Form>

      <footer className="mt-6 flex justify-center gap-1">
        <p className="text-sm text-gray-500">
          {type === 'sign-in'
            ? "Don't have an account?"
            : 'Already have an account?'}
        </p>

        <Link
          href={
            type === 'sign-in'
              ? '/sign-up'
              : '/sign-in'
          }
          className="font-medium text-blue-600"
        >
          {type === 'sign-in'
            ? 'Sign Up'
            : 'Sign In'}
        </Link>
      </footer>
    </section>
  )
}

export default AuthForm
