import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Download, ExternalLink, Image as ImageIcon, X } from 'lucide-react';

interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
  file_type: 'image' | 'pdf' | 'quote';
  file_size: number | null;
}

interface AttachmentGalleryProps {
  attachments: Attachment[];
}

export function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null);

  if (attachments.length === 0) {
    return null;
  }

  const images = attachments.filter((a) => a.file_type === 'image');
  const documents = attachments.filter((a) => a.file_type !== 'image');

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Image Gallery */}
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            Imagens ({images.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {images.map((attachment) => (
              <button
                key={attachment.id}
                onClick={() => setSelectedImage(attachment)}
                className="relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors group"
              >
                <img
                  src={attachment.file_url}
                  alt={attachment.file_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ExternalLink className="h-5 w-5 text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Documentos ({documents.length})
          </h4>
          <div className="space-y-2">
            {documents.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="w-10 h-10 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(attachment.file_url, attachment.file_name)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Baixar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {selectedImage?.file_name}
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            {selectedImage && (
              <img
                src={selectedImage.file_url}
                alt={selectedImage.file_name}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => selectedImage && handleDownload(selectedImage.file_url, selectedImage.file_name)}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
            <Button
              variant="outline"
              onClick={() => selectedImage && window.open(selectedImage.file_url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em nova aba
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
