-- Enable real-time updates for repositories table
ALTER TABLE public.repositories REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.repositories;

-- Enable real-time updates for repository_analysis table  
ALTER TABLE public.repository_analysis REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.repository_analysis;