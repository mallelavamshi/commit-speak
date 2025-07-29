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
    const { query, repositoryId } = await req.json();
    
    console.log('AI Chat request:', { query, repositoryId });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch repository data and analysis
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repositoryId)
      .single();

    if (repoError || !repository) {
      throw new Error('Repository not found');
    }

    // Fetch all analysis data for the repository
    const { data: analysisData, error: analysisError } = await supabase
      .from('repository_analysis')
      .select('*')
      .eq('repository_id', repositoryId);

    if (analysisError) {
      throw new Error('Failed to fetch analysis data');
    }

    // Prepare context for AI
    let repositoryContext = `Repository: ${repository.full_name}
Description: ${repository.description || 'No description'}
Language: ${repository.language || 'Unknown'}
Stars: ${repository.stargazers_count}
Forks: ${repository.forks_count}
Open Issues: ${repository.open_issues_count}

`;

    // Add analysis data to context
    const commits = [];
    let projectHealth = null;
    let overview = null;

    for (const analysis of analysisData) {
      if (analysis.analysis_type === 'commits' && analysis.content.recent_commits) {
        commits.push(...analysis.content.recent_commits);
        if (analysis.content.project_health) {
          projectHealth = analysis.content.project_health;
        }
      }
      if (analysis.analysis_type === 'overview' && analysis.content) {
        overview = analysis.content;
      }
    }

    if (projectHealth) {
      repositoryContext += `Project Health: ${projectHealth.status}
Summary: ${projectHealth.summary}
Recent Activity: ${projectHealth.recent_activity}

`;
    }

    if (overview) {
      repositoryContext += `Overview: ${overview.overview || ''}
Activity Level: ${overview.activity_level || ''}
Lifecycle Stage: ${overview.lifecycle_stage || ''}
Quality Score: ${overview.quality_score || ''}/10
Collaboration Health: ${overview.collaboration_health || ''}

`;
      if (overview.key_insights) {
        repositoryContext += `Key Insights:
${overview.key_insights.map(insight => `- ${insight}`).join('\n')}

`;
      }
      if (overview.recommendations) {
        repositoryContext += `Recommendations:
${overview.recommendations.map(rec => `- ${rec}`).join('\n')}

`;
      }
    }

    if (commits.length > 0) {
      repositoryContext += `Recent Commits:
${commits.map(commit => `
Commit: ${commit.sha?.substring(0, 8) || 'unknown'}
Date: ${commit.date || 'unknown'}
Author: ${commit.author || 'unknown'}
Message: ${commit.message || ''}
Plain English: ${commit.plain_english || ''}
Business Impact: ${commit.business_impact || ''}
Type: ${commit.type || 'unknown'}
`).join('\n')}`;
    }

    // Call Claude AI
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `You are an AI assistant that helps developers understand their repositories. You have access to repository data, commit history, and analysis.

Repository Context:
${repositoryContext}

User Query: "${query}"

Please provide a helpful response that:
1. Directly answers the user's question
2. References specific commits or data when relevant
3. Provides actionable insights
4. Uses clear, conversational language
5. If the query is about "what to do" or recommendations, prioritize the recommendations from the analysis

If you reference specific commits, mention them by their short SHA and describe what they did. Be conversational and helpful, like you're a senior developer explaining the codebase to a colleague.`
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Anthropic API error:', errorText);
      throw new Error('Failed to get AI response');
    }

    const aiData = await aiResponse.json();
    const answer = aiData.content[0].text;

    // Find relevant commits based on the query and AI response
    const relevantCommits = commits.filter(commit => {
      const searchText = query.toLowerCase();
      return (
        commit.plain_english?.toLowerCase().includes(searchText) ||
        commit.business_impact?.toLowerCase().includes(searchText) ||
        commit.message?.toLowerCase().includes(searchText) ||
        commit.type?.toLowerCase().includes(searchText)
      );
    }).slice(0, 5); // Limit to 5 most relevant

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({
        answer,
        relevantCommits,
        repositoryName: repository.full_name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in repository-ai-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process query',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});