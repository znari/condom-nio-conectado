
-- Notification Preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  notify_new_quote BOOLEAN NOT NULL DEFAULT true,
  notify_call_completed BOOLEAN NOT NULL DEFAULT true,
  notify_resolution_alerts BOOLEAN NOT NULL DEFAULT true,
  notify_weekly_summary BOOLEAN NOT NULL DEFAULT false,
  notify_monthly_summary BOOLEAN NOT NULL DEFAULT true,
  preferred_time TIME NOT NULL DEFAULT '09:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(condominium_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences
CREATE POLICY "Managers can manage their notification preferences"
ON public.notification_preferences
FOR ALL
USING (condominium_id = get_user_condominium_id(auth.uid()))
WITH CHECK (condominium_id = get_user_condominium_id(auth.uid()));

CREATE POLICY "Super admin can manage all notification preferences"
ON public.notification_preferences
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Updated_at trigger
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- User Invitations table
CREATE TABLE public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  position public.user_position NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(condominium_id, email)
);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_invitations
CREATE POLICY "Managers can manage their invitations"
ON public.user_invitations
FOR ALL
USING (condominium_id = get_user_condominium_id(auth.uid()))
WITH CHECK (condominium_id = get_user_condominium_id(auth.uid()));

CREATE POLICY "Super admin can manage all invitations"
ON public.user_invitations
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view invitation by token"
ON public.user_invitations
FOR SELECT
USING (true);

-- Category Settings table
CREATE TABLE public.category_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  category public.service_category NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  custom_label TEXT,
  icon_name TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(condominium_id, category)
);

-- Enable RLS
ALTER TABLE public.category_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for category_settings
CREATE POLICY "Managers can manage their category settings"
ON public.category_settings
FOR ALL
USING (condominium_id = get_user_condominium_id(auth.uid()))
WITH CHECK (condominium_id = get_user_condominium_id(auth.uid()));

CREATE POLICY "Super admin can manage all category settings"
ON public.category_settings
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Updated_at trigger
CREATE TRIGGER update_category_settings_updated_at
  BEFORE UPDATE ON public.category_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
