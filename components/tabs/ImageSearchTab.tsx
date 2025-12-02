'use client';

import { useState, useRef } from 'react';
import { searchTrademarks } from '@/lib/api';
import ImageModal from '../ImageModal';

interface SearchResult {
  trademark_id: string;
  similarity_score: number;
  metadata: {
    name?: string;
    trademark_class?: string;
    source?: string;
    original_filename?: string;
  };
}

interface ResultItemProps {
  result: SearchResult;
  index: number;
  API_BASE: string;
  onImageClick: (image: { src: string; id: string; similarity: number; metadata: any }) => void;
}

function ResultItem({ result, index, API_BASE, onImageClick }: ResultItemProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = `${API_BASE}/image/${result.trademark_id}`;

  return (
    <div
      className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all hover:border-blue-300"
    >
      <div className="flex items-start gap-6">
        {/* Image */}
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="w-40 h-40 bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden">
              {!imageError ? (
                <img
                  src={imageUrl}
                  alt={`Trademark ${result.trademark_id}`}
                  className="w-full h-full object-cover cursor-pointer hover:shadow-lg transition-all"
                  onClick={() =>
                    onImageClick({
                      src: imageUrl,
                      id: result.trademark_id,
                      similarity: result.similarity_score,
                      metadata: result.metadata,
                    })
                  }
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21,15 16,10 5,21"></polyline>
                  </svg>
                  <div className="text-xs font-medium">Image not available</div>
                </div>
              )}
            </div>
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full font-bold text-xs shadow-lg z-10">
              {(result.similarity_score * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-sm text-gray-500 mb-1">ID</div>
              <div className="font-semibold text-gray-900">{result.trademark_id}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Name
              </div>
              <div className="text-sm text-gray-900">{result.metadata.name || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Class
              </div>
              <div className="text-sm text-gray-900">
                {result.metadata.trademark_class || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Source
              </div>
              <div className="text-sm text-gray-900">{result.metadata.source || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Filename
              </div>
              <div className="text-sm text-gray-900 truncate">
                {result.metadata.original_filename || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImageSearchTab() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [topK, setTopK] = useState(10);
  const [threshold, setThreshold] = useState(0.5);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    id: string;
    similarity: number;
    metadata: any;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(droppedFile);
    }
  };

  const handleSearch = async () => {
    if (!file) {
      setError('Please select an image file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await searchTrademarks(file, topK, threshold);
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Search Similar Trademarks</h2>
        <p className="text-gray-600 text-base">Upload an image to find similar trademarks in the database</p>
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
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {!preview ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <svg
                    className="text-blue-600"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21,15 16,10 5,21"></polyline>
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-700 mb-1">
                  Click to upload or drag & drop an image
                </div>
                <div className="text-sm text-gray-500">Supports JPG, PNG, GIF formats (Max 100MB)</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-w-md w-full h-auto rounded-lg shadow-lg border-4 border-blue-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">{file?.name}</div>
                <div className="text-xs text-gray-500">
                  {(file?.size ? file.size / 1024 / 1024 : 0).toFixed(2)} MB
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreview(null);
                    setResults([]);
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-semibold"
                >
                  Remove File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-gray-50 rounded-xl border border-gray-200">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Number of Results
            </label>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="5">5 results</option>
              <option value="10">10 results</option>
              <option value="20">20 results</option>
              <option value="50">50 results</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Similarity Threshold (0.0 - 1.0)
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={!file || loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </>
          ) : (
            'Search Trademarks'
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
      {results.length > 0 && (
        <div className="space-y-6">
          <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-lg">
            <div className="font-semibold">Found {results.length} similar trademark(s)</div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {results.map((result, index) => (
              <ResultItem
                key={index}
                result={result}
                index={index}
                API_BASE={API_BASE}
                onImageClick={setSelectedImage}
              />
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
