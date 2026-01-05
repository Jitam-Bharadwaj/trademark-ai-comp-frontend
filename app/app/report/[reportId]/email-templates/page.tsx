'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getApplicantEmail } from '@/lib/api';

interface SimilarTrademark {
  mark: string;
  similarity_score: number;
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

interface ReportData {
  report_id: string;
  monday_date: string;
  report_date: string;
}

interface SelectedTrademark {
  entry: JournalTrademarkEntry;
  sim: SimilarTrademark;
  entryIndex: number;
  simIndex: number;
}

interface ApplicantGroup {
  applicantName: string;
  email: string | null;
  loading: boolean;
  entries: Map<number, {
    entry: JournalTrademarkEntry;
    similarTrademarks: SimilarTrademark[];
  }>;
}

export default function EmailTemplatesPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [selectedTrademarks, setSelectedTrademarks] = useState<SelectedTrademark[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [applicantGroups, setApplicantGroups] = useState<ApplicantGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportId = params?.reportId as string;

  useEffect(() => {
    if (!authLoading && !user?.authenticated) {
      router.push('/');
      return;
    }

    // Load data from sessionStorage
    const storedTrademarks = sessionStorage.getItem('selectedTrademarks');
    const storedReportData = sessionStorage.getItem('reportData');

    if (!storedTrademarks || !storedReportData) {
      setError('No selected trademarks found. Please go back and select trademarks.');
      setLoading(false);
      return;
    }

    try {
      const trademarks = JSON.parse(storedTrademarks);
      const report = JSON.parse(storedReportData);
      
      // Validate that we have valid data
      if (!Array.isArray(trademarks) || trademarks.length === 0) {
        setError('No valid selected trademarks found. Please go back and select trademarks.');
        setLoading(false);
        return;
      }
      
      console.log('=== LOADED FROM SESSIONSTORAGE ===');
      console.log('Loaded trademarks count:', trademarks.length);
      console.log('Loaded trademarks:', trademarks.map((t: SelectedTrademark) => ({
        mark: t.sim?.mark,
        applicant: t.sim?.applicant_name,
        entryIndex: t.entryIndex,
        simIndex: t.simIndex
      })));
      
      setSelectedTrademarks(trademarks);
      setReportData(report);
    } catch (err) {
      console.error('Error parsing stored data:', err);
      setError('Failed to load selected trademarks data. Please go back and try again.');
      setLoading(false);
      // Clear corrupted data
      sessionStorage.removeItem('selectedTrademarks');
      sessionStorage.removeItem('reportData');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (selectedTrademarks.length === 0 || !reportData) return;

    // Group by applicant
    const grouped = new Map<string, Map<number, { entry: JournalTrademarkEntry; similarTrademarks: SimilarTrademark[] }>>();
    
    // Debug: Log all selected trademarks
    console.log('=== EMAIL TEMPLATES PAGE: Processing selected trademarks ===');
    console.log('Total selected trademarks:', selectedTrademarks.length);
    console.log('Selected trademarks data:', selectedTrademarks.map(({ sim, entryIndex }) => ({
      mark: sim.mark,
      applicant: sim.applicant_name,
      entryIndex
    })));
    
    const applicantNamesFound = new Set<string>();
    
    selectedTrademarks.forEach(({ entry, sim, entryIndex }, index) => {
      // Normalize applicant name: trim, handle empty strings
      let applicantName = sim.applicant_name?.trim() || '';
      if (applicantName === '') {
        applicantName = 'Unknown';
      }
      
      applicantNamesFound.add(applicantName);
      
      console.log(`Processing trademark ${index + 1}: "${sim.mark}" for applicant "${applicantName}" (Entry ${entryIndex})`);
      
      if (!grouped.has(applicantName)) {
        grouped.set(applicantName, new Map());
      }
      
      const applicantEntries = grouped.get(applicantName)!;
      if (!applicantEntries.has(entryIndex)) {
        applicantEntries.set(entryIndex, {
          entry,
          similarTrademarks: []
        });
      }
      
      applicantEntries.get(entryIndex)!.similarTrademarks.push(sim);
    });

    // Debug: Log grouping results
    console.log('Applicant names found:', Array.from(applicantNamesFound));
    console.log('Groups created:', grouped.size);
    grouped.forEach((entries, applicantName) => {
      console.log(`Applicant "${applicantName}": ${entries.size} journal entries, ${Array.from(entries.values()).reduce((sum, e) => sum + e.similarTrademarks.length, 0)} similar trademarks`);
    });

    // Convert to array and fetch emails
    const groups: ApplicantGroup[] = Array.from(grouped.entries()).map(([applicantName, entries]) => ({
      applicantName,
      email: null,
      loading: true,
      entries
    }));

    // Verify all trademarks are included
    const totalTrademarksInGroups = groups.reduce((sum, group) => {
      return sum + Array.from(group.entries.values()).reduce((entrySum, entry) => entrySum + entry.similarTrademarks.length, 0);
    }, 0);
    
    console.log(`Total selected: ${selectedTrademarks.length}, Total in groups: ${totalTrademarksInGroups}`);
    if (totalTrademarksInGroups !== selectedTrademarks.length) {
      console.warn('Mismatch: Some trademarks may be missing from groups!');
    }

    setApplicantGroups(groups);
    setLoading(false);

    // Fetch emails for each applicant
    groups.forEach(async (group, index) => {
      try {
        const email = await getApplicantEmail(group.applicantName);
        setApplicantGroups((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], email, loading: false };
          return updated;
        });
      } catch (err) {
        setApplicantGroups((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], email: null, loading: false };
          return updated;
        });
      }
    });
  }, [selectedTrademarks, reportData]);

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
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });
    } catch {
      return dateString;
    }
  };

  const formatOppositionDeadline = (mondayDate: string) => {
    try {
      const date = parseServerDate(mondayDate);
      // Add 4 months for opposition deadline
      date.setMonth(date.getMonth() + 4);
      return date.toLocaleDateString('en-IN', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatJournalInfo = (mondayDate: string, pdfSource?: string) => {
    // Try to extract journal number from pdf_source if available
    // Format: "Journal_2237_CLASS 1 - 30_page86_img39.png" or similar
    let journalNumber = '';
    if (pdfSource) {
      const match = pdfSource.match(/Journal_(\d+)/);
      if (match) {
        journalNumber = match[1];
      }
    }
    
    const formattedDate = formatDate(mondayDate);
    return journalNumber ? `${journalNumber} ${formattedDate}` : formattedDate;
  };

  const formatPdfSource = (pdfSource?: string): string => {
    if (!pdfSource) return 'N/A';
    
    // Remove .pdf extension if present
    let formatted = pdfSource.replace(/\.pdf$/i, '');
    
    // Replace underscores with spaces
    formatted = formatted.replace(/_/g, ' ');
    
    // Clean up multiple spaces
    formatted = formatted.replace(/\s+/g, ' ').trim();
    
    return formatted;
  };

  const generateEmailTemplate = (
    applicantName: string,
    entries: Map<number, { entry: JournalTrademarkEntry; similarTrademarks: SimilarTrademark[] }>,
    mondayDate: string
  ): string => {
    let template = `Dear Sir/Ma'am,\n\n`;
    template += `We wish to draw your immediate attention to an application advertised in Trademark Journal, details of which are appearing herein below:\n\n`;

    // Generate tabular section for each journal entry
    const entriesArray = Array.from(entries.entries());
    entriesArray.forEach(([entryIndex, { entry, similarTrademarks }], arrayIndex) => {
      // Journal trademark information in plain text tabular format
      template += `Trademark: ${entry.mark_name || entry.mark || 'N/A'}\n`;
      template += `Class: ${entry.trademark_class || 'N/A'}\t\t\n`;
      template += `Source PDF Journal: ${formatPdfSource(entry.pdf_source)}\n`;
      template += `Trademark Journal Date: ${formatJournalInfo(mondayDate, entry.pdf_source)}\t\n`;
      template += `Page No: ${entry.page_number || 'N/A'}\n\n`;
      
      template += `The aforesaid advertised trademark conflict with your following Registered Trademark.\n\n`;

      // Table of similar trademarks in plain text format
      similarTrademarks.forEach((sim) => {
        let classValue = sim.trademark_class || 'N/A';
        // Remove "Class " prefix if present to avoid "Class Class 5"
        if (typeof classValue === 'string' && classValue.startsWith('Class ')) {
          classValue = classValue.substring(6); // Remove "Class " (6 characters)
        }
        template += `Trademark: ${sim.mark || 'N/A'}\n`;
        template += `Class: ${classValue}\n`;
        template += `\n`;
      });
      
      // Add proper spacing between different journal entries (except for the last one)
      if (arrayIndex < entriesArray.length - 1) {
        template += `\n`;
      }
    });

    const deadline = formatOppositionDeadline(mondayDate);
    template += `We are of the opinion that you should take necessary action to prevent the registration of the said trade mark, for which you need to file a Notice of Opposition on or before ${deadline}.\n\n`;
    template += `If you wish to file a Notice of Opposition, kindly let us have your necessary instructions in this regard.\n\n`;
    template += `Should you need further assistance in this regard, please feel free to contact us.\n\n`;
    template += `Kindly, acknowledge safe receipt of this email.\n\n\n\n`;
    template += `Thanks and Regards,`;

    return template;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h2 className="text-xl font-bold">Error</h2>
            </div>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => router.push(`/app/report/${reportId}`)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Templates</h1>
            <p className="text-gray-600">
              {selectedTrademarks.length} trademark(s) selected across {applicantGroups.length} applicant(s)
            </p>
          </div>
          <button
            onClick={() => router.push(`/app/report/${reportId}`)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            Back to Report
          </button>
        </div>

        {/* Email Templates */}
        <div className="space-y-6">
          {applicantGroups.map((group, groupIndex) => {
            const emailTemplate = reportData 
              ? generateEmailTemplate(group.applicantName, group.entries, reportData.monday_date)
              : '';

            return (
              <div key={groupIndex} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{group.applicantName}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {group.loading ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            Fetching email...
                          </span>
                        ) : group.email ? (
                          <span className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                              <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            {group.email}
                          </span>
                        ) : (
                          <span className="text-orange-600 flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="12"></line>
                              <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            Email not found
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {group.email && (
                        <button
                          onClick={() => copyToClipboard(group.email!)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          Copy Email
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(emailTemplate)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy Template
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email Template Preview */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                    {emailTemplate}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


