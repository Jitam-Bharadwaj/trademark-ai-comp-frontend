'use client';

import { useState, useRef } from 'react';
import { processPdf } from '@/lib/api';

export default function PDFProcessingTab() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveImages, setSaveImages] = useState(true);
  const [autoIndex, setAutoIndex] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please drop a valid PDF file');
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await processPdf(file, saveImages, autoIndex);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'PDF processing failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">PDF Processing</h2>
        <p className="text-gray-600 text-base">Upload a PDF to extract and index trademark images</p>
      </div>

      {/* Upload Section */}
      <div className="space-y-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all bg-gray-50/50"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          {!file ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center">
                  <svg
                    className="text-red-600"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-700 mb-1">
                  Click to upload or drag & drop a PDF
                </div>
                <div className="text-sm text-gray-500">Supports PDF files up to 100MB</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="px-6 py-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <svg
                      className="text-red-600"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                    </svg>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{file.name}</div>
                      <div className="text-sm text-gray-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setResults(null);
                }}
                className="text-sm text-red-600 hover:text-red-700 font-semibold"
              >
                Remove File
              </button>
            </div>
          )}
        </div>

        {/* Options Section */}
        <div className="p-8 bg-gray-50 rounded-xl border border-gray-200 space-y-5">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">
            Processing Options
          </h3>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={saveImages}
              onChange={(e) => setSaveImages(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
            />
            <span className="text-gray-700 group-hover:text-gray-900 font-medium">
              Save extracted images to disk
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={autoIndex}
              onChange={(e) => setAutoIndex(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
            />
            <span className="text-gray-700 group-hover:text-gray-900 font-medium">
              Automatically index extracted images
            </span>
          </label>
        </div>

        {/* Process Button */}
        <button
          onClick={handleProcess}
          disabled={!file || loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Process PDF'
          )}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-bold">Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results && (
        <div className="space-y-6">
          <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-lg">
            <div className="font-semibold mb-1">PDF Processing Complete!</div>
            <div className="text-sm space-y-1">
              <div><strong>File:</strong> {results.pdf_filename}</div>
              <div><strong>Images Extracted:</strong> {results.total_images_extracted}</div>
              <div><strong>Images Indexed:</strong> {results.images_indexed}</div>
              <div>
                <strong>Processing Time:</strong> {results.total_processing_time_ms?.toFixed(2)}ms
              </div>
            </div>
          </div>

          {results.images && results.images.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Extracted Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.images.map((image: any, index: number) => (
                  <div
                    key={index}
                    className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                      <div className="font-mono text-xs text-gray-500">{image.image_id}</div>
                      <div className="text-sm font-semibold text-gray-700">Page {image.page}</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dimensions:</span>
                        <span className="font-medium text-gray-900">
                          {image.width} × {image.height}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Method:</span>
                        <span className="font-medium text-gray-900">{image.extraction_method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Source:</span>
                        <span className="font-medium text-gray-900">
                          {image.metadata?.source || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.indexing_errors > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg">
              <div className="font-semibold mb-2">Indexing Errors: {results.indexing_errors}</div>
              {results.indexing_error_details && (
                <div className="text-sm space-y-1">
                  {results.indexing_error_details.slice(0, 5).map((error: string, index: number) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
