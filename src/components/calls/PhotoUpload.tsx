import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  serviceCallId?: string;
  type: "initial" | "completion";
  onPhotosChange: (urls: string[]) => void;
  existingPhotos?: string[];
  maxPhotos?: number;
  minPhotos?: number;
}

export function PhotoUpload({ 
  serviceCallId, 
  type, 
  onPhotosChange, 
  existingPhotos = [], 
  maxPhotos = 5,
  minPhotos = 1 
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = maxPhotos - photos.length - pendingFiles.length;
    
    if (files.length > remainingSlots) {
      toast.error(`Você pode adicionar no máximo ${remainingSlots} foto(s)`);
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} não é uma imagem válida`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} é muito grande (máx. 5MB)`);
        return false;
      }
      return true;
    });

    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    setPendingFiles(prev => [...prev, ...validFiles]);
  }, [photos.length, pendingFiles.length, maxPhotos]);

  const uploadPendingFiles = async (callId: string) => {
    if (pendingFiles.length === 0) return photos;

    setUploading(true);
    const uploadedUrls: string[] = [...photos];

    try {
      for (const file of pendingFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${callId}/${type}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("service-call-photos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("service-call-photos")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      setPhotos(uploadedUrls);
      setPendingFiles([]);
      setPreviewUrls([]);
      onPhotosChange(uploadedUrls);
      return uploadedUrls;
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao fazer upload das fotos");
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number, isPending: boolean) => {
    if (isPending) {
      URL.revokeObjectURL(previewUrls[index]);
      setPreviewUrls(prev => prev.filter((_, i) => i !== index));
      setPendingFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      const newPhotos = photos.filter((_, i) => i !== index);
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
    }
  };

  const allPhotos = [...photos, ...previewUrls];
  const canAddMore = allPhotos.length < maxPhotos;

  // Expose upload function to parent
  (window as any)[`uploadPhotos_${type}`] = uploadPendingFiles;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {minPhotos > 0 ? `Mínimo ${minPhotos} foto(s)` : "Opcional"} • Máximo {maxPhotos} fotos
        </p>
        <span className="text-sm font-medium">
          {allPhotos.length}/{maxPhotos}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {photos.map((url, index) => (
          <div key={`uploaded-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-border">
            <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(index, false)}
              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {previewUrls.map((url, index) => (
          <div key={`pending-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-dashed border-primary">
            <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover opacity-75" />
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <span className="text-xs text-primary font-medium">Pendente</span>
            </div>
            <button
              type="button"
              onClick={() => removePhoto(index, true)}
              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {canAddMore && (
          <label className={cn(
            "aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors",
            uploading && "pointer-events-none opacity-50"
          )}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Adicionar</span>
              </>
            )}
          </label>
        )}
      </div>

      {pendingFiles.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {pendingFiles.length} foto(s) serão enviadas ao criar o chamado
        </p>
      )}
    </div>
  );
}
