-- Create attachment type enum
CREATE TYPE public.attachment_type AS ENUM ('image', 'pdf', 'quote');

-- Create purchase_request_attachments table
CREATE TABLE public.purchase_request_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type public.attachment_type NOT NULL DEFAULT 'image',
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_purchase_attachments_request_id ON public.purchase_request_attachments(purchase_request_id);

-- Enable RLS
ALTER TABLE public.purchase_request_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view attachments from their condominium"
ON public.purchase_request_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.purchase_requests pr
    WHERE pr.id = purchase_request_attachments.purchase_request_id
    AND pr.condominium_id = get_user_condominium_id(auth.uid())
  )
);

CREATE POLICY "Users can insert attachments to their condominium requests"
ON public.purchase_request_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.purchase_requests pr
    WHERE pr.id = purchase_request_attachments.purchase_request_id
    AND pr.condominium_id = get_user_condominium_id(auth.uid())
  )
  AND uploaded_by = auth.uid()
);

CREATE POLICY "Users can delete their own attachments"
ON public.purchase_request_attachments
FOR DELETE
USING (uploaded_by = auth.uid());

CREATE POLICY "Super admin can manage all attachments"
ON public.purchase_request_attachments
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create storage bucket for purchase attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('purchase-attachments', 'purchase-attachments', true);

-- Storage policies
CREATE POLICY "Anyone can view purchase attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'purchase-attachments');

CREATE POLICY "Authenticated users can upload purchase attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'purchase-attachments' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own purchase attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'purchase-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);