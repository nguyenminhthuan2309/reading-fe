import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, File, FileText, AlertCircle } from 'lucide-react';
import useDocumentConverter from '@/lib/hooks/useDocumentConverter';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import TiptapEditor from '@/components/editor/TiptapEditor';

interface DocumentUploaderProps {
  onContentConverted: (jsonContent: string) => void;
  disabled?: boolean;
}

export function DocumentUploader({ onContentConverted, disabled = false }: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { convertFileToJson, isConverting, lastResult } = useDocumentConverter();
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      
      // Automatically start conversion when file is selected
      await handleConvert(selectedFile);
    }
  };

  const handleUploadClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleConvert = async (fileToConvert: File | null = null) => {
    if (disabled) return;
    const fileToUse = fileToConvert || file;
    
    if (!fileToUse) {
      setError('Please select a file first');
      return;
    }

    try {
      const result = await convertFileToJson(fileToUse);
      
      if (result.success) {
        setPreviewContent(result.content);
        setShowPreview(true);
        
        // Don't call onContentConverted yet, let the user preview and edit first
      } else {
        setError(result.error || 'Failed to convert file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  const handleContentChange = (newContent: string) => {
    if (disabled) return;
    setPreviewContent(newContent);
  };

  const handleConfirm = () => {
    if (disabled) return;
    onContentConverted(previewContent);
  };

  const getFileIcon = () => {
    if (!file) return <Upload size={24} />;
    
    if (file.type === 'application/pdf') {
      return <File size={24} />;
    } else if (file.type.includes('word') || file.type.includes('openxmlformats-officedocument')) {
      return <FileText size={24} />;
    } else {
      return <FileText size={24} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-md p-6 text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".txt,.pdf,.doc,.docx"
        />
        
        <div 
          onClick={handleUploadClick}
          className={`border-2 border-dashed border-yellow-500 dark:border-yellow-500 rounded-md p-8 transition-colors ${
            disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-yellow-50/50 dark:hover:bg-yellow-900/10 cursor-pointer'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            {getFileIcon()}
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              {file ? file.name : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: TXT, PDF, DOC, DOCX
            </p>
          </div>
        </div>
      </div>
      
      {isConverting && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Spinner size="sm" />
          <p className="text-sm">Converting document...</p>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {showPreview && previewContent && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Preview & Edit</h3>
          <div className="border rounded-md">
            <TiptapEditor 
              content={previewContent}
              onChange={handleContentChange}
              editable={!disabled}
            />
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleConfirm} disabled={disabled}>
              Confirm and Use Content
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 