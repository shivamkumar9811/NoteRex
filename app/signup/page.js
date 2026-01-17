'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();
  const { signup, signInWithGoogle, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrors({ email: '', password: '' });
    
    // Validation
    let hasErrors = false;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Email is required';
      hasErrors = true;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
      hasErrors = true;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      hasErrors = true;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSuccess(false);
    
    try {
      const result = await signup(email, password);
      
      if (result.success) {
        setSuccess(true);
        toast.success('Account created successfully!');
        // Smooth transition before redirect
        await new Promise(resolve => setTimeout(resolve, 500));
        router.push('/dashboard');
      } else {
        setErrors({ 
          email: result.error?.includes('email') || result.error?.includes('User already') ? result.error : '',
          password: result.error?.includes('password') ? result.error : result.error?.includes('User already') ? '' : result.error || 'Signup failed'
        });
        toast.error(result.error || 'Signup failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrors({ email: '', password: '' });
    
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        toast.error(result.error || 'Google sign-in failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-purple-950 to-black opacity-90"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black"></div>
      
      {/* Animated Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Top Text */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-6 md:mb-8 space-y-3 md:space-y-4 px-2"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            Transform Your Study Experience
          </h1>
          <p className="text-base sm:text-lg text-gray-300 max-w-xl mx-auto leading-relaxed px-2">
            Upload videos or notes and let AI create personalized study materials tailored just for you.
          </p>
        </motion.div>

        {/* Signup Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          <Card className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-6 sm:p-8 space-y-5 sm:space-y-6">
              {/* 1. Heading */}
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Create your account</h2>
              </div>

              {/* 2. Sign in with Google Button */}
              <Button
                variant="outline"
                className="w-full bg-white/5 border-purple-500/30 hover:bg-white/10 hover:border-purple-400/50 text-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>

              {/* 3. Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="bg-purple-500/30" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gradient-to-br from-purple-950/50 to-black px-4 text-gray-400">
                    or continue with email
                  </span>
                </div>
              </div>

              {/* 4. Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 text-sm sm:text-base">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-3 w-5 h-5 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    disabled={isSubmitting || isGoogleLoading}
                    className={`pl-10 bg-black/30 text-white placeholder:text-gray-500 focus:ring-purple-400/20 transition-all ${
                      errors.email 
                        ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20' 
                        : success
                        ? 'border-green-500/50 focus:border-green-400'
                        : 'border-purple-500/30 focus:border-purple-400'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                </div>
                {errors.email && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-sm text-red-400 mt-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.email}</span>
                  </motion.div>
                )}
              </div>

              {/* 5. Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 text-sm sm:text-base">
                  Password
                </Label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-3 w-5 h-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password (min. 6 characters)"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    disabled={isSubmitting || isGoogleLoading}
                    className={`pl-10 pr-10 bg-black/30 text-white placeholder:text-gray-500 focus:ring-purple-400/20 transition-all ${
                      errors.password 
                        ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20' 
                        : success
                        ? 'border-green-500/50 focus:border-green-400'
                        : 'border-purple-500/30 focus:border-purple-400'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting || isGoogleLoading}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-sm text-red-400 mt-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password}</span>
                  </motion.div>
                )}
              </div>

              {/* 6. Create Account Button */}
              <form onSubmit={handleSignup}>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-purple-500/30"
                  disabled={isSubmitting || isGoogleLoading}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      <span>Success!</span>
                    </>
                  ) : (
                    'Create account'
                  )}
                </Button>
              </form>

              {/* 7. Footer Text */}
              <div className="text-center text-xs sm:text-sm text-gray-400 pt-2">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-purple-400 hover:text-purple-300 transition-colors font-medium hover:underline"
                >
                  Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
