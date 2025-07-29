import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repositoryId, githubToken } = await req.json();
    
    console.log('GitHub sync request for repository:', repositoryId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch repository data from database
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repositoryId)
      .single();

    if (repoError || !repository) {
      throw new Error('Repository not found');
    }

    // Fetch latest data from GitHub API
    console.log('Fetching latest data from GitHub for:', repository.full_name);
    
    const githubResponse = await fetch(`https://api.github.com/repos/${repository.full_name}`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!githubResponse.ok) {
      throw new Error(`GitHub API error: ${githubResponse.status}`);
    }

    const githubData = await githubResponse.json();
    
    // Check if there are any changes
    const hasChanges = (
      repository.stargazers_count !== githubData.stargazers_count ||
      repository.forks_count !== githubData.forks_count ||
      repository.open_issues_count !== githubData.open_issues_count ||
      repository.description !== githubData.description ||
      repository.language !== githubData.language ||
      new Date(repository.updated_at).getTime() < new Date(githubData.updated_at).getTime()
    );

    let updatedRepository = repository;
    
    if (hasChanges) {
      console.log('Changes detected, updating repository data');
      
      // Update repository data
      const { data: updated, error: updateError } = await supabase
        .from('repositories')
        .update({
          description: githubData.description,
          language: githubData.language,
          stargazers_count: githubData.stargazers_count,
          forks_count: githubData.forks_count,
          open_issues_count: githubData.open_issues_count,
          updated_at: new Date().toISOString(),
        })
        .eq('id', repositoryId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating repository:', updateError);
        throw new Error('Failed to update repository');
      }

      updatedRepository = updated;
    }

    // Fetch latest commits to check for new activity
    const commitsResponse = await fetch(`https://api.github.com/repos/${repository.full_name}/commits?per_page=10&since=${repository.last_analyzed_at || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (commitsResponse.ok) {
      const commits = await commitsResponse.json();
      
      if (commits.length > 0) {
        console.log(`Found ${commits.length} new commits, triggering re-analysis`);
        
        // Update analysis status to analyzing
        await supabase
          .from('repositories')
          .update({ 
            analysis_status: 'analyzing',
            last_analyzed_at: new Date().toISOString()
          })
          .eq('id', repositoryId);

        // Trigger re-analysis
        const { error: analysisError } = await supabase.functions.invoke('analyze-repository', {
          body: { 
            repositoryId: repositoryId, 
            githubRepo: updatedRepository,
            isReanalysis: true
          }
        });

        if (analysisError) {
          console.error('Error triggering re-analysis:', analysisError);
        }
      }
    }

    console.log('GitHub sync completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        hasChanges,
        newCommits: commits?.length || 0,
        repository: updatedRepository
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in github-sync function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to sync with GitHub',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});