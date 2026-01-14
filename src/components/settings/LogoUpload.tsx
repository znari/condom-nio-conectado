import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, Camera, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LogoUploadProps {
  condominiumId: string;
  currentLogoUrl: string | null;
  onLogoChange: (url: string | null) => void;
}

export function LogoUpload({ condominiumId, currentLogoUrl, onLogoChange }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl || currentLogoUrl;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WEBP.');
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo 2MB.');
      return;
    }

    // Preview local
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${condominiumId}/logo.${fileExt}`;

      // Remove logo anterior se existir
      if (currentLogoUrl) {
        const oldPath = currentLogoUrl.split('/condominium-logos/')[1];
        if (oldPath) {
          await supabase.storage.from('condominium-logos').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('condominium-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('condominium-logos')
        .getPublicUrl(fileName);

      // Atualiza no banco
      const { error: updateError } = await supabase
        .from('condominiums')
        .update({ logo_url: publicUrl })
        .eq('id', condominiumId);

      if (updateError) throw updateError;

      onLogoChange(publicUrl);
      toast.success('Logo atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload do logo.');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }

    // Limpa input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentLogoUrl) return;

    setUploading(true);
    try {
      const path = currentLogoUrl.split('/condominium-logos/')[1];
      if (path) {
        await supabase.storage.from('condominium-logos').remove([path]);
      }

      const { error } = await supabase
        .from('condominiums')
        .update({ logo_url: null })
        .eq('id', condominiumId);

      if (error) throw error;

      onLogoChange(null);
      setPreviewUrl(null);
      toast.success('Logo removido com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover logo:', error);
      toast.error('Erro ao remover logo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Preview do Logo */}
        <div 
          className={cn(
            "relative w-32 h-32 rounded-full border-2 border-dashed border-muted-foreground/30",
            "flex items-center justify-center bg-muted overflow-hidden",
            "group cursor-pointer hover:border-primary transition-colors"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          {displayUrl ? (
            <>
              <img 
                src={displayUrl} 
                alt="Logo do condomínio" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Building2 className="w-12 h-12" />
              <span className="text-xs">Sem logo</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Botões e Instruções */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {currentLogoUrl ? 'Trocar Logo' : 'Enviar Logo'}
            </Button>
            {currentLogoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
                disabled={uploading}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG ou WEBP. Máximo 2MB.<br />
            Recomendado: 200x200 pixels.
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
