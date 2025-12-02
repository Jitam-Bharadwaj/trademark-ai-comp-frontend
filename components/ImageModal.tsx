'use client';

interface ImageModalProps {
  image: {
    src: string;
    id: string;
    similarity: number;
    metadata: any;
  };
  onClose: () => void;
}

export default function ImageModal({ image, onClose }: ImageModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Trademark: {image.id}</h3>
            <div className="text-blue-100 text-sm mt-1">
              Similarity: {(image.similarity * 100).toFixed(1)}%
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-lg flex items-center justify-center transition-all font-bold text-xl"
          >
            ×
          </button>
        </div>

        {/* Image */}
        <div className="bg-gray-100 flex items-center justify-center p-8">
          <img
            src={image.src}
            alt={image.id}
            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-xl"
          />
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Name
              </div>
              <div className="text-gray-900 font-medium">{image.metadata.name || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Class
              </div>
              <div className="text-gray-900 font-medium">
                {image.metadata.trademark_class || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Source
              </div>
              <div className="text-gray-900 font-medium">{image.metadata.source || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
