-- Tabela de configuração de alertas de tempo de resolução
CREATE TABLE resolution_time_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  category service_category NOT NULL,
  max_resolution_days INTEGER NOT NULL DEFAULT 7,
  warning_threshold_days INTEGER NOT NULL DEFAULT 5,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(condominium_id, category)
);

-- Enable RLS
ALTER TABLE resolution_time_alerts ENABLE ROW LEVEL SECURITY;

-- Managers can manage their own alerts
CREATE POLICY "Managers can manage their alerts"
  ON resolution_time_alerts
  FOR ALL
  USING (condominium_id = get_user_condominium_id(auth.uid()))
  WITH CHECK (condominium_id = get_user_condominium_id(auth.uid()));

-- Super admin can manage all alerts
CREATE POLICY "Super admin can manage all alerts"
  ON resolution_time_alerts
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Trigger for updated_at
CREATE TRIGGER update_resolution_time_alerts_updated_at
  BEFORE UPDATE ON resolution_time_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();