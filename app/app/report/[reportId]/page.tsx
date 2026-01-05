'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getReportData } from '@/lib/api';

interface SimilarTrademark {
  mark: string;
  similarity_score: number;
  vector_similarity_score?: number;
  text_similarity_score?: number;
  trademark_class?: string;
  applicant_name?: string;
  application_no?: string;
  image_path?: string;
  trademark_type?: 'image_based' | 'text_only';
}

interface JournalTrademarkEntry {
  trademark_type: 'image_based' | 'text_only';
  mark_name?: string;
  mark?: string;
  trademark_class?: string;
  applicant_name?: string;
  application_no?: string;
  pdf_source?: string;
  page_number?: number;
  image_path?: string;
  similar_trademarks?: SimilarTrademark[];
  similar_trademark?: SimilarTrademark[];
  similarities?: SimilarTrademark[];
  matches?: SimilarTrademark[];
}

interface ReportSummary {
  total_journal_trademarks: number;
  total_image_based: number;
  total_text_only: number;
  total_self_db_trademarks: number;
  total_similarities_found: number;
  trademarks_with_similarities: number;
  similarity_threshold_used: number;
  highest_similarity_score: number;
  average_similarity_score: number;
}

interface ReportData {
  report_id: string;
  monday_date: string;
  report_date: string;
  summary?: ReportSummary;
  entries_with_similarities?: JournalTrademarkEntry[];
  entries?: JournalTrademarkEntry[];
  journal_entries?: JournalTrademarkEntry[];
}

