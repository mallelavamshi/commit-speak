-- Create repositories table to store connected GitHub repos
CREATE TABLE public.repositories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  github_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  html_url TEXT NOT NULL,
  private BOOLEAN NOT NULL DEFAULT false,
  language TEXT,
  stargazers_count INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  open_issues_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  analysis_status TEXT CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')) DEFAULT 'pending',
  
  UNIQUE(user_id, github_id)
);

-- Enable Row Level Security
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own repositories" 
ON public.repositories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own repositories" 
ON public.repositories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repositories" 
ON public.repositories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repositories" 
ON public.repositories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create repository analysis table to store AI insights
CREATE TABLE public.repository_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repository_id UUID NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('overview', 'commits', 'lifecycle', 'activity')),
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for analysis table
ALTER TABLE public.repository_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for analysis access (through repository ownership)
CREATE POLICY "Users can view analysis of their repositories" 
ON public.repository_analysis 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.repositories r 
    WHERE r.id = repository_analysis.repository_id 
    AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create analysis for their repositories" 
ON public.repository_analysis 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.repositories r 
    WHERE r.id = repository_analysis.repository_id 
    AND r.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_repositories_updated_at
BEFORE UPDATE ON public.repositories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repository_analysis_updated_at
BEFORE UPDATE ON public.repository_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_repositories_user_id ON public.repositories(user_id);
CREATE INDEX idx_repositories_github_id ON public.repositories(github_id);
CREATE INDEX idx_repository_analysis_repo_id ON public.repository_analysis(repository_id);
CREATE INDEX idx_repository_analysis_type ON public.repository_analysis(analysis_type);