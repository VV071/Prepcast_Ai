import React, { useState } from 'react';
import { Mail, Lock, Check, ArrowRight, Activity, BarChart3, Globe, User, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../supabaseClient';
import { Card3D } from './3D/Card3D';
import { Button3D } from './3D/Button3D';
import { Input3D } from './3D/Input3D';
import { FloatingElement, PageTransition } from './MotionWrapper';
import { motion } from 'framer-motion';

export const LoginPage = ({ onLogin, initialMode = 'signin' }) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setErrors({});
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
      name: prev.name || '',
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (mode === 'signup') {
      if (!formData.name?.trim()) newErrors.name = 'Full name is required';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (mode === 'verify-otp') {
      if (!formData.otp || formData.otp.length !== 6) newErrors.otp = 'Please enter a valid 6-digit code';
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
          const { error: usersError } = await supabase
            .from('users')
            .insert([{
              id: authData.user.id,
              full_name: formData.name,
              email: formData.email,
            }]);

          if (usersError) throw usersError;

          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([{
              id: authData.user.id,
              full_name: formData.name,
              preferences: { theme: 'dark', notifications: true, language: 'en' }
            }]);

          if (profileError) console.error('Profile creation failed:', profileError);

          alert('Account created successfully! Please sign in.');
          toggleMode();
        }
      } else if (mode === 'signin') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;
        onLogin();
      } else if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email);
        if (error) throw error;
        alert('Verification code sent to your email!');
        setMode('verify-otp');
      } else if (mode === 'verify-otp') {
        const { error } = await supabase.auth.verifyOtp({
          email: formData.email,
          token: formData.otp,
          type: 'recovery',
        });
        if (error) throw error;
        setMode('reset-password');
      } else if (mode === 'reset-password') {
        const { error } = await supabase.auth.updateUser({
          password: formData.password
        });
        if (error) throw error;
        alert('Password updated successfully! Please sign in with your new password.');
        setMode('signin');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors(prev => ({ ...prev, form: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen flex w-full">
      {/* Background with layered parallax */}
      <div className="fixed inset-0 -z-10 overflow-hidden perspective-xl bg-bg-0">
        <FloatingElement duration={15} yOffset={30} className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-aura-violet/20 to-transparent blur-[120px]" />
        <FloatingElement duration={20} yOffset={-40} className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-aura-teal/10 to-transparent blur-[120px]" />
        <FloatingElement duration={25} yOffset={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] rounded-full bg-gradient-to-br from-aura-pink/10 to-transparent blur-[120px]" />
      </div>

      {/* Left Column - Hero/Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 z-10">
        <div className="relative">
          <FloatingElement duration={6} yOffset={10}>
            <Logo variant="light" className="mb-16 scale-125 origin-left" />
          </FloatingElement>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-7xl font-black leading-none mb-8 tracking-tighter uppercase italic">
              <span className="aura-text-gradient">Intelligent</span><br />
              <span className="text-white opacity-90">Preparedness</span><br />
              <span className="text-white/50">for Tomorrow</span>
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mb-16 font-light">
              Next-generation analytics, predictive modeling, and comprehensive risk management designed for government and enterprise scale.
            </p>
          </motion.div>

          <div className="space-y-6 perspective-md transform-3d">
            {[
              { icon: Activity, title: "Real-time Monitoring", desc: "Live data streams with instant alerts", delay: 0.3 },
              { icon: BarChart3, title: "Predictive Analytics", desc: "AI-driven forecasting and insights", delay: 0.4 },
              { icon: Globe, title: "Global Coverage", desc: "Worldwide situational awareness", delay: 0.5 }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30, rotateY: -10 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ delay: item.delay, duration: 0.5 }}
              >
                <Card3D
                  elevation={2}
                  glassType="light"
                  enableTilt={true}
                  padding="md"
                  className="group"
                >
                  <div className="flex items-center gap-6">
                    <div className="p-4 aura-gradient-violet rounded-2xl text-white shadow-aura-violet elevation-2">
                      <item.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-xl mb-1 uppercase tracking-tighter">{item.title}</h3>
                      <p className="text-sm text-slate-400 font-medium">{item.desc}</p>
                    </div>
                  </div>
                </Card3D>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-500 font-medium">
          © 2024 PrepCast AI. All rights reserved.
        </div>
      </div>

      {/* Right Column - Login/Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card3D
            elevation={4}
            glassType="strong"
            enableTilt={true}
            padding="xl"
          >
            <div className="mb-8">
              <div className="lg:hidden flex justify-center mb-6">
                <Logo variant="light" />
              </div>
              <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">
                {mode === 'signin' ? 'Welcome Back' :
                  mode === 'signup' ? 'Create Account' :
                    mode === 'forgot-password' ? 'Reset Access' : 'New Password'}
              </h2>
              <p className="text-slate-400">
                {mode === 'signin' ? 'Enter your credentials to access the dashboard.' :
                  mode === 'signup' ? 'Enter your details to request access.' :
                    mode === 'verify-otp' ? 'Enter the 6-digit code sent to your email.' :
                      mode === 'forgot-password' ? 'Enter your email to receive a recovery code.' : 'Create a strong new password for your account.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <Input3D
                  label="Full Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jane Doe"
                  leftIcon={<User className="w-5 h-5" />}
                  error={errors.name}
                />
              )}

              {(mode === 'signin' || mode === 'signup' || mode === 'forgot-password') && (
                <Input3D
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@organization.com"
                  leftIcon={<Mail className="w-5 h-5" />}
                  error={errors.email}
                />
              )}

              {(mode === 'signin' || mode === 'signup' || mode === 'reset-password') && (
                <Input3D
                  label={mode === 'reset-password' ? "New Password" : "Password"}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-5 h-5" />}
                  error={errors.password}
                />
              )}

              {(mode === 'signup' || mode === 'reset-password') && (
                <Input3D
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-5 h-5" />}
                  error={errors.confirmPassword}
                />
              )}

              {mode === 'verify-otp' && (
                <Input3D
                  label="Verification Code"
                  type="text"
                  maxLength={6}
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                  placeholder="123456"
                  leftIcon={<Check className="w-5 h-5" />}
                  error={errors.otp}
                />
              )}
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
                      <div className={`w-5 h-5 border rounded transition-all duration-300 flex items-center justify-center ${formData.rememberMe ? 'aura-gradient-violet border-aura-violet shadow-aura-violet' : 'border-slate-600 glass-light'}`}>
                        {formData.rememberMe && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-sm font-black text-aura-teal hover:text-white transition-all uppercase tracking-widest"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {errors.form && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl glass-light border border-red-500/30 text-red-400 text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.form}
                </motion.div>
              )}

              <Button3D
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                fullWidth
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="mt-6"
              >
                {mode === 'signin' ? 'Sign In' :
                  mode === 'signup' ? 'Create Account' :
                    mode === 'verify-otp' ? 'Verify Code' :
                      mode === 'forgot-password' ? 'Send Reset Code' : 'Update Password'}
              </Button3D>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-slate-400">
                {mode === 'signin' ? "Don't have an account?" :
                  mode === 'signup' ? "Already have an account?" : "Remembered your password?"}{' '}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signup' ? 'signin' : 'signin')}
                  className="font-black text-aura-teal hover:text-white transition-all uppercase tracking-widest"
                >
                  {mode === 'signin' ? 'Create Account' : 'Sign In'}
                </button>
              </p>
            </div>
          </Card3D>
        </motion.div>
      </div>
    </PageTransition>
  );
};