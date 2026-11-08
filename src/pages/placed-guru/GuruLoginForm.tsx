import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import Header from '@/components/Header';

interface GuruLoginFormProps {
  onSuccess: () => void;
}

const GuruLoginForm = ({ onSuccess }: GuruLoginFormProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Signed in!');
        onSuccess();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/placed-guru` },
        });
        if (error) throw error;
        toast.success('Account created! Check your email to confirm, then sign in.');
        setMode('signin');
        setPassword('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 bg-[var(--color-paper-3)] border-[1.5px] border-[var(--color-ink)] text-[var(--color-ink)] text-sm placeholder:text-[var(--color-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-all font-['Inter']";
  const labelCls = "block text-sm font-medium text-[var(--color-ink)] mb-1.5 font-['Inter']";

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col">
      <div className="w-full flex flex-col items-center z-50">
        <Header onStartTour={() => {}} />
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="bg-[var(--color-paper-3)] rounded-none p-8 shadow-[var(--shadow-sheet)]">
            {/* Icon & title */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-[var(--color-paper-2)] rounded-none blur-lg opacity-50" />
                <div className="relative w-12 h-12 bg-[var(--color-paper-2)] rounded-none flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[var(--color-ink)]" />
                </div>
              </div>
              <h1 className="text-xl font-display uppercase text-[var(--color-ink)]">Expert Portal</h1>
              <p className="text-[var(--color-muted)] text-sm mt-1 font-['Inter']">Manage your expert profile</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[var(--color-accent)] text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none rounded-none text-sm font-medium font-['Inter']  transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
                ) : (
                  mode === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <p className="text-center text-xs text-[var(--color-muted)] font-['Inter'] mt-5">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setPassword(''); }}
                className="text-[var(--color-ink)] hover:underline font-medium"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuruLoginForm;
