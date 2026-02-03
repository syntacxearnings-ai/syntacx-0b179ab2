-- Make refresh_token nullable to handle cases where ML doesn't return it
ALTER TABLE public.mercadolivre_integrations 
ALTER COLUMN refresh_token DROP NOT NULL;