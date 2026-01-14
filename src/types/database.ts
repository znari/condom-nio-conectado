// Database types for ZelaSync

export type AppRole = 'super_admin' | 'manager';
export type CondominiumStatus = 'pending' | 'approved' | 'rejected';
export type UserPosition = 'sindico' | 'zelador';
export type CallStatus = 'open' | 'sent' | 'awaiting_approval' | 'in_progress' | 'completed' | 'cancelled';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type ServiceCategory = 'encanador' | 'eletricista' | 'pintor' | 'jardineiro' | 'limpeza' | 'chaveiro' | 'vidraceiro' | 'porteiro' | 'outros';
export type PhotoType = 'initial' | 'completion';

export interface Condominium {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string | null;
  status: CondominiumStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  condominium_id: string | null;
  name: string;
  email: string;
  position: UserPosition | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface ServiceProvider {
  id: string;
  condominium_id: string;
  name: string;
  phone_whatsapp: string;
  email: string | null;
  categories: ServiceCategory[];
  average_rating: number;
  total_ratings: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceCall {
  id: string;
  condominium_id: string;
  provider_id: string | null;
  title: string;
  description: string;
  location: string;
  category: ServiceCategory;
  urgency: UrgencyLevel;
  status: CallStatus;
  estimated_value: number | null;
  estimated_time: string | null;
  estimated_completion_date: string | null;
  actual_value: number | null;
  completion_notes: string | null;
  rating: number | null;
  rating_comment: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  provider?: ServiceProvider;
  photos?: ServiceCallPhoto[];
}

export interface ServiceCallPhoto {
  id: string;
  service_call_id: string;
  photo_url: string;
  type: PhotoType;
  uploaded_at: string;
}

export interface TemporaryLink {
  id: string;
  token: string;
  service_call_id: string;
  type: 'quote' | 'completion';
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}

export interface ResolutionTimeAlert {
  id: string;
  condominium_id: string;
  category: ServiceCategory;
  max_resolution_days: number;
  warning_threshold_days: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  condominium_id: string;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  notify_new_quote: boolean;
  notify_call_completed: boolean;
  notify_resolution_alerts: boolean;
  notify_weekly_summary: boolean;
  notify_monthly_summary: boolean;
  preferred_time: string;
  created_at: string;
  updated_at: string;
}

export interface UserInvitation {
  id: string;
  condominium_id: string;
  email: string;
  position: UserPosition;
  invited_by: string | null;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface CategorySetting {
  id: string;
  condominium_id: string;
  category: ServiceCategory;
  enabled: boolean;
  display_order: number;
  custom_label: string | null;
  icon_name: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

// Helper constants and label maps
export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  encanador: 'Encanador',
  eletricista: 'Eletricista',
  pintor: 'Pintor',
  jardineiro: 'Jardineiro',
  limpeza: 'Limpeza',
  chaveiro: 'Chaveiro',
  vidraceiro: 'Vidraceiro',
  porteiro: 'Porteiro/Segurança',
  outros: 'Outros',
};

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  open: 'Aberto',
  sent: 'Enviado ao Prestador',
  awaiting_approval: 'Aguardando Aprovação',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export const SERVICE_CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: 'encanador', label: 'Encanador' },
  { value: 'eletricista', label: 'Eletricista' },
  { value: 'pintor', label: 'Pintor' },
  { value: 'jardineiro', label: 'Jardineiro' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'chaveiro', label: 'Chaveiro' },
  { value: 'vidraceiro', label: 'Vidraceiro' },
  { value: 'porteiro', label: 'Porteiro/Segurança' },
  { value: 'outros', label: 'Outros' },
];

export const URGENCY_LEVELS: { value: UrgencyLevel; label: string; color: string }[] = [
  { value: 'low', label: 'Baixa', color: 'bg-muted text-muted-foreground' },
  { value: 'medium', label: 'Média', color: 'bg-info/10 text-info' },
  { value: 'high', label: 'Alta', color: 'bg-warning/10 text-warning' },
  { value: 'critical', label: 'Crítica', color: 'bg-destructive/10 text-destructive' },
];

export const CALL_STATUSES: { value: CallStatus; label: string; color: string }[] = [
  { value: 'open', label: 'Aberto', color: 'bg-muted text-muted-foreground' },
  { value: 'sent', label: 'Enviado ao Prestador', color: 'bg-info/10 text-info' },
  { value: 'awaiting_approval', label: 'Aguardando Aprovação', color: 'bg-warning/10 text-warning' },
  { value: 'in_progress', label: 'Em Andamento', color: 'bg-accent/10 text-accent' },
  { value: 'completed', label: 'Concluído', color: 'bg-success/10 text-success' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-destructive/10 text-destructive' },
];

export const CONDOMINIUM_STATUSES: { value: CondominiumStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pendente', color: 'bg-warning/10 text-warning' },
  { value: 'approved', label: 'Aprovado', color: 'bg-success/10 text-success' },
  { value: 'rejected', label: 'Rejeitado', color: 'bg-destructive/10 text-destructive' },
];
