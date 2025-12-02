'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import ImageSearchTab from './tabs/ImageSearchTab';
import PDFProcessingTab from './tabs/PDFProcessingTab';
import TrademarkDetailsTab from './tabs/TrademarkDetailsTab';

type Tab = 'search' | 'pdf' | 'trademark';

export default function MainApp() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('search');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'search', label: 'Image Search', icon: '🔍' },
    { id: 'pdf', label: 'PDF Processing', icon: '📄' },
    { id: 'trademark', label: 'Trademark Details', icon: '🏷️' },
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Decorative Background Images - Reduced Opacity */}
      {/* Top Left - Large green/yellow decorative shape */}
      <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 opacity-10 z-0">
        <Image
          src="/click_7756322.png"
          alt=""
          width={500}
          height={500}
          className="object-contain mix-blend-multiply"
          priority
          unoptimized
        />
      </div>

      {/* Top Right - Decorative shape */}
      <div className="absolute top-10 right-10 translate-x-1/4 -translate-y-1/4 opacity-8 z-0">
        <Image
          src="/random_7756321.png"
          alt=""
          width={320}
          height={320}
          className="object-contain mix-blend-multiply"
          priority
          unoptimized
        />
      </div>

      {/* Bottom Left - Decorative shape */}
      <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 opacity-10 z-0">
        <Image
          src="/sync_7756318.png"
          alt=""
          width={350}
          height={350}
          className="object-contain mix-blend-multiply"
          priority
          unoptimized
        />
      </div>

      {/* Bottom Right - Pink/Red decorative shape */}
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 opacity-12 z-0">
        <Image
          src="/ejecting_7756324.png"
          alt=""
          width={450}
          height={450}
          className="object-contain mix-blend-multiply"
          priority
          unoptimized
        />
      </div>

      {/* Center Left - Decorative element */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 -translate-x-1/4 opacity-6 z-0">
        <Image
          src="/up-down_7756199.png"
          alt=""
          width={200}
          height={200}
          className="object-contain mix-blend-multiply"
          priority
          unoptimized
        />
      </div>

      {/* Center Right - Decorative element */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-6 z-0">
        <Image
          src="/back_7756323.png"
          alt=""
          width={220}
          height={220}
          className="object-contain mix-blend-multiply"
          priority
          unoptimized
        />
      </div>

      {/* Additional decorative elements for depth */}
      <div className="absolute top-1/3 left-1/4 opacity-5 z-0">
        <Image
          src="/eject_7756326.png"
          alt=""
          width={180}
          height={180}
          className="object-contain mix-blend-multiply"
          priority
          unoptimized
        />
      </div>

      <div className="absolute bottom-1/3 right-1/4 opacity-5 z-0">
        <Image
          src="/maximize_7756320.png"
          alt=""
          width={160}
          height={160}
          className="object-contain mix-blend-multiply"
          priority
          unoptimized
        />
      </div>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Trademark Comparison</h1>
                <p className="text-sm text-gray-600">AI-powered similarity search & processing</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user?.user && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900">{user.user.email}</div>
                    <div className="text-xs text-gray-600 capitalize">{user.user.role}</div>
                  </div>
                </div>
              )}
              <button
                onClick={logout}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        {/* Tab Navigation */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden relative z-10">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-5 font-semibold text-sm transition-all relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden relative z-10">
          <div className="p-10">
            {activeTab === 'search' && <ImageSearchTab />}
            {activeTab === 'pdf' && <PDFProcessingTab />}
            {activeTab === 'trademark' && <TrademarkDetailsTab />}
          </div>
        </div>
      </main>
    </div>
  );
}
