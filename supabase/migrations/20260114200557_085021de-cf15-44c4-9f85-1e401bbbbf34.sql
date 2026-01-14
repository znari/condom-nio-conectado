-- Remover a política existente (RESTRICTIVE)
DROP POLICY IF EXISTS "Anyone can insert condominium for registration" ON condominiums;

-- Criar nova política como PERMISSIVE (padrão é PERMISSIVE)
CREATE POLICY "Anyone can insert condominium for registration"
ON condominiums
FOR INSERT
TO anon, authenticated
WITH CHECK (true);