-- Permitir que anon visualize condomínios durante o registro
-- Isso é necessário porque o .insert().select() precisa de permissão SELECT
CREATE POLICY "Anon can view condominium during registration"
ON public.condominiums
FOR SELECT
TO anon
USING (status = 'pending');