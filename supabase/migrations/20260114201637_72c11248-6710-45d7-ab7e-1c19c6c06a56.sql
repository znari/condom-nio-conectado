-- Enum para status da solicitação
CREATE TYPE purchase_request_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'purchased',
  'cancelled'
);

-- Enum para categoria da compra
CREATE TYPE purchase_category AS ENUM (
  'limpeza',
  'manutencao',
  'equipamento',
  'ferramentas',
  'jardinagem',
  'eletrico',
  'hidraulico',
  'seguranca',
  'escritorio',
  'outros'
);

-- Enum para prioridade
CREATE TYPE purchase_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Tabela principal
CREATE TABLE purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  
  -- Informações do item
  title TEXT NOT NULL,
  description TEXT,
  category purchase_category NOT NULL DEFAULT 'outros',
  priority purchase_priority NOT NULL DEFAULT 'medium',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'un',
  
  -- Valores
  estimated_value NUMERIC,
  actual_value NUMERIC,
  
  -- Status e aprovação
  status purchase_request_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  
  -- Rastreamento
  created_by UUID NOT NULL REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  purchased_at TIMESTAMP WITH TIME ZONE,
  purchase_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_purchase_requests_condominium ON purchase_requests(condominium_id);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_purchase_requests_created_by ON purchase_requests(created_by);

-- Trigger para updated_at
CREATE TRIGGER update_purchase_requests_updated_at
  BEFORE UPDATE ON purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their condominium requests"
ON purchase_requests FOR SELECT
USING (condominium_id = get_user_condominium_id(auth.uid()));

CREATE POLICY "Users can create requests in their condominium"
ON purchase_requests FOR INSERT
WITH CHECK (
  condominium_id = get_user_condominium_id(auth.uid()) 
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update their condominium requests"
ON purchase_requests FOR UPDATE
USING (condominium_id = get_user_condominium_id(auth.uid()));

CREATE POLICY "Super admin can do everything with purchase requests"
ON purchase_requests FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));