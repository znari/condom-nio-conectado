-- Fix 1: Make storage buckets private (service-call-photos and purchase-attachments)
UPDATE storage.buckets SET public = false WHERE id IN ('service-call-photos', 'purchase-attachments');

-- Fix 2: Drop overly permissive policies on temporary_links
DROP POLICY IF EXISTS "Anon can view temporary links" ON public.temporary_links;
DROP POLICY IF EXISTS "Anon can update temporary links" ON public.temporary_links;

-- Fix 3: Drop overly permissive notification insert policy and add proper restrictions
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Allow managers to notify users in their condominium
CREATE POLICY "Managers can notify condominium users"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (
  user_id IN (
    SELECT p.id FROM profiles p
    WHERE p.condominium_id = get_user_condominium_id(auth.uid())
  )
);

-- Allow super admins to notify anyone
CREATE POLICY "Super admin can notify anyone"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Fix 4: Drop overly permissive anon view on condominiums for registration
DROP POLICY IF EXISTS "Anon can view condominium during registration" ON public.condominiums;

-- Fix 5: Drop overly permissive service_call_photos policy and add proper validation
DROP POLICY IF EXISTS "Anon can view photos via temporary link" ON public.service_call_photos;

-- Create proper policy that validates temporary link exists for the service call
CREATE POLICY "Anon can view photos via valid temporary link"
ON public.service_call_photos FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.temporary_links tl
    WHERE tl.service_call_id = service_call_photos.service_call_id
    AND tl.expires_at > now()
    AND tl.used_at IS NULL
  )
);