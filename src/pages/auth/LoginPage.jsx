import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginSchema } from '../../validations/schemas';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const { signIn, isConfigured } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from
    ? `${location.state.from.pathname || '/app/dashboard'}${location.state.from.search || ''}`
    : '/app/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        toastError(error.message || 'Invalid email or password');
      } else {
        success('Welcome back to FitTrack!');
        navigate(from, { replace: true });
      }
    } catch (err) {
      toastError(err?.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setValue('email', 'athlete@fittrack.app');
    setValue('password', 'fitness2025');
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
      <div className="mb-6 text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Sign in to access your workout history, macros, and daily activity.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      {/* Quick fill / sandbox helper */}
      <div className="mt-5 pt-5 border-t border-white/[0.08] flex flex-col gap-3">
        <button
          type="button"
          onClick={fillDemoAccount}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-lime" />
          <span>Quick fill Demo Credentials</span>
        </button>

        {!isConfigured && (
          <p className="text-[11px] text-amber-400/90 bg-amber-400/10 px-3 py-2 rounded-xl text-center">
            Local Sandbox Mode active: any credentials will create a private test session.
          </p>
        )}

        <p className="text-xs text-slate-400 text-center mt-2">
          Don't have an account yet?{' '}
          <Link to="/signup" className="text-lime font-bold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
