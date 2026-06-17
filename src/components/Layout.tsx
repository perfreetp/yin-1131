import { NavLink, useLocation } from 'react-router-dom';
import {
  Package,
  Droplets,
  Flame,
  AlertTriangle,
  PackageOpen,
  Search,
  User,
  Bell,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

const navItems = [
  { path: '/packages', label: '器械包台账', icon: Package },
  { path: '/cleaning', label: '清洗消毒登记', icon: Droplets },
  { path: '/sterilization', label: '灭菌放行', icon: Flame },
  { path: '/exceptions', label: '异常处理', icon: AlertTriangle },
  { path: '/inventory', label: '库存与借还', icon: PackageOpen },
  { path: '/trace', label: '追溯查询', icon: Search },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const currentUser = useAppStore((state) => state.currentUser);
  const pendingExceptions = useAppStore((state) =>
    state.exceptions.filter((e) => e.status === 'pending').length
  );
  const nearExpiryCount = useAppStore((state) => state.getNearExpiryPackages().length);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-neutral-200 bg-white transition-all duration-300',
          sidebarOpen ? 'w-60' : 'w-16'
        )}
      >
        <div className="flex h-16 items-center border-b border-neutral-100 px-4">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-neutral-800">器械追溯系统</h1>
                <p className="text-xs text-neutral-500">口腔门诊版</p>
              </div>
            </div>
          ) : (
            <div className="flex w-full justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white">
                <Package className="h-5 w-5" />
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const showBadge = item.path === '/exceptions' && pendingExceptions > 0;
            const showWarning = item.path === '/inventory' && nearExpiryCount > 0;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-200'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800'
                )}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0')} />
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && showBadge && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1.5 text-xs font-medium text-white">
                    {pendingExceptions}
                  </span>
                )}
                {sidebarOpen && showWarning && !showBadge && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-warning-500" />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-neutral-100 p-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            {sidebarOpen ? (
              <>
                <Menu className="h-5 w-5" />
                <span>收起菜单</span>
              </>
            ) : (
              <div className="flex w-full justify-center">
                <Menu className="h-5 w-5" />
              </div>
            )}
          </button>
        </div>
      </aside>

      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          sidebarOpen ? 'ml-60' : 'ml-16'
        )}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
          <div className="text-lg font-semibold text-neutral-800">
            {navItems.find((item) => item.path === location.pathname)?.label || '首页'}
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 transition-colors">
              <Bell className="h-5 w-5" />
              {(pendingExceptions > 0 || nearExpiryCount > 0) && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500" />
              )}
            </button>
            <div className="flex items-center gap-3 rounded-full bg-neutral-50 px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-neutral-700">{currentUser}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
