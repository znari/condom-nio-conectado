-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'manager');

-- Enum for condominium status
CREATE TYPE public.condominium_status AS ENUM ('pending', 'approved', 'rejected');

-- Enum for user position
CREATE TYPE public.user_position AS ENUM ('sindico', 'zelador');

-- Enum for service call status
CREATE TYPE public.call_status AS ENUM ('open', 'sent', 'awaiting_approval', 'in_progress', 'completed', 'cancelled');

-- Enum for urgency levels
CREATE TYPE public.urgency_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Enum for service categories
CREATE TYPE public.service_category AS ENUM ('encanador', 'eletricista', 'pintor', 'jardineiro', 'limpeza', 'chaveiro', 'vidraceiro', 'porteiro', 'outros');

-- Enum for photo types
CREATE TYPE public.photo_type AS ENUM ('initial', 'completion');

-- Condominiums table
CREATE TABLE public.condominiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  status public.condominium_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  condominium_id UUID REFERENCES public.condominiums(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  position public.user_position,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (security best practice - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Service providers table
CREATE TABLE public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_whatsapp TEXT NOT NULL,
  email TEXT,
  categories public.service_category[] NOT NULL DEFAULT '{}',
  average_rating DECIMAL(2,1) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service calls table
CREATE TABLE public.service_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  category public.service_category NOT NULL,
  urgency public.urgency_level NOT NULL DEFAULT 'medium',
  status public.call_status NOT NULL DEFAULT 'open',
  estimated_value DECIMAL(10,2),
  estimated_time TEXT,
  estimated_completion_date DATE,
  actual_value DECIMAL(10,2),
  completion_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  rating_comment TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service call photos table
CREATE TABLE public.service_call_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_call_id UUID NOT NULL REFERENCES public.service_calls(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  type public.photo_type NOT NULL DEFAULT 'initial',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Temporary links table (for provider access)
CREATE TABLE public.temporary_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  service_call_id UUID NOT NULL REFERENCES public.service_calls(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('quote', 'completion')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_call_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's condominium id
CREATE OR REPLACE FUNCTION public.get_user_condominium_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT condominium_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_condominiums_updated_at
  BEFORE UPDATE ON public.condominiums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_calls_updated_at
  BEFORE UPDATE ON public.service_calls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for condominiums
CREATE POLICY "Super admin can do everything with condominiums"
  ON public.condominiums
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Managers can view their own condominium"
  ON public.condominiums
  FOR SELECT
  TO authenticated
  USING (id = public.get_user_condominium_id(auth.uid()));

CREATE POLICY "Managers can update their own condominium"
  ON public.condominiums
  FOR UPDATE
  TO authenticated
  USING (id = public.get_user_condominium_id(auth.uid()));

CREATE POLICY "Anyone can insert condominium for registration"
  ON public.condominiums
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS Policies for profiles
CREATE POLICY "Super admin can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Profiles can be inserted during registration"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Super admin can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Roles can be inserted during registration"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for service_providers
CREATE POLICY "Super admin can do everything with providers"
  ON public.service_providers
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Managers can view their condominium providers"
  ON public.service_providers
  FOR SELECT
  TO authenticated
  USING (condominium_id = public.get_user_condominium_id(auth.uid()));

CREATE POLICY "Managers can insert providers to their condominium"
  ON public.service_providers
  FOR INSERT
  TO authenticated
  WITH CHECK (condominium_id = public.get_user_condominium_id(auth.uid()));

CREATE POLICY "Managers can update their condominium providers"
  ON public.service_providers
  FOR UPDATE
  TO authenticated
  USING (condominium_id = public.get_user_condominium_id(auth.uid()));

CREATE POLICY "Managers can delete their condominium providers"
  ON public.service_providers
  FOR DELETE
  TO authenticated
  USING (condominium_id = public.get_user_condominium_id(auth.uid()));

-- RLS Policies for service_calls
CREATE POLICY "Super admin can do everything with calls"
  ON public.service_calls
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Managers can view their condominium calls"
  ON public.service_calls
  FOR SELECT
  TO authenticated
  USING (condominium_id = public.get_user_condominium_id(auth.uid()));

CREATE POLICY "Managers can insert calls to their condominium"
  ON public.service_calls
  FOR INSERT
  TO authenticated
  WITH CHECK (condominium_id = public.get_user_condominium_id(auth.uid()));

CREATE POLICY "Managers can update their condominium calls"
  ON public.service_calls
  FOR UPDATE
  TO authenticated
  USING (condominium_id = public.get_user_condominium_id(auth.uid()));

CREATE POLICY "Managers can delete their condominium calls"
  ON public.service_calls
  FOR DELETE
  TO authenticated
  USING (condominium_id = public.get_user_condominium_id(auth.uid()));

-- RLS Policies for service_call_photos
CREATE POLICY "Super admin can do everything with photos"
  ON public.service_call_photos
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Managers can view photos from their condominium calls"
  ON public.service_call_photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_calls sc
      WHERE sc.id = service_call_id
      AND sc.condominium_id = public.get_user_condominium_id(auth.uid())
    )
  );

CREATE POLICY "Managers can insert photos to their condominium calls"
  ON public.service_call_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_calls sc
      WHERE sc.id = service_call_id
      AND sc.condominium_id = public.get_user_condominium_id(auth.uid())
    )
  );

CREATE POLICY "Anon can view photos via temporary link"
  ON public.service_call_photos
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for temporary_links
CREATE POLICY "Super admin can manage all temporary links"
  ON public.temporary_links
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Managers can manage their condominium temporary links"
  ON public.temporary_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_calls sc
      WHERE sc.id = service_call_id
      AND sc.condominium_id = public.get_user_condominium_id(auth.uid())
    )
  );

CREATE POLICY "Anon can view temporary links"
  ON public.temporary_links
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can update temporary links"
  ON public.temporary_links
  FOR UPDATE
  TO anon
  USING (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create storage bucket for service call photos
INSERT INTO storage.buckets (id, name, public) VALUES ('service-call-photos', 'service-call-photos', true);

-- Storage policies
CREATE POLICY "Anyone can view service call photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'service-call-photos');

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'service-call-photos');

CREATE POLICY "Anon users can upload photos via temporary link"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'service-call-photos');

-- Function to handle new user registration trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, condominium_id, position)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    (NEW.raw_user_meta_data->>'condominium_id')::UUID,
    (NEW.raw_user_meta_data->>'position')::public.user_position
  );
  
  -- Add role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'manager')
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();