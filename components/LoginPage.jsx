import React, { useState } from 'react';
import { Mail, Lock, Check, ArrowRight, Activity, BarChart3, Globe, User, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../supabaseClient';
import { Card3D } from './3D/Card3D';
import { Button3D } from './3D/Button3D';
import { Input3D } from './3D/Input3D';
import { FloatingElement, PageTransition } from './MotionWrapper';
import { motion } from 'framer-motion';

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
    <PageTransition className="min-h-screen flex w-full">
      {/* Background with layered parallax */}
      <div className="fixed inset-0 -z-10 overflow-hidden perspective-xl">
        <FloatingElement duration={15} yOffset={30} className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-600/20 to-blue-400/10 blur-3xl" />
        <FloatingElement duration={20} yOffset={-40} className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-purple-600/20 to-purple-400/10 blur-3xl" />
        <FloatingElement duration={25} yOffset={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-gradient-to-br from-cyan-600/10 to-cyan-400/5 blur-3xl" />
      </div>

      {/* Left Column - Hero/Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 text-white z-10">
        <div className="relative">
          <FloatingElement duration={6} yOffset={10}>
            <Logo variant="light" className="mb-16 scale-125 origin-left" />
          </FloatingElement>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-7xl font-bold leading-tight mb-8 tracking-tight">
              <span className="text-gradient-primary">Intelligent</span><br />
              <span className="text-gradient-accent">Preparedness</span><br />
              <span className="text-white">for Tomorrow</span>
            </h1>

            <p className="text-xl text-slate-300 leading-relaxed max-w-lg mb-16 font-light">
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
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl text-blue-300 elevation-1">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-400">{item.desc}</p>
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
              <h2 className="text-h2 text-white mb-3 tracking-tight">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-slate-400">
                {mode === 'signin'
                  ? 'Enter your credentials to access the dashboard.'
                  : 'Enter your details to request access.'}
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

              <Input3D
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@organization.com"
                leftIcon={<Mail className="w-5 h-5" />}
                error={errors.email}
              />

              <Input3D
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                leftIcon={<Lock className="w-5 h-5" />}
                error={errors.password}
              />

              {mode === 'signup' && (
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
                      <div className={`w-5 h-5 border rounded transition-all duration-300 flex items-center justify-center ${formData.rememberMe ? 'bg-blue-600 border-blue-600 elevation-1' : 'border-slate-600 glass-light'}`}>
                        {formData.rememberMe && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                    Forgot Password?
                  </a>
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
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button3D>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-slate-400">
                {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                  onClick={toggleMode}
                  className="font-semibold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none"
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