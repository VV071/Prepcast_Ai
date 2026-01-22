import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useTheme } from '../contexts/ThemeContext';

export const OnboardingTutorial = ({ children, run = true }) => {
    const [runTour, setRunTour] = useState(false);
    const { theme } = useTheme(); // Assuming we might want to style based on theme

    const steps = [
        {
            target: 'body',
            content: (
                <div className="text-center p-2">
                    <h3 className="text-lg font-bold mb-2 text-slate-900">Welcome to PrepCast-AI</h3>
                    <p className="text-sm text-slate-600">
                        We help you clean messy data safely — without guessing values.
                        Let's take a quick tour.
                    </p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '#upload-area',
            content: (
                <div>
                    <h4 className="font-bold mb-1 text-slate-900">Upload Your Data</h4>
                    <p className="text-sm text-slate-600">
                        Upload any CSV or Excel file here. Surveys, logs, or financial data.
                    </p>
                </div>
            ),
        },
        {
            target: '#schema-section',
            content: (
                <div>
                    <h4 className="font-bold mb-1 text-slate-900">AI Analysis</h4>
                    <p className="text-sm text-slate-600">
                        Our AI scans your data to understand its structure and detect the domain (e.g., Healthcare, Finance).
                        Nothing is changed yet.
                    </p>
                </div>
            ),
        },
        {
            target: '#trust-badge',
            content: (
                <div>
                    <h4 className="font-bold mb-1 text-slate-900">Trust Score</h4>
                    <p className="text-sm text-slate-600">
                        See at a glance how consistent your data looks compared to standard public rules.
                    </p>
                </div>
            ),
        },
        {
            target: '#pdae-panel', // Will be conditionally present
            content: (
                <div>
                    <h4 className="font-bold mb-1 text-slate-900">Validation Insights</h4>
                    <p className="text-sm text-slate-600">
                        We flag values that look "impossible" or "unlikely" based on real-world logic.
                        <br /><strong>You always decide what happens.</strong>
                    </p>
                </div>
            ),
        },
        {
            target: 'body',
            content: (
                <div className="text-center p-2">
                    <h3 className="text-lg font-bold mb-2 text-slate-900">You Are In Control</h3>
                    <p className="text-sm text-slate-600">
                        No guessing. No hidden changes. Use the "Export" button when you're ready.
                    </p>
                </div>
            ),
            placement: 'center',
        }
    ];

    useEffect(() => {
        // Check local storage to see if tutorial has run
        const hasSeenTutorial = localStorage.getItem('prepcast_tutorial_complete');
        if (!hasSeenTutorial && run) {
            setRunTour(true);
        }
    }, [run]);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRunTour(false);
            localStorage.setItem('prepcast_tutorial_complete', 'true');
        }
    };

    return (
        <>
            <Joyride
                steps={steps}
                run={runTour}
                continuous
                showSkipButton
                showProgress
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        primaryColor: '#3b82f6',
                        textColor: '#0f172a',
                        backgroundColor: '#ffffff',
                        arrowColor: '#ffffff',
                    },
                    tooltipContainer: {
                        textAlign: 'left',
                    },
                    buttonNext: {
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600'
                    },
                    buttonBack: {
                        color: '#64748b',
                        marginRight: '10px'
                    }
                }}
            />
            {children}
        </>
    );
};
