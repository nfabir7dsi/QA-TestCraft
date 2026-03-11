import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfViewerModal = ({ isOpen, onClose, fileUrl, fileName }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState(false);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
    setLoadError(false);
  };

  const onDocumentLoadError = () => {
    setLoadError(true);
  };

  const goToPrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(numPages || 1, prev + 1));

  const handleClose = () => {
    setNumPages(null);
    setCurrentPage(1);
    setLoadError(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3 min-w-0">
          <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-white font-medium truncate">{fileName}</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Page navigation */}
          {numPages && (
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-gray-300 text-sm">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage >= numPages}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          {/* Download */}
          <a
            href={fileUrl}
            download={fileName}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
            title="Download"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
          {/* Close */}
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto flex justify-center p-4 bg-gray-900">
        {loadError ? (
          <div className="flex flex-col items-center justify-center text-center">
            <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-gray-400 text-lg mb-2">Failed to load PDF</p>
            <a
              href={fileUrl}
              download={fileName}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Download file instead
            </a>
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-2xl"
              width={Math.min(800, window.innerWidth - 80)}
            />
          </Document>
        )}
      </div>
    </div>
  );
};

export default PdfViewerModal;
