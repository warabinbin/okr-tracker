import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDb } from './shared/hooks';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ObjectivesPage } from './features/objectives/ObjectivesPage';
import { RetroPage } from './features/retro/RetroPage';
import { RitualPage } from './features/ritual/RitualPage';
import { SettingsPage } from './features/settings/SettingsPage';

const navItems = [
  { to: '/', label: 'ホーム', icon: '🏠' },
  { to: '/objectives', label: '目標', icon: '🎯' },
  { to: '/retro', label: 'レトロ', icon: '📊' },
  { to: '/ritual', label: '儀式', icon: '✨' },
  { to: '/settings', label: '設定', icon: '⚙️' },
];

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function AppShell() {
  useDb();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-gray-900 tracking-tight">OKR Tracker</span>
          <span className="text-xs text-gray-400 font-mono">個人成長トラッカー</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<PageTransition><DashboardPage /></PageTransition>} />
            <Route path="/objectives" element={<PageTransition><ObjectivesPage /></PageTransition>} />
            <Route path="/retro" element={<PageTransition><RetroPage /></PageTransition>} />
            <Route path="/ritual" element={<PageTransition><RitualPage /></PageTransition>} />
            <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100"
        aria-label="メインナビゲーション"
      >
        <div className="max-w-2xl mx-auto flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors focus:outline-none focus:bg-blue-50 ${
                  isActive ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <span className="text-lg font-mono leading-none" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
