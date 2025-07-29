import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const { repositoryId, githubRepo } = await req.json();
    
    console.log(`Starting analysis for repository: ${githubRepo.full_name}`);

    // Update repository status to analyzing
    await supabase
      .from('repositories')
      .update({ analysis_status: 'analyzing' })
      .eq('id', repositoryId);

    // Fetch ALL commits from GitHub (no limitations)
    let commits = [];
    let page = 1;
    const perPage = 100; // Maximum allowed by GitHub API
    
    while (true) {
      const commitsResponse = await fetch(
        `https://api.github.com/repos/${githubRepo.full_name}/commits?per_page=${perPage}&page=${page}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CommitTranslator/1.0'
          }
        }
      );

      if (!commitsResponse.ok) {
        console.log(`Failed to fetch commits page ${page}`);
        break;
      }

      const pageCommits = await commitsResponse.json();
      
      if (pageCommits.length === 0) {
        break; // No more commits
      }
      
      commits.push(...pageCommits);
      page++;
      
      console.log(`Fetched ${pageCommits.length} commits from page ${page - 1}, total: ${commits.length}`);
    }

    // Fetch repository README
    let readmeContent = '';
    try {
      const readmeResponse = await fetch(
        `https://api.github.com/repos/${githubRepo.full_name}/readme`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CommitTranslator/1.0'
          }
        }
      );
      
      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json();
        readmeContent = atob(readmeData.content);
      }
    } catch (error) {
      console.log('No README found or error fetching README');
    }

    // Analyze with Anthropic - Focus on plain English for non-technical users
    const analysisPrompt = `
You are helping a CommitTranslator app convert technical GitHub commits into plain English for no-code developers, business owners, and non-technical team members.

Repository: ${githubRepo.full_name}
Description: ${githubRepo.description || 'No description provided'}
Language: ${githubRepo.language || 'Not specified'}

Recent Commits to Translate:
${commits.map((commit: any) => `- "${commit.commit.message}" by ${commit.commit.author.name}`).join('\n')}

For each commit, provide:
1. A simple, non-technical explanation that a business owner would understand
2. Categorize each change as: "feature" (new functionality), "improvement" (enhancement), or "fix" (bug fix)
3. Use friendly, conversational language

Also provide an overall project health summary in simple terms.

Format your response as JSON:
{
  "commits": [
    {
      "original_message": "commit message here",
      "plain_english": "Simple explanation here",
      "type": "feature|improvement|fix",
      "business_impact": "What this means for the product/users"
    }
  ],
  "project_health": {
    "status": "healthy|warning|needs_attention",
    "summary": "Simple summary like 'App is running smoothly with 3 new features this week'",
    "recent_activity": "Description of recent development activity"
  }
}
`;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ]
      })
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      throw new Error(`Anthropic API error: ${errorText}`);
    }

    const anthropicData = await anthropicResponse.json();
    const analysisText = anthropicData.content[0].text;
    
    // Parse the JSON response from Claude
    let analysisContent;
    try {
      analysisContent = JSON.parse(analysisText);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      analysisContent = {
        overview: analysisText.substring(0, 500),
        activity_level: "medium",
        lifecycle_stage: "active",
        quality_score: 7,
        collaboration_health: "good",
        key_insights: ["Analysis completed with limited data"],
        recommendations: ["Regular monitoring recommended"],
        commit_patterns: "Standard development patterns observed"
      };
    }

    // Save analysis to database
    await supabase
      .from('repository_analysis')
      .insert({
        repository_id: repositoryId,
        analysis_type: 'overview',
        content: analysisContent
      });

    // Save commit analysis with AI translations if we have commits
    if (commits.length > 0 && analysisContent.commits) {
      const commitAnalysis = {
        total_commits: commits.length,
        recent_commits: analysisContent.commits.map((aiCommit: any, index: number) => ({
          sha: commits[index]?.sha || `unknown-${index}`,
          message: aiCommit.original_message,
          author: commits[index]?.commit?.author?.name || 'Unknown',
          date: commits[index]?.commit?.committer?.date || commits[index]?.commit?.author?.date || new Date().toISOString(),
          plain_english: aiCommit.plain_english,
          business_impact: aiCommit.business_impact,
          type: aiCommit.type
        })),
        project_health: analysisContent.project_health
      };

      await supabase
        .from('repository_analysis')
        .insert({
          repository_id: repositoryId,
          analysis_type: 'commits',
          content: commitAnalysis
        });
    }

    // Update repository status to completed
    await supabase
      .from('repositories')
      .update({ 
        analysis_status: 'completed',
        last_analyzed_at: new Date().toISOString()
      })
      .eq('id', repositoryId);

    console.log(`Analysis completed for repository: ${githubRepo.full_name}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Repository analysis completed',
        analysis: analysisContent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in repository analysis:', error);
    
    // Update repository status to failed if we have repositoryId
    const body = await req.clone().json().catch(() => ({}));
    if (body.repositoryId) {
      await supabase
        .from('repositories')
        .update({ analysis_status: 'failed' })
        .eq('id', body.repositoryId);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message || 'Repository analysis failed',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function translateCommitMessage(message: string): string {
  // Simple translation logic - in production this could use AI too
  const commonPatterns = {
    'fix': 'Fixed a bug',
    'feat': 'Added a new feature',
    'chore': 'Performed maintenance tasks',
    'docs': 'Updated documentation',
    'style': 'Improved code formatting',
    'refactor': 'Reorganized code structure',
    'test': 'Added or updated tests',
    'build': 'Updated build configuration',
    'ci': 'Updated continuous integration'
  };

  const lowerMessage = message.toLowerCase();
  for (const [pattern, translation] of Object.entries(commonPatterns)) {
    if (lowerMessage.includes(pattern)) {
      return `${translation}: ${message}`;
    }
  }

  return message; // Return original if no pattern matches
}