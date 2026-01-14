import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  uploading: boolean;
  url?: string;
  error?: string;
}

interface AttachmentUploadProps {
  purchaseRequestId?: string;
  onFilesChange?: (files: { url: string; name: string; type: 'image' | 'pdf' | 'quote'; size: number }[]) => void;
  maxFiles?: number;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_PDF_TYPES = ['application/pdf'];

export function AttachmentUpload({
  purchaseRequestId,
  onFilesChange,
  maxFiles = 10,
}: AttachmentUploadProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isPDF = ACCEPTED_PDF_TYPES.includes(file.type);

    if (!isImage && !isPDF) {
      return 'Formato não suportado. Use JPG, PNG, WebP ou PDF.';
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return 'Imagem muito grande. Máximo 5MB.';
    }

    if (isPDF && file.size > MAX_PDF_SIZE) {
      return 'PDF muito grande. Máximo 10MB.';
    }

    return null;
  };

  const uploadFile = async (uploadedFile: UploadedFile): Promise<string | null> => {
    if (!user) return null;

    const isImage = ACCEPTED_IMAGE_TYPES.includes(uploadedFile.file.type);
    const extension = uploadedFile.file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    const { data, error } = await supabase.storage
      .from('purchase-attachments')
      .upload(fileName, uploadedFile.file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Generate signed URL instead of public URL (bucket is private)
    const { data: signedUrlData } = await supabase.storage
      .from('purchase-attachments')
      .createSignedUrl(data.path, 86400); // 24 hour expiry

    return signedUrlData?.signedUrl || null;
  };

  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    if (files.length + fileArray.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} arquivos permitido.`);
      return;
    }

    const validFiles: UploadedFile[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);

      const uploadedFile: UploadedFile = {
        id: Math.random().toString(36).substring(7),
        file,
        preview: isImage ? URL.createObjectURL(file) : undefined,
        progress: 0,
        uploading: true,
        error: error || undefined,
      };

      if (!error) {
        validFiles.push(uploadedFile);
      } else {
        toast.error(`${file.name}: ${error}`);
      }
    }

    if (validFiles.length === 0) return;

    setFiles((prev) => [...prev, ...validFiles]);

    // Upload files
    for (const uploadedFile of validFiles) {
      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id && f.progress < 90
                ? { ...f, progress: f.progress + 10 }
                : f
            )
          );
        }, 100);

        const url = await uploadFile(uploadedFile);

        clearInterval(progressInterval);

        if (url) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, url, progress: 100, uploading: false }
                : f
            )
          );
        }
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? { ...f, error: 'Erro no upload', uploading: false }
              : f
          )
        );
        toast.error(`Erro ao enviar ${uploadedFile.file.name}`);
      }
    }
  }, [files.length, maxFiles, user]);

  // Update parent when files change
  const getUploadedFiles = () => {
    return files
      .filter((f) => f.url && !f.error)
      .map((f) => ({
        url: f.url!,
        name: f.file.name,
        type: (ACCEPTED_PDF_TYPES.includes(f.file.type) ? 'pdf' : 'image') as 'image' | 'pdf' | 'quote',
        size: f.file.size,
      }));
  };

  // Notify parent of changes
  const notifyParent = useCallback(() => {
    if (onFilesChange) {
      onFilesChange(getUploadedFiles());
    }
  }, [onFilesChange, files]);

  // Effect to notify parent
  useState(() => {
    const uploadedFiles = files.filter((f) => f.url && !f.uploading);
    if (uploadedFiles.length > 0) {
      notifyParent();
    }
  });

  const removeFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
    
    // Notify parent after removal
    setTimeout(() => {
      if (onFilesChange) {
        const remainingFiles = files
          .filter((f) => f.id !== id && f.url && !f.error)
          .map((f) => ({
            url: f.url!,
            name: f.file.name,
            type: (ACCEPTED_PDF_TYPES.includes(f.file.type) ? 'pdf' : 'image') as 'image' | 'pdf' | 'quote',
            size: f.file.size,
          }));
        onFilesChange(remainingFiles);
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_PDF_TYPES].join(',')}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Arraste arquivos ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Imagens (JPG, PNG, WebP) até 5MB • PDFs até 10MB • Máximo {maxFiles} arquivos
            </p>
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg border
                ${file.error ? 'border-destructive bg-destructive/5' : 'border-border'}
              `}
            >
              {/* Preview or icon */}
              <div className="w-10 h-10 rounded overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : ACCEPTED_PDF_TYPES.includes(file.file.type) ? (
                  <FileText className="h-5 w-5 text-red-500" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.file.size / 1024).toFixed(1)} KB
                </p>
                {file.uploading && (
                  <Progress value={file.progress} className="h-1 mt-1" />
                )}
                {file.error && (
                  <p className="text-xs text-destructive">{file.error}</p>
                )}
              </div>

              {/* Status / Remove */}
              <div className="flex-shrink-0">
                {file.uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
