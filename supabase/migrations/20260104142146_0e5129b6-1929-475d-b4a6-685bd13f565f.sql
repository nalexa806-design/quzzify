-- Add XP and level columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN xp integer NOT NULL DEFAULT 0,
ADD COLUMN level integer NOT NULL DEFAULT 1,
ADD COLUMN bonus_quizzes integer NOT NULL DEFAULT 0;

-- Update the profiles trigger to include new columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, xp, level, bonus_quizzes)
  VALUES (new.id, new.email, 0, 1, 0);
  RETURN new;
END;
$$;