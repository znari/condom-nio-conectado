-- Adicionar campo logo_url na tabela condominiums
ALTER TABLE public.condominiums ADD COLUMN logo_url TEXT;

-- Criar bucket para logos dos condomínios
INSERT INTO storage.buckets (id, name, public) 
VALUES ('condominium-logos', 'condominium-logos', true);

-- Política: Managers podem fazer upload do logo do próprio condomínio
CREATE POLICY "Managers can upload their condominium logo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'condominium-logos' 
  AND (storage.foldername(name))[1] = get_user_condominium_id(auth.uid())::text
);

-- Política: Qualquer um pode visualizar logos (público)
CREATE POLICY "Anyone can view condominium logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'condominium-logos');

-- Política: Managers podem atualizar logo do próprio condomínio
CREATE POLICY "Managers can update their condominium logo"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'condominium-logos' 
  AND (storage.foldername(name))[1] = get_user_condominium_id(auth.uid())::text
);

-- Política: Managers podem deletar logo do próprio condomínio
CREATE POLICY "Managers can delete their condominium logo"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'condominium-logos' 
  AND (storage.foldername(name))[1] = get_user_condominium_id(auth.uid())::text
);