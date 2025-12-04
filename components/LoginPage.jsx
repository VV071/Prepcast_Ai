import React, { useState } from 'react';
import { Mail, Lock, Check, ArrowRight, Activity, BarChart3, Globe, User, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';
import { Input } from './Input';
import { Button } from './Button';
import { supabase } from '../supabaseClient';

export const LoginPage = ({ onLogin }) => {
  const [mode, setMode] = useState('signin');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setErrors({});
    // Reset non-shared fields for cleaner experience, but keep email if typed
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
      name: prev.name || '',
    }));
  };

  const validate = () => {
    const newErrors = {};

    // Common validation
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    // Signup specific validation
    if (mode === 'signup') {
      if (!formData.name?.trim()) newErrors.name = 'Full name is required';

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (mode === 'signup') {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // Create entry in users table
          const { error: usersError } = await supabase
            .from('users')
            .insert([
              {
                id: authData.user.id,
                full_name: formData.name,
                email: formData.email,
              },
            ]);

          if (usersError) throw usersError;

          // Create entry in user_profiles table
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([
              {
                id: authData.user.id,
                full_name: formData.name,
                preferences: {
                  theme: 'dark',
                  notifications: true,
                  language: 'en'
                }
              },
            ]);

          if (profileError) {
            console.error('Profile creation failed:', profileError);
            // Don't throw - user account is created, profile can be created later
          }

          alert('Account created successfully! Please sign in.');
          toggleMode();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        onLogin();
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors(prev => ({ ...prev, form: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-neutral-light">

      {/* Left Column - Hero/Brand (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-dark opacity-90"></div>

        <div className="relative z-10 w-full flex flex-col justify-between p-12 text-white">
          <Logo variant="light" />

          <div className="space-y-8 max-w-lg">
            <h1 className="text-4xl font-bold leading-tight">
              {mode === 'signin'
                ? 'Intelligent Preparedness for the Modern Era'
                : 'Join the Future of Risk Management'}
            </h1>
            <p className="text-lg text-blue-100 leading-relaxed">
              Access real-time analytics, predictive modeling, and comprehensive risk management tools designed for government and enterprise scale.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="p-2 bg-secondary rounded-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Real-time Monitoring</h3>
                  <p className="text-sm text-blue-200">Live data streams & alerts</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="p-2 bg-secondary rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Predictive Analytics</h3>
                  <p className="text-sm text-blue-200">AI-driven forecasting models</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="p-2 bg-secondary rounded-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Global Coverage</h3>
                  <p className="text-sm text-blue-200">Worldwide situational awareness</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-blue-200">
            © 2024 PrepCast AI. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Column - Login/Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 xl:p-24 bg-neutral-light min-h-screen lg:min-h-0 overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-border p-8 sm:p-10 transition-all duration-300">

          <div className="mb-8 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <Logo />
            </div>
            <h2 className="text-3xl font-bold text-neutral-dark mb-2">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-text-secondary">
              {mode === 'signin'
                ? 'Please enter your credentials to access the dashboard.'
                : 'Enter your details below to request access to the platform.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name Field - Signup Only */}
            {mode === 'signup' && (
              <Input
                label="Full Name"
                type="text"
                placeholder="Jane Doe"
                icon={<User className="w-5 h-5" />}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                autoFocus
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@organization.com"
              icon={<Mail className="w-5 h-5" />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
            />

            {/* Confirm Password - Signup Only */}
            {mode === 'signup' && (
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5" />}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
              />
            )}

            {/* Remember Me / Forgot Password - Signin Only */}
            {mode === 'signin' && (
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    />
                    <div className={`
                      w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center
                      ${formData.rememberMe ? 'bg-primary border-primary' : 'border-neutral-border bg-white group-hover:border-primary'}
                    `}>
                      <Check className={`w-3.5 h-3.5 text-white transform transition-transform ${formData.rememberMe ? 'scale-100' : 'scale-0'}`} />
                    </div>
                  </div>
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Remember me</span>
                </label>

                <a href="#" className="text-sm font-medium text-text-link hover:text-primary-dark transition-colors">
                  Forgot Password?
                </a>
              </div>
            )}

            {/* Terms check for Signup - Optional Visual */}
            {mode === 'signup' && (
              <div className="text-xs text-text-secondary pt-2">
                By clicking Create Account, you agree to our <a href="#" className="text-text-link hover:underline">Terms of Service</a> and <a href="#" className="text-text-link hover:underline">Privacy Policy</a>.
              </div>
            )}

            {errors.form && (
              <div className="p-3 rounded-lg bg-status-error/10 text-status-error text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.form}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              className="mt-4"
            >
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-border text-center">
            <p className="text-sm text-text-secondary">
              {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={toggleMode}
                className="font-semibold text-text-link hover:text-primary-dark transition-colors focus:outline-none"
              >
                {mode === 'signin' ? 'Create Account' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};