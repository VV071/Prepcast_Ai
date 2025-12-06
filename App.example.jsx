import React, { useState } from 'react';
import { OnboardingPage } from './components/OnboardingPage';
import { LoginPage } from './components/LoginPage';
import { MainApp } from './components/MainApp';
import { supabase } from './supabaseClient';
import { runCompleteSetup } from './supabaseSetup';
import { MouseReactiveLighting } from './components/3D/MouseReactiveLighting';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(() => {
        // Check if user has seen onboarding before
        const hasSeenOnboarding = localStorage.getItem('prepcast-onboarding-complete');
        return !hasSeenOnboarding;
    });

    // ... rest of your existing code ...

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
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    // Show onboarding if user hasn't seen it
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

    return (
        <ThemeProvider>
            <MouseReactiveLighting>
                <div className="antialiased font-sans text-slate-200">
                    {isAuthenticated ? (
                        <MainApp user={user} onLogout={handleLogout} />
                    ) : (
                        <LoginPage onLogin={handleLogin} />
                    )}
                </div>
            </MouseReactiveLighting>
        </ThemeProvider>
    );
}

export default App;
