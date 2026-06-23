-- Adiciona a coluna de role na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Atualiza o usuário glauberads21@gmail.com para super_admin
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE id = '8a700d67-8a2f-4d8b-b2db-968cfdded1d4';
