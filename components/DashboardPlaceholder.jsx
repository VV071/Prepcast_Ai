import React from 'react';
import { Logo } from './Logo';
import { Button } from './Button';
import { LogOut, LayoutDashboard, Users, FileText, Settings, Bell } from 'lucide-react';

export const DashboardPlaceholder = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-neutral-light flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-neutral-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Logo />
              <div className="hidden md:flex space-x-1">
                <a href="#" className="text-primary px-3 py-2 rounded-md text-sm font-medium bg-primary/5">Dashboard</a>
                <a href="#" className="text-text-secondary hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Operations</a>
                <a href="#" className="text-text-secondary hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Analytics</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-text-secondary hover:text-primary rounded-full hover:bg-neutral-light">
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                JD
              </div>
              <Button variant="ghost" onClick={onLogout} className="text-sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-neutral-dark">Dashboard Overview</h1>
            <p className="text-text-secondary mt-1">Welcome back, Administrator. System status is nominal.</p>
          </div>
          <div className="text-sm text-text-secondary">
            Last updated: Just now
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Active Alerts', value: '12', color: 'text-status-warning', icon: Bell },
            { label: 'System Health', value: '98.5%', color: 'text-status-success', icon: Activity },
            { label: 'Team Members', value: '48', color: 'text-primary', icon: Users },
            { label: 'Reports Generated', value: '1,204', color: 'text-secondary', icon: FileText },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-neutral-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-text-secondary font-medium text-sm">{stat.label}</span>
                <div className={`p-2 rounded-lg bg-neutral-light`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-neutral-dark">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Placeholder Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-border shadow-sm p-6 min-h-[400px]">
            <h3 className="font-semibold text-lg mb-4 text-neutral-dark">Live Map Visualization</h3>
            <div className="w-full h-full bg-neutral-light rounded-lg border-2 border-dashed border-neutral-border flex items-center justify-center text-text-secondary">
              Map Interface Placeholder
            </div>
          </div>
          <div className="bg-white rounded-xl border border-neutral-border shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4 text-neutral-dark">Recent Activity</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-3 pb-4 border-b border-neutral-light last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-text-primary font-medium">System Update v2.{i}.0 deployed</p>
                    <p className="text-xs text-text-secondary">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Activity icon helper for the stats
function Activity(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}