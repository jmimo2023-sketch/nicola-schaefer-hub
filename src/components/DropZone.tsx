import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface DropZoneProps {
  onFileUpload: (file: File) => void;
  accept?: string;
  disabled?: boolean;
}

export function DropZone({ onFileUpload, accept = 'image/*', disabled = false }: DropZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    disabled,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
        transition-all duration-200 ease-out
        ${disabled ? 'opacity-50 cursor-not-allowed border-brd' : ''}
        ${isDragActive && !isDragReject ? 'border-accent bg-accent/5 scale-[1.02]' : ''}
        ${isDragReject ? 'border-red-500 bg-red-50' : 'border-brd hover:border-accent hover:bg-accent/5'}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {isDragActive ? (
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
            <ImageIcon className="w-7 h-7 text-accent" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-brd flex items-center justify-center">
            <Upload className="w-7 h-7 text-ink-muted" />
          </div>
        )}
        <div>
          {isDragActive ? (
            <p className="text-sm font-medium text-accent">Suelta la imagen aquí</p>
          ) : (
            <>
              <p className="text-sm font-medium text-ink">Arrastra una imagen aquí</p>
              <p className="text-xs text-ink-muted mt-1">o haz clic para seleccionar</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}