import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { MainApp } from './components/MainApp';
import { OnboardingPage } from './components/OnboardingPage';
import { supabase } from './supabaseClient';
import { runCompleteSetup } from './supabaseSetup';
import { MouseReactiveLighting } from './components/3D/MouseReactiveLighting';
import { ThemeProvider } from './contexts/ThemeContext';
import { WavyBarLoaderFullPage } from './components/WavyBarLoader';
// DEMO MODE: Showing histogram feature
import { HistogramDemo } from './components/HistogramDemo';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const hasSeenOnboarding = localStorage.getItem('prepcast-onboarding-complete');
    return !hasSeenOnboarding;
  });

  // Demo mode disabled - showing full integrated application
  const showHistogramDemo = false;


  useEffect(() => {
    // Check for existing session
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);

      if (event === 'PASSWORD_RECOVERY') {
        setIsAuthenticated(false);
        setUser(null);
        setIsRecovering(true);
      } else {
        setIsAuthenticated(!!session);
        setUser(session?.user || null);
        if (event === 'SIGNED_IN') setIsRecovering(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // FIX: Vercel deployment appears "too big" compared to localhost.
    // Localhost uses CDN (16px base?), but production build needs a smaller base.
    // We apply this ONLY in production to avoid affecting the "perfect" localhost state.
    if (import.meta.env.PROD) {
      document.documentElement.style.fontSize = '14px';
    }
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setUser(session?.user || null);

      // Run Supabase setup verification when user is authenticated
      if (session?.user) {
        console.log('🔧 Running Supabase setup verification...');
        runCompleteSetup(session.user.id).catch(err => {
          console.error('Setup verification error:', err);
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    checkAuth();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('prepcast-onboarding-complete', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('prepcast-onboarding-complete', 'true');
    setShowOnboarding(false);
  };


  if (loading) {
    return (
      <ThemeProvider>
        <MouseReactiveLighting>
          <WavyBarLoaderFullPage
            activeColor="#BF00FF"
            inactiveColor="rgba(191, 0, 255, 0.1)"
            message="Scribing Crystal Matrix..."
          />
        </MouseReactiveLighting>
      </ThemeProvider>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding && !isAuthenticated) {
    return (
      <ThemeProvider>
        <MouseReactiveLighting>
          <OnboardingPage
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        </MouseReactiveLighting>
      </ThemeProvider>
    );
  }

  // DEMO MODE: Show histogram demo
  if (showHistogramDemo) {
    return (
      <ThemeProvider>
        <MouseReactiveLighting>
          <HistogramDemo />
        </MouseReactiveLighting>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <MouseReactiveLighting>
        <div className="antialiased font-sans text-slate-200">
          {isAuthenticated ? (
            <MainApp user={user} onLogout={handleLogout} />
          ) : (
            <LoginPage
              onLogin={handleLogin}
              initialMode={isRecovering ? 'reset-password' : 'signin'}
            />
          )}
        </div>
      </MouseReactiveLighting>
    </ThemeProvider>
  );
}

export default App;