export default function ReportDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());
  const [applicantFilterMode, setApplicantFilterMode] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<string | null>(null);
  const [applicantModalOpen, setApplicantModalOpen] = useState(false);
  const [applicantSearchQuery, setApplicantSearchQuery] = useState('');
  const [selectedTrademarks, setSelectedTrademarks] = useState<Set<string>>(new Set());
  const reportId = params?.reportId as string;

  useEffect(() => {
    if (!authLoading && !user?.authenticated) {
      router.push('/');
      return;
    }

    if (reportId) {
      fetchReportData();
    }
  }, [reportId, user, authLoading, router]);

  const fetchReportData = async () => {
    if (!reportId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getReportData(reportId);
      // Log the data structure for debugging
      console.log('Report Data Structure:', data);
      console.log('Entries with similarities:', data?.entries_with_similarities);
      console.log('Summary:', data?.summary);
      
      // Handle different possible data structures
      // The data might be directly the report, or nested under 'data'
      const reportData = data?.data || data;
      setReportData(reportData);
    } catch (err: any) {
      setError(err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  // Parse server date string as UTC and return Date object
  const parseServerDate = (dateString: string): Date => {
    try {
      // Handle ISO format: 2025-12-29T19:29:13.792941
      if (dateString.includes('T')) {
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        // Handle microseconds: split by '.' and take first part
        const timeWithoutMicroseconds = timePart.split('.')[0];
        const [hour, minute, second] = timeWithoutMicroseconds.split(':').map(Number);
        return new Date(Date.UTC(year, month - 1, day, hour, minute, second || 0));
      }
      // Handle space-separated format (existing logic)
      if (dateString.includes(' ')) {
        const [datePart, timePart] = dateString.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);
        return new Date(Date.UTC(year, month - 1, day, hour, minute, second || 0));
      }
      // Handle date-only format
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    } catch {
      return new Date(dateString);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseServerDate(dateString);
      return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseServerDate(dateString);
      return date.toLocaleString('en-IN', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const calcPercentage = (part: number, total: number) => {
    if (total === 0) return '0.0';
    return ((part / total) * 100).toFixed(1);
  };

  // Build image URL from image path using the report-image endpoint
  const getImageUrl = (imagePath: string | undefined | null): string | null => {
    if (!imagePath || imagePath.trim() === '') return null;
    
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
    const encodedPath = encodeURIComponent(imagePath);
    return `${API_BASE}/report-image?image_path=${encodedPath}`;
  };

  // Handle trademark selection
  const handleTrademarkSelect = (entryIndex: number, simIndex: number, checked: boolean) => {
    const trademarkId = `${entryIndex}-${simIndex}`;
    setSelectedTrademarks((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(trademarkId);
      } else {
        newSet.delete(trademarkId);
      }
      return newSet;
    });
  };

  // Get selected trademarks data for navigation
  const getSelectedTrademarksData = () => {
    if (!reportData || !entries) return [];

    const selectedData: Array<{
      entry: JournalTrademarkEntry;
      sim: SimilarTrademark;
      entryIndex: number;
      simIndex: number;
    }> = [];

    console.log('Collecting selected trademarks data. Selected IDs:', Array.from(selectedTrademarks));
    console.log('Total entries:', entries.length);

    entries.forEach((entry: JournalTrademarkEntry, entryIndex: number) => {
      const similarTrademarks = 
        entry?.similar_trademarks || 
        entry?.similar_trademark || 
        entry?.similarities ||
        entry?.matches ||
        [];
      
      similarTrademarks.forEach((sim: SimilarTrademark, simIndex: number) => {
        const trademarkId = `${entryIndex}-${simIndex}`;
        if (selectedTrademarks.has(trademarkId)) {
          selectedData.push({
            entry,
            sim,
            entryIndex,
            simIndex,
          });
          console.log(`Added: Entry ${entryIndex}, Sim ${simIndex}, Applicant: ${sim.applicant_name || 'N/A'}`);
        }
      });
    });

    console.log(`Total collected: ${selectedData.length} trademarks`);
    console.log(`Total selected in Set: ${selectedTrademarks.size}`);
    
    if (selectedData.length !== selectedTrademarks.size) {
      console.error('MISMATCH: Collected data count does not match selected trademarks count!');
      console.error('This might indicate some trademarks were not found in the entries array.');
      
      // Find which trademark IDs are in the Set but not in collected data
      const collectedIds = new Set(selectedData.map(d => `${d.entryIndex}-${d.simIndex}`));
      const missingIds = Array.from(selectedTrademarks).filter(id => !collectedIds.has(id));
      console.error('Missing trademark IDs:', missingIds);
      
      // Try to find why they're missing
      missingIds.forEach(id => {
        const [entryIdx, simIdx] = id.split('-').map(Number);
        const entry = entries[entryIdx];
        if (!entry) {
          console.error(`Entry ${entryIdx} does not exist in entries array (length: ${entries.length})`);
        } else {
          const similarTrademarks = 
            entry?.similar_trademarks || 
            entry?.similar_trademark || 
            entry?.similarities ||
            entry?.matches ||
            [];
          if (simIdx >= similarTrademarks.length) {
            console.error(`Sim index ${simIdx} is out of bounds for entry ${entryIdx} (has ${similarTrademarks.length} similar trademarks)`);
          } else {
            console.error(`Entry ${entryIdx}, Sim ${simIdx} exists but was not collected. Entry mark: ${entry.mark_name || entry.mark}`);
          }
        }
      });
    }
    
    const uniqueApplicants = new Set(selectedData.map(d => d.sim.applicant_name?.trim() || 'Unknown'));
    console.log(`Unique applicants in collected data: ${Array.from(uniqueApplicants)}`);

    return selectedData;
  };

  // Handle generate templates
  const handleGenerateTemplates = () => {
    const selectedData = getSelectedTrademarksData();
    if (selectedData.length === 0) {
      alert('Please select at least one trademark to generate email templates.');
      return;
    }

    console.log('=== GENERATING TEMPLATES ===');
    console.log('Selected data to store:', selectedData.map(d => ({
      mark: d.sim.mark,
      applicant: d.sim.applicant_name,
      entryIndex: d.entryIndex,
      simIndex: d.simIndex
    })));

    // Clear any old data first
    sessionStorage.removeItem('selectedTrademarks');
    sessionStorage.removeItem('reportData');
    
    // Store data in sessionStorage for the email templates page
    sessionStorage.setItem('selectedTrademarks', JSON.stringify(selectedData));
    sessionStorage.setItem('reportData', JSON.stringify(reportData));
    
    // Navigate to email templates page
    router.push(`/app/report/${reportId}/email-templates`);
  };

  const getHighSimilarityEntries = (entries: JournalTrademarkEntry[] | undefined, threshold = 0.8) => {
    if (!entries || !Array.isArray(entries)) {
      return [];
    }
    return entries.filter((entry) => {
      const similarTrademarks = 
        entry?.similar_trademarks || 
        entry?.similar_trademark || 
        entry?.similarities ||
        entry?.matches ||
        [];
      
      return similarTrademarks.some((sim) => {
        const score = sim?.similarity_score;
        if (score === undefined || score === null) return false;
        // Handle both decimal (0-1) and percentage (0-100) formats
        const normalizedScore = score > 1 ? score / 100 : score;
        return normalizedScore >= threshold;
      });
    });
  };

  const getFilteredSimilarTrademarks = (similarTrademarks: SimilarTrademark[] | undefined, minThreshold = 0.3) => {
    if (!similarTrademarks || !Array.isArray(similarTrademarks)) {
      return [];
    }
    return similarTrademarks.filter((sim) => {
      const score = sim?.similarity_score;
      if (score === undefined || score === null) return false;
      
      // Handle both decimal (0-1) and percentage (0-100) formats
      const normalizedScore = score > 1 ? score / 100 : score;
      return normalizedScore >= minThreshold;
    });
  };

  const getRiskLevel = (score: number) => {
    if (score >= 0.8) return { level: 'HIGH RISK', color: 'red', icon: 'alert-circle' };
    if (score >= 0.6) return { level: 'MEDIUM RISK', color: 'yellow', icon: 'alert-triangle' };
    return { level: 'LOW RISK', color: 'green', icon: 'check-circle' };
  };

  // Extract unique applicants from similar trademarks
  const getUniqueApplicants = (entries: JournalTrademarkEntry[]) => {
    const applicantMap = new Map<string, { count: number; highestScore: number; matches: Array<{ entry: JournalTrademarkEntry; sim: SimilarTrademark }> }>();
    
    entries.forEach((entry) => {
      const similarTrademarks = 
        entry?.similar_trademarks || 
        entry?.similar_trademark || 
        entry?.similarities ||
        entry?.matches ||
        [];
      
      similarTrademarks.forEach((sim: SimilarTrademark) => {
        if (sim?.applicant_name && sim.applicant_name.trim() !== '') {
          const applicantName = sim.applicant_name.trim();
          const normalizedScore = sim.similarity_score > 1 ? sim.similarity_score / 100 : sim.similarity_score;
          
          if (!applicantMap.has(applicantName)) {
            applicantMap.set(applicantName, {
              count: 0,
              highestScore: normalizedScore,
              matches: []
            });
          }
          
          const applicantData = applicantMap.get(applicantName)!;
          applicantData.count++;
          applicantData.highestScore = Math.max(applicantData.highestScore, normalizedScore);
          applicantData.matches.push({ entry, sim });
        }
      });
    });
    
    return Array.from(applicantMap.entries())
      .map(([name, data]) => ({
        name,
        matchCount: data.count,
        highestScore: data.highestScore,
        matches: data.matches
      }))
      .sort((a, b) => b.matchCount - a.matchCount || b.highestScore - a.highestScore);
  };

  // Get filtered matches for a specific applicant
  const getFilteredMatchesByApplicant = (applicantName: string, entries: JournalTrademarkEntry[]) => {
    const matches: Array<{ entry: JournalTrademarkEntry; sim: SimilarTrademark }> = [];
    
    entries.forEach((entry) => {
      const similarTrademarks = 
        entry?.similar_trademarks || 
        entry?.similar_trademark || 
        entry?.similarities ||
        entry?.matches ||
        [];
      
      similarTrademarks.forEach((sim: SimilarTrademark) => {
        if (sim?.applicant_name && sim.applicant_name.trim() === applicantName.trim()) {
          const normalizedScore = sim.similarity_score > 1 ? sim.similarity_score / 100 : sim.similarity_score;
          if (normalizedScore >= 0.3) {
            matches.push({ entry, sim });
          }
        }
      });
    });
    
    // Sort by similarity score (highest first)
    matches.sort((a, b) => {
      const scoreA = a.sim.similarity_score > 1 ? a.sim.similarity_score / 100 : a.sim.similarity_score;
      const scoreB = b.sim.similarity_score > 1 ? b.sim.similarity_score / 100 : b.sim.similarity_score;
      return scoreB - scoreA;
    });
    
    return matches;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-red-100 text-red-800 border-red-300';
    if (score >= 0.7) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (score >= 0.5) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600 font-medium">Loading report data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h2 className="text-xl font-bold">Error Loading Report</h2>
            </div>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => router.push('/app')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  // Log the report data structure for debugging
  console.log('Processing reportData:', reportData);
  console.log('Keys in reportData:', Object.keys(reportData));
  
  // Try different possible field names
  const entries = 
    reportData.entries_with_similarities || 
    (reportData as any).entries || 
    (reportData as any).journal_entries ||
    (Array.isArray(reportData) ? reportData : []);
  
  const summary = reportData.summary || (reportData as any);
  
  const summaryData = {
    total_journal_trademarks: (summary as ReportSummary)?.total_journal_trademarks || (reportData as any)?.total_journal_trademarks || 0,
    total_image_based: (summary as ReportSummary)?.total_image_based || (reportData as any)?.total_image_based || 0,
    total_text_only: (summary as ReportSummary)?.total_text_only || (reportData as any)?.total_text_only || 0,
    total_self_db_trademarks: (summary as ReportSummary)?.total_self_db_trademarks || (reportData as any)?.total_self_db_trademarks || 0,
    total_similarities_found: (summary as ReportSummary)?.total_similarities_found || (reportData as any)?.total_similarities_found || 0,
    trademarks_with_similarities: (summary as ReportSummary)?.trademarks_with_similarities || (reportData as any)?.trademarks_with_similarities || 0,
    similarity_threshold_used: (summary as ReportSummary)?.similarity_threshold_used || (reportData as any)?.similarity_threshold_used || 0.3,
    highest_similarity_score: (summary as ReportSummary)?.highest_similarity_score || (reportData as any)?.highest_similarity_score || 0,
    average_similarity_score: (summary as ReportSummary)?.average_similarity_score || (reportData as any)?.average_similarity_score || 0,
  };
  
  console.log('Processed entries:', entries);
  console.log('Entries length:', entries?.length);
  console.log('Summary data:', summaryData);

  // Get unique applicants
  const uniqueApplicants = getUniqueApplicants(entries || []);
  const filteredApplicants = uniqueApplicants.filter(applicant =>
    applicant.name.toLowerCase().includes(applicantSearchQuery.toLowerCase())
  );

  const highSimilarityEntries = getHighSimilarityEntries(entries);
  const entriesWithMatches = (entries || [])
    .map((entry: JournalTrademarkEntry) => {
      // Try different possible field names for similar trademarks
      const similarTrademarks = 
        entry?.similar_trademarks || 
        entry?.similar_trademark || 
        entry?.similarities ||
        entry?.matches ||
        [];
      
      console.log('Entry:', entry?.mark_name || entry?.mark || 'Unknown', 'Similar trademarks:', similarTrademarks);
      
      return {
        entry,
        filtered: getFilteredSimilarTrademarks(similarTrademarks),
      };
    })
    .filter((item: { entry: JournalTrademarkEntry; filtered: SimilarTrademark[] }) => item.filtered.length > 0)
    .sort((a: { entry: JournalTrademarkEntry; filtered: SimilarTrademark[] }, b: { entry: JournalTrademarkEntry; filtered: SimilarTrademark[] }) => {
      const maxA = Math.max(...a.filtered.map((s: SimilarTrademark) => s?.similarity_score || 0));
      const maxB = Math.max(...b.filtered.map((s: SimilarTrademark) => s?.similarity_score || 0));
      return maxB - maxA;
    });
  
  console.log('Entries with matches:', entriesWithMatches.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/app')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Weekly Trademark Similarity Report</h1>
                <p className="text-sm text-gray-600">Report ID: {reportId}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Cover Page Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-8 py-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Weekly Trademark Similarity Report</h1>
            <div className="space-y-2 text-blue-100">
              <p className="text-lg flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Journal Upload Date: {formatDate(reportData.monday_date)}
              </p>
              <p className="text-base flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Report Generated: {formatDateTime(reportData.report_date)} IST
              </p>
            </div>
          </div>

          {/* Quick Statistics */}
          <div className="p-8 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Quick Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Journal Trademarks</div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{summaryData.total_journal_trademarks}</div>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Image-Based</div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{summaryData.total_image_based}</div>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  </div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Text-Only</div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{summaryData.total_text_only}</div>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Self DB</div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{summaryData.total_self_db_trademarks}</div>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600">
                      <path d="M9 11l3 3L22 4"></path>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                  </div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Similarities</div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{summaryData.total_similarities_found}</div>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">With Matches</div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{summaryData.trademarks_with_similarities}</div>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Highest Score</div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{formatPercentage(summaryData.highest_similarity_score)}</div>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
                      <line x1="12" y1="20" x2="12" y2="10"></line>
                      <line x1="18" y1="20" x2="18" y2="4"></line>
                      <line x1="6" y1="20" x2="6" y2="16"></line>
                    </svg>
                  </div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Average Score</div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{formatPercentage(summaryData.average_similarity_score)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">Executive Summary</h2>
          
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p>
              This report analyzes <strong>{summaryData.total_journal_trademarks}</strong> trademarks from the Indian Trademark 
              Journal uploaded on <strong>{formatDate(reportData.monday_date)}</strong>. 
              Of these, <strong>{summaryData.total_image_based}</strong> are image-based trademarks and 
              <strong>{summaryData.total_text_only}</strong> are text-only trademarks.
            </p>
            <p>
              These journal trademarks were compared against <strong>{summaryData.total_self_db_trademarks}</strong> 
              trademarks in the self database using a similarity threshold of <strong>{formatPercentage(summaryData.similarity_threshold_used)}</strong>.
            </p>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-5 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <h3 className="font-bold text-gray-900">Key Findings</h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 mt-0.5 flex-shrink-0">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  <span>Total similarity matches found: <strong className="text-gray-900">{summaryData.total_similarities_found}</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 mt-0.5 flex-shrink-0">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  <span>
                    Journal trademarks with at least one match: <strong className="text-gray-900">{summaryData.trademarks_with_similarities}</strong> 
                    <span className="text-gray-600"> ({calcPercentage(summaryData.trademarks_with_similarities, summaryData.total_journal_trademarks)}%)</span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 mt-0.5 flex-shrink-0">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  <span>Highest similarity score: <strong className="text-gray-900">{formatPercentage(summaryData.highest_similarity_score)}</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 mt-0.5 flex-shrink-0">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  <span>Average similarity score: <strong className="text-gray-900">{formatPercentage(summaryData.average_similarity_score)}</strong></span>
                </li>
              </ul>
            </div>

            {highSimilarityEntries.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-red-600 flex-shrink-0 mt-0.5"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p className="text-red-800">
                  <strong>Attention:</strong> {highSimilarityEntries.length} trademark(s) have similarity scores 
                  of 80% or higher. These require immediate review.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Similarity Analysis */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Detailed Similarity Analysis</h2>
            <button
              onClick={() => setApplicantModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M7 12h10M11 18h2"></path>
              </svg>
              Sort by Applicants
            </button>
          </div>
          
          {applicantFilterMode && selectedApplicant ? (
            // Applicant Filtered View
            (() => {
              const filteredMatches = getFilteredMatchesByApplicant(selectedApplicant, entries || []);
              const groupedByEntry = new Map<number, Array<{ entry: JournalTrademarkEntry; sim: SimilarTrademark }>>();
              
              filteredMatches.forEach((match) => {
                const entryIndex = (entries || []).findIndex((e: JournalTrademarkEntry) => {
                  // Compare by checking if it's the same entry object
                  return e === match.entry;
                });
                if (entryIndex >= 0) {
                  if (!groupedByEntry.has(entryIndex)) {
                    groupedByEntry.set(entryIndex, []);
                  }
                  groupedByEntry.get(entryIndex)!.push(match);
                }
              });

              const totalMatches = filteredMatches.length;
              const uniqueEntries = groupedByEntry.size;
              const highestScore = filteredMatches.length > 0 
                ? Math.max(...filteredMatches.map(m => {
                    const score = m.sim.similarity_score > 1 ? m.sim.similarity_score / 100 : m.sim.similarity_score;
                    return score;
                  }))
                : 0;

              return (
                <div className="space-y-6">
                  {/* Selected Applicant Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          <h3 className="text-lg font-bold text-gray-900">Filtered by Applicant</h3>
                        </div>
                        <p className="text-gray-700 font-medium">{selectedApplicant}</p>
                      </div>
                      <button
                        onClick={() => {
                          setApplicantFilterMode(false);
                          setSelectedApplicant(null);
                        }}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Clear Filter
                      </button>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Total Matches</div>
                      <div className="text-2xl font-bold text-gray-900">{totalMatches}</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Journal Entries</div>
                      <div className="text-2xl font-bold text-gray-900">{uniqueEntries}</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Highest Score</div>
                      <div className="text-2xl font-bold text-gray-900">{formatPercentage(highestScore)}</div>
                    </div>
                  </div>

                  {/* Filtered Matches List */}
                  {filteredMatches.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-600">No matches found for this applicant.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Array.from(groupedByEntry.entries()).map(([entryIndex, matches]) => {
                        const entry = entries[entryIndex];
                        if (!entry) return null;

                        return (
                          <div key={entryIndex} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                            {/* Journal Entry Header */}
                            <div className="mb-4 pb-4 border-b border-gray-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg font-bold text-gray-900">
                                      {entry.mark_name || entry.mark || 'Unknown Mark'}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
                                      entry.trademark_type === 'image_based' 
                                        ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                        : 'bg-green-100 text-green-700 border border-green-200'
                                    }`}>
                                      {entry.trademark_type === 'image_based' ? (
                                        <>
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                            <polyline points="21 15 16 10 5 21"></polyline>
                                          </svg>
                                          Image
                                        </>
                                      ) : (
                                        <>
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                          </svg>
                                          Text
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Class: {entry.trademark_class || 'N/A'} | 
                                    Application: {entry.application_no || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Journal Entry Image (if image-based) */}
                            {entry.trademark_type === 'image_based' && entry.image_path && (() => {
                              const imageUrl = getImageUrl(entry.image_path);
                              return imageUrl ? (
                                <div className="mb-4 flex justify-center">
                                  <div className="relative border-2 border-gray-200 rounded-lg p-3 bg-gray-50 max-w-xs">
                                    <div className="text-xs text-gray-500 mb-2 text-center">Journal Trademark Image</div>
                                    <img
                                      src={imageUrl}
                                      alt={entry.mark_name || entry.mark || 'Trademark'}
                                      className="max-w-full h-auto rounded-lg shadow-sm"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        const errorDiv = document.createElement('div');
                                        errorDiv.className = 'text-sm text-gray-500 text-center py-2';
                                        errorDiv.textContent = 'Image not available';
                                        (e.target as HTMLImageElement).parentElement?.appendChild(errorDiv);
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : null;
                            })()}

                            {/* Similar Trademarks for this Entry */}
                            <div>
                              <div className="text-sm font-semibold text-gray-900 mb-3">
                                Similar Trademarks ({matches.length})
                              </div>
                              <div className="space-y-3">
                                {matches.map((match, matchIndex) => {
                                  const sim = match.sim;
                                  const score = sim.similarity_score > 1 ? sim.similarity_score / 100 : sim.similarity_score;
                                  const simImageUrl = (sim.trademark_type === 'image_based' && sim.image_path) 
                                    ? getImageUrl(sim.image_path) 
                                    : null;
                                  
                                  // Need to find the actual simIndex in the original entry
                                  const entryForMatch = entries[entryIndex];
                                  if (!entryForMatch) return null;
                                  
                                  const similarTrademarksForEntry = 
                                    entryForMatch?.similar_trademarks || 
                                    entryForMatch?.similar_trademark || 
                                    entryForMatch?.similarities ||
                                    entryForMatch?.matches ||
                                    [];
                                  
                                  // Find the actual index by matching properties (not just reference)
                                  const actualSimIndex = similarTrademarksForEntry.findIndex((s: SimilarTrademark) => {
                                    // Match by key properties to ensure we get the right one
                                    return s.mark === sim.mark && 
                                           Math.abs((s.similarity_score || 0) - (sim.similarity_score || 0)) < 0.0001 &&
                                           s.applicant_name === sim.applicant_name &&
                                           s.trademark_class === sim.trademark_class;
                                  });
                                  
                                  if (actualSimIndex === -1) {
                                    console.warn('Could not find sim index for:', sim.mark, 'Applicant:', sim.applicant_name, 'in entry:', entryIndex);
                                    return null;
                                  }
                                  
                                  const actualTrademarkId = `${entryIndex}-${actualSimIndex}`;
                                  const isSelected = selectedTrademarks.has(actualTrademarkId);
                                  
                                  return (
                                    <div key={matchIndex} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                      <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 pt-1">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => handleTrademarkSelect(entryIndex, actualSimIndex, e.target.checked)}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                          />
                                        </div>
                                        {/* Similar Trademark Image - Only for image-based */}
                                        {simImageUrl && (
                                          <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center border border-gray-200 rounded bg-white">
                                            <img
                                              src={simImageUrl}
                                              alt={sim.mark || 'Similar trademark'}
                                              className="max-w-full max-h-full object-contain rounded"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                              }}
                                            />
                                          </div>
                                        )}
                                        <div className="flex-1 flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="font-medium text-gray-900 mb-1">{sim.mark || 'Unknown'}</div>
                                            <div className="text-xs text-gray-600 space-y-0.5">
                                              <div>Class: {sim.trademark_class || 'N/A'}</div>
                                              <div>Application: {sim.application_no || 'N/A'}</div>
                                            </div>
                                          </div>
                                          <span className={`px-2.5 py-1 rounded-md text-sm font-semibold border flex-shrink-0 ${getScoreColor(score)}`}>
                                            {formatPercentage(score)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()
          ) : entriesWithMatches.length === 0 ? (
            <div className="space-y-4">
              <p className="text-gray-600">No similarities found above 30% threshold.</p>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>Debug Info:</strong> Found {entries?.length || 0} total entries. 
                  Check browser console for detailed data structure.
                </p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-yellow-900">Show Raw Data Structure</summary>
                  <div className="mt-2 bg-white p-4 rounded border border-yellow-200 overflow-x-auto">
                    <pre className="text-xs text-gray-700">
                      {JSON.stringify(reportData, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-700 mb-6">
                Showing {entriesWithMatches.length} journal trademark(s) with similarity matches (≥30%):
              </p>

              <div className="space-y-8">
                {entriesWithMatches.map(({ entry, filtered }: { entry: JournalTrademarkEntry; filtered: SimilarTrademark[] }, index: number) => {
                  // Find the actual entryIndex in the original entries array
                  const actualEntryIndex = entries.findIndex((e: JournalTrademarkEntry) => e === entry);
                  if (actualEntryIndex === -1) {
                    console.warn('Could not find entry index for:', entry.mark_name);
                    return null;
                  }
                  
                  const highestScore = Math.max(...filtered.map((s: SimilarTrademark) => s.similarity_score));
                  const risk = getRiskLevel(highestScore);
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                      {/* Entry Header */}
                      <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-300">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-bold text-gray-900">{index + 1}.</span>
                            <span className="text-lg font-bold text-gray-900">
                              {entry.mark_name || 'Unknown Mark'}
                            </span>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
                              entry.trademark_type === 'image_based' 
                                ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                : 'bg-green-100 text-green-700 border border-green-200'
                            }`}>
                              {entry.trademark_type === 'image_based' ? (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                  </svg>
                                  Image
                                </>
                              ) : (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                  </svg>
                                  Text
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg border-2 font-semibold text-xs flex items-center gap-1.5 ${
                          risk.color === 'red' ? 'bg-red-50 text-red-800 border-red-300' :
                          risk.color === 'yellow' ? 'bg-yellow-50 text-yellow-800 border-yellow-300' :
                          'bg-green-50 text-green-800 border-green-300'
                        }`}>
                          {risk.icon === 'alert-circle' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="12"></line>
                              <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                          )}
                          {risk.icon === 'alert-triangle' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                              <line x1="12" y1="9" x2="12" y2="13"></line>
                              <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                          )}
                          {risk.icon === 'check-circle' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                          )}
                          {risk.level}
                        </div>
                      </div>

                      {/* Journal Trademark Image (if image-based) */}
                      {entry.trademark_type === 'image_based' && entry.image_path && (() => {
                        const imageUrl = getImageUrl(entry.image_path);
                        return imageUrl ? (
                          <div className="mb-6 flex justify-center">
                            <div className="relative border-2 border-gray-200 rounded-lg p-4 bg-gray-50 max-w-md">
                              <div className="text-xs text-gray-500 mb-2 text-center">Journal Trademark Image</div>
                              <img
                                src={imageUrl}
                                alt={entry.mark_name || 'Trademark'}
                                className="max-w-full h-auto rounded-lg shadow-sm"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'text-sm text-gray-500 text-center py-4';
                                  errorDiv.textContent = 'Image not available';
                                  (e.target as HTMLImageElement).parentElement?.appendChild(errorDiv);
                                }}
                              />
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Journal Trademark Details */}
                      <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                          </svg>
                          Journal Trademark Details
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Type</div>
                            <div className="font-medium text-gray-900">
                              {entry.trademark_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Class</div>
                            <div className="font-medium text-gray-900">{entry.trademark_class || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Applicant</div>
                            <div className="font-medium text-gray-900">{entry.applicant_name || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Application No.</div>
                            <div className="font-medium text-gray-900">{entry.application_no || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">PDF Source</div>
                            <div className="font-medium text-gray-900">{entry.pdf_source || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Page</div>
                            <div className="font-medium text-gray-900">{entry.page_number || 'N/A'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Similar Trademarks Table */}
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                            <path d="M9 11l3 3L22 4"></path>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                          </svg>
                          Similar Trademarks Found ({filtered.length})
                        </h3>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="w-full border-collapse bg-white">
                            <thead>
                              <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                                <th className="px-4 py-3 text-center text-sm font-semibold w-12">
                                  <input
                                    type="checkbox"
                                    checked={filtered.length > 0 && filtered.every((sim) => {
                                      const entrySimilarTrademarks = 
                                        entry?.similar_trademarks || 
                                        entry?.similar_trademark || 
                                        entry?.similarities ||
                                        entry?.matches ||
                                        [];
                                      const simIndex = entrySimilarTrademarks.findIndex((s: SimilarTrademark) => {
                                        return s.mark === sim.mark && 
                                               Math.abs((s.similarity_score || 0) - (sim.similarity_score || 0)) < 0.0001 &&
                                               s.applicant_name === sim.applicant_name;
                                      });
                                      return simIndex !== -1 && selectedTrademarks.has(`${actualEntryIndex}-${simIndex}`);
                                    })}
                                    onChange={(e) => {
                                      filtered.forEach((sim) => {
                                        const entrySimilarTrademarks = 
                                          entry?.similar_trademarks || 
                                          entry?.similar_trademark || 
                                          entry?.similarities ||
                                          entry?.matches ||
                                          [];
                                        const simIndex = entrySimilarTrademarks.findIndex((s: SimilarTrademark) => {
                                          return s.mark === sim.mark && 
                                                 Math.abs((s.similarity_score || 0) - (sim.similarity_score || 0)) < 0.0001 &&
                                                 s.applicant_name === sim.applicant_name;
                                        });
                                        if (simIndex !== -1) {
                                          handleTrademarkSelect(actualEntryIndex, simIndex, e.target.checked);
                                        }
                                      });
                                    }}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Mark</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold">Score</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold">Class</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Applicant</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">App. No.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map((sim: SimilarTrademark, simIndex: number) => {
                                // Find the actual simIndex in the original entry's similar trademarks array
                                const entrySimilarTrademarks = 
                                  entry?.similar_trademarks || 
                                  entry?.similar_trademark || 
                                  entry?.similarities ||
                                  entry?.matches ||
                                  [];
                                
                                const actualSimIndex = entrySimilarTrademarks.findIndex((s: SimilarTrademark) => {
                                  return s.mark === sim.mark && 
                                         Math.abs((s.similarity_score || 0) - (sim.similarity_score || 0)) < 0.0001 &&
                                         s.applicant_name === sim.applicant_name;
                                });
                                
                                if (actualSimIndex === -1) {
                                  console.warn('Could not find sim index for:', sim.mark, 'in entry:', actualEntryIndex);
                                  return null;
                                }
                                
                                const trademarkId = `${actualEntryIndex}-${actualSimIndex}`;
                                const isSelected = selectedTrademarks.has(trademarkId);
                                return (
                                  <tr
                                    key={simIndex}
                                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                      sim.similarity_score >= 0.8 
                                        ? 'bg-red-50/50' 
                                        : sim.similarity_score >= 0.7 
                                        ? 'bg-orange-50/50' 
                                        : 'bg-white'
                                    }`}
                                  >
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => handleTrademarkSelect(actualEntryIndex, actualSimIndex, e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{sim.mark || 'N/A'}</td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`px-2.5 py-1 rounded-md text-sm font-semibold border ${getScoreColor(sim.similarity_score)}`}>
                                        {formatPercentage(sim.similarity_score)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-700">{sim.trademark_class || 'N/A'}</td>
                                    <td className="px-4 py-3 text-gray-700">{sim.applicant_name || 'N/A'}</td>
                                    <td className="px-4 py-3 text-gray-700 font-mono text-sm">{sim.application_no || 'N/A'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Similarity Analysis Summary */}
                      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          <h4 className="font-semibold text-gray-900">Analysis Summary</h4>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Overview */}
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 mb-1">Overview</div>
                              <div className="text-sm text-gray-600">
                                Found <strong className="text-gray-900">{filtered.length}</strong> similar trademark{filtered.length !== 1 ? 's' : ''} 
                                {' '}with highest score of <strong className="text-gray-900">{formatPercentage(highestScore)}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Matches List */}
                          {filtered.length > 0 && (
                            <div className="border-t border-gray-200 pt-3">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Matches</div>
                              <div className="space-y-2">
                                {(expandedEntries.has(index) ? filtered : filtered.slice(0, 3)).map((sim: SimilarTrademark, simIndex: number) => {
                                  const hasVector = sim.vector_similarity_score !== undefined && sim.vector_similarity_score > 0;
                                  const hasText = sim.text_similarity_score !== undefined && sim.text_similarity_score > 0;
                                  const isSameClass = entry.trademark_class && sim.trademark_class && entry.trademark_class === sim.trademark_class;
                                  
                                  return (
                                    <div key={simIndex} className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                        sim.similarity_score >= 0.8 ? 'bg-red-100 text-red-700' :
                                        sim.similarity_score >= 0.7 ? 'bg-orange-100 text-orange-700' :
                                        'bg-blue-100 text-blue-700'
                                      }`}>
                                        {simIndex + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium text-gray-900 truncate">{sim.mark || 'Unknown'}</span>
                                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border flex-shrink-0 ${getScoreColor(sim.similarity_score)}`}>
                                            {formatPercentage(sim.similarity_score)}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-600 space-y-0.5">
                                          {entry.trademark_type === 'image_based' && hasVector && (
                                            <div>Visual match: {formatPercentage(sim.vector_similarity_score!)}</div>
                                          )}
                                          {hasText && (
                                            <div>Text match: {formatPercentage(sim.text_similarity_score!)}</div>
                                          )}
                                          {sim.trademark_class && (
                                            <div className={isSameClass ? 'text-red-600 font-medium' : ''}>
                                              Class {sim.trademark_class}{isSameClass ? ' (same class - higher risk)' : ''}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                {filtered.length > 3 && !expandedEntries.has(index) && (
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedEntries);
                                      newExpanded.add(index);
                                      setExpandedEntries(newExpanded);
                                    }}
                                    className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium text-center pt-2 flex items-center justify-center gap-1 hover:underline transition-colors"
                                  >
                                    <span>+{filtered.length - 3} more match{filtered.length - 3 !== 1 ? 'es' : ''}</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                  </button>
                                )}
                                {filtered.length > 3 && expandedEntries.has(index) && (
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedEntries);
                                      newExpanded.delete(index);
                                      setExpandedEntries(newExpanded);
                                    }}
                                    className="w-full text-xs text-gray-600 hover:text-gray-700 font-medium text-center pt-2 flex items-center justify-center gap-1 hover:underline transition-colors"
                                  >
                                    <span>Show less</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="18 15 12 9 6 15"></polyline>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Risk Assessment */}
                          <div className="border-t border-gray-200 pt-3">
                            <div className="flex items-start gap-2">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`mt-0.5 flex-shrink-0 ${
                                risk.color === 'red' ? 'text-red-600' : risk.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {risk.icon === 'alert-circle' && (
                                  <>
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                  </>
                                )}
                                {risk.icon === 'alert-triangle' && (
                                  <>
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                  </>
                                )}
                                {risk.icon === 'check-circle' && (
                                  <>
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                  </>
                                )}
                              </svg>
                              <div className="flex-1">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Risk Assessment</div>
                                <div className="text-sm text-gray-700">
                                  {highestScore >= 0.8 
                                    ? `Very high similarity detected. ${filtered.filter((s: SimilarTrademark) => s.similarity_score >= 0.8).length} match(es) require immediate review.`
                                    : highestScore >= 0.6
                                    ? `Moderate similarity detected. Further evaluation recommended.`
                                    : `Lower similarity level. Regular monitoring advised.`}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Floating Generate Templates Button */}
        {selectedTrademarks.size > 0 && (
          <div className="fixed bottom-8 right-8 z-50">
            <button
              onClick={handleGenerateTemplates}
              className="px-6 py-4 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-all flex items-center gap-3 shadow-2xl hover:shadow-green-500/50 hover:scale-105"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span className="text-lg">Generate Templates</span>
              <span className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-bold">
                {selectedTrademarks.size}
              </span>
            </button>
          </div>
        )}

        {/* Applicant Selection Modal */}
        {applicantModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setApplicantModalOpen(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Filter by Applicant</h3>
                    <p className="text-sm text-blue-100">{uniqueApplicants.length} unique applicants found</p>
                  </div>
                </div>
                <button
                  onClick={() => setApplicantModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Search Input */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="relative">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search applicants..."
                    value={applicantSearchQuery}
                    onChange={(e) => setApplicantSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Applicants List */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {filteredApplicants.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No applicants found matching your search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredApplicants.map((applicant, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedApplicant(applicant.name);
                          setApplicantFilterMode(true);
                          setApplicantModalOpen(false);
                          setApplicantSearchQuery('');
                        }}
                        className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate mb-1">{applicant.name}</div>
                            <div className="text-sm text-gray-600">
                              {applicant.matchCount} match{applicant.matchCount !== 1 ? 'es' : ''}
                            </div>
                          </div>
                          <div className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex-shrink-0 ${getScoreColor(applicant.highestScore)}`}>
                            {formatPercentage(applicant.highestScore)}
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="text-xs text-gray-500">Highest similarity score</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setApplicantModalOpen(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}



