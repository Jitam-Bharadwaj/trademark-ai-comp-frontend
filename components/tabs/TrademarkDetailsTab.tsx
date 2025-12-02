'use client';

import { useState } from 'react';
import { getTrademarkDetails } from '@/lib/api';

export default function TrademarkDetailsTab() {
  const [trademarkId, setTrademarkId] = useState('');
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trademarkId.trim()) {
      setError('Please enter a trademark ID');
      return;
    }

    setLoading(true);
    setError(null);
    setDetails(null);

    try {
      const data = await getTrademarkDetails(trademarkId.trim());
      setDetails(data);
    } catch (err: any) {
      setError(err.message || 'Failed to get trademark details');
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Trademark Details</h2>
        <p className="text-gray-600 text-base">View detailed information about a specific trademark</p>
      </div>

      {/* Search Form */}
      <div className="space-y-6">
        <form onSubmit={handleGetDetails} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Trademark ID <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={trademarkId}
                onChange={(e) => setTrademarkId(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter trademark ID (e.g., uuid-1234-5678)"
              />
              <button
                type="submit"
                disabled={loading || !trademarkId.trim()}
                className="px-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Details Card */}
        {details && (
          <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Trademark Information</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Trademark ID
                  </div>
                  <div className="font-mono text-sm bg-gray-100 px-3 py-2 rounded border border-gray-200">
                    {details.trademark_id}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Name
                  </div>
                  <div className="text-sm font-medium text-gray-900">{details.name || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Class
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {details.trademark_class || 'N/A'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Source
                  </div>
                  <div className="text-sm font-medium text-gray-900">{details.source || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Original Filename
                  </div>
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {details.original_filename || 'N/A'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Created At
                  </div>
                  <div className="text-sm font-medium text-gray-900">{details.created_at || 'N/A'}</div>
                </div>
              </div>

              {details.metadata && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Full Metadata
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(details.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!details && !loading && !error && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-gray-400 mb-2">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="mx-auto"
              >
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                <line x1="16" y1="8" x2="2" y2="22"></line>
                <line x1="17.5" y1="15" x2="9" y2="15"></line>
              </svg>
            </div>
            <div className="text-gray-600 font-medium">Enter a trademark ID to view details</div>
          </div>
        )}
      </div>
    </div>
  );
}
