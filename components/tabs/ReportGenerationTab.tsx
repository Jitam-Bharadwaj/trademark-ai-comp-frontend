'use client';

import { useState, useEffect, useMemo } from 'react';
import { getReports, downloadReport, Report } from '@/lib/api';

interface GroupedReports {
  [key: string]: Report[];
}

export default function ReportGenerationTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchReports = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setError(null);
      }
      const data = await getReports();
      // Sort reports by Monday date (newest first)
      const sortedReports = (data.reports || []).sort((a, b) => {
        return new Date(b.monday_date).getTime() - new Date(a.monday_date).getTime();
      });
      setReports(sortedReports);
    } catch (err: any) {
      // Only show error on initial load, not on background polls
      if (isInitialLoad) {
        setError(err.message || 'Failed to fetch reports');
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Fetch reports on mount (covers login success case)
    fetchReports(true);

    // Poll every 5 minutes (300000 milliseconds) in the background
    const pollInterval = setInterval(() => {
      fetchReports(false); // Background poll, don't show loading
    }, 5 * 60 * 1000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const handleDownload = async (reportId: string, filename: string) => {
    setDownloadingId(reportId);
    try {
      const blob = await downloadReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to download report');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatMonthYear = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getWeekRange = (mondayDate: string) => {
    try {
      const monday = new Date(mondayDate);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const formatDay = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };
      
      return `${formatDay(monday)} - ${formatDay(sunday)}`;
    } catch {
      return formatDate(mondayDate);
    }
  };

  // Group reports by month and year
  const groupedReports = useMemo(() => {
    const grouped: GroupedReports = {};
    reports.forEach((report) => {
      const date = new Date(report.monday_date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(report);
    });
    return grouped;
  }, [reports]);

  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedReports).sort((a, b) => {
      return b.localeCompare(a); // Newest first
    });
  }, [groupedReports]);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Weekly Reports</h2>
            <p className="text-gray-600">
              Reports generated every Monday for uploaded trademark journals
            </p>
          </div>
          {!loading && reports.length > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{reports.length}</div>
              <div className="text-sm text-gray-500">Total Reports</div>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-bold">Error:</span>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800 font-bold text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-600 font-medium">Loading weekly reports...</div>
        </div>
      )}

      {/* Reports List - Grouped by Month */}
      {!loading && reports.length > 0 && (
        <div className="space-y-8">
          {sortedGroupKeys.map((groupKey) => {
            const monthReports = groupedReports[groupKey];
            const firstReport = monthReports[0];
            const monthYear = formatMonthYear(firstReport.monday_date);

            return (
              <div key={groupKey} className="space-y-4">
                {/* Month Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-600"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <h3 className="text-lg font-bold text-gray-900">{monthYear}</h3>
                    <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded">
                      {monthReports.length} {monthReports.length === 1 ? 'report' : 'reports'}
                    </span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                </div>

                {/* Reports Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {monthReports.map((report) => (
                    <div
                      key={report.report_id}
                      className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-300"
                    >
                      {/* Card Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                Week of
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-1">
                              {formatDate(report.monday_date)}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {getWeekRange(report.monday_date)}
                            </p>
                          </div>
                          <div className="ml-4 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-blue-600"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5">
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Generated on</span>
                            <span className="font-medium text-gray-900">
                              {formatDate(report.report_date)} at {formatTime(report.report_date)}
                            </span>
                          </div>
                          <div className="pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-mono">{report.report_id}</span>
                            </div>
                          </div>
                        </div>

                        {/* Download Button */}
                        <button
                          onClick={() => handleDownload(report.report_id, report.pdf_filename)}
                          disabled={downloadingId === report.report_id}
                          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group-hover:shadow-lg"
                        >
                          {downloadingId === report.report_id ? (
                            <>
                              <svg
                                className="animate-spin h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span>Downloading...</span>
                            </>
                          ) : (
                            <>
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                              <span>Download Report PDF</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && reports.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-4">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-blue-500"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Reports Available</h3>
          <p className="text-gray-600 mb-1">
            Weekly reports will appear here once they are generated
          </p>
          <p className="text-sm text-gray-500">
            Reports are automatically created every Monday
          </p>
        </div>
      )}
    </div>
  );
}
