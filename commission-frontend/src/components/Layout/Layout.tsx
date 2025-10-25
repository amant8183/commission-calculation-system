import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  ShoppingCartIcon,
  DocumentChartBarIcon,
  ArrowUturnLeftIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Agent Management', href: '/agents', icon: UsersIcon },
  { name: 'Sales Management', href: '/sales', icon: ShoppingCartIcon },
  { name: 'Commission Reports', href: '/reports', icon: DocumentChartBarIcon },
  { name: 'Clawback Management', href: '/clawbacks', icon: ArrowUturnLeftIcon },
];

const generalNavigation = [
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-[#1a1a1a] transform transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5">
            <h1 className="text-xl font-bold text-white">Commission System</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Mobile Navigation */}
          <div className="flex-1 px-4 py-4">
            <div className="mb-6">
              <h2 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">MENU</h2>
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* General Section */}
            <div>
              <h2 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">GENERAL</h2>
              <nav className="space-y-1">
                {generalNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
                <button
                  className="w-full group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
                >
                  <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                  Log out
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-[#1a1a1a] overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-6 py-6">
            <h1 className="text-2xl font-bold text-white">Commission <span className="text-blue-500">System</span></h1>
          </div>
          
          <div className="flex-1 px-4 py-2">
            {/* MENU Section */}
            <div className="mb-8">
              <h2 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">MENU</h2>
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* GENERAL Section */}
            <div>
              <h2 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">GENERAL</h2>
              <nav className="space-y-1">
                {generalNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
                <button
                  className="w-full group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
                  onClick={() => alert('Logout functionality')}
                >
                  <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                  Log out
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar for mobile */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Commission System</h1>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
