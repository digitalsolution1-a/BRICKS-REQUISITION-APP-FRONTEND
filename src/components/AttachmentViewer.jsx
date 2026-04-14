import React from 'react';

const AttachmentViewer = ({ url }) => {
  if (!url) return <p className="text-gray-500 italic">No attachment provided</p>;

  // Cloudinary often serves PDFs with a .pdf extension or 'raw' in the path
  const isPDF = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('/raw/');

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="text-sm font-bold text-gray-700 mb-2">Supporting Document:</h4>
      {isPDF ? (
        <div className="w-full h-[500px] border rounded-lg overflow-hidden bg-gray-100">
          <iframe
            src={`${url}#view=FitH`}
            title="Document Preview"
            className="w-full h-full"
          />
        </div>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img 
            src={url} 
            alt="Attachment" 
            className="max-w-full h-auto rounded-lg shadow-md hover:opacity-90 transition-opacity" 
          />
        </a>
      )}
      <div className="mt-2 text-center">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-600 underline hover:text-blue-800"
        >
          Open in new tab
        </a>
      </div>
    </div>
  );
};

export default AttachmentViewer;
