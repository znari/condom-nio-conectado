-- Allow anonymous users to view service calls via valid temporary link
CREATE POLICY "Anon can view service call via temporary link"
ON public.service_calls FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.temporary_links tl
    WHERE tl.service_call_id = service_calls.id
    AND tl.expires_at > now()
  )
);

-- Allow anonymous users to update quote fields on service calls via valid temporary link
CREATE POLICY "Anon can update service call quote via temporary link"
ON public.service_calls FOR UPDATE
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.temporary_links tl
    WHERE tl.service_call_id = service_calls.id
    AND tl.type = 'quote'
    AND tl.expires_at > now()
    AND tl.used_at IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.temporary_links tl
    WHERE tl.service_call_id = service_calls.id
    AND tl.type = 'quote'
    AND tl.expires_at > now()
    AND tl.used_at IS NULL
  )
);

-- Allow anonymous users to view condominiums for displaying name on quote page
CREATE POLICY "Anon can view condominium via temporary link"
ON public.condominiums FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.service_calls sc
    JOIN public.temporary_links tl ON tl.service_call_id = sc.id
    WHERE sc.condominium_id = condominiums.id
    AND tl.expires_at > now()
  )
);