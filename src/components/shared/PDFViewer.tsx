import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker source locally for Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export const PDFViewer = ({ url, scale = 1.0 }: { url: string, scale?: number }) => {
  const [numPages, setNumPages] = useState<number>();
  const isMobile = useIsMobile();

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-4">
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(error) => console.error('PDF load error:', error)}
        loading={
          <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Loading PDF document...</p>
          </div>
        }
        error={
          <div className="p-10 text-red-500 bg-red-50 rounded-xl text-center">
            <p className="font-semibold">Failed to load PDF</p>
            <p className="text-sm">Please check the document URL or try refreshing.</p>
          </div>
        }
      >
        {Array.from(new Array(numPages), (el, index) => (
          <div key={`page_${index + 1}`} className="mb-6 rounded-lg overflow-hidden shadow-sm border border-black/5 bg-white flex justify-center">
            <Page
              pageNumber={index + 1}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              width={isMobile ? window.innerWidth - 32 : undefined}
              scale={scale}
              className="max-w-full"
            />
          </div>
        ))}
      </Document>
    </div>
  );
};
