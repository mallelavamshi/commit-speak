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

    // Fetch recent commits from GitHub
    const commitsResponse = await fetch(
      `https://api.github.com/repos/${githubRepo.full_name}/commits?per_page=10`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CommitTranslator/1.0'
        }
      }
    );

    let commits = [];
    if (commitsResponse.ok) {
      commits = await commitsResponse.json();
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

    // Analyze with Anthropic
    const analysisPrompt = `
Analyze this GitHub repository and provide insights about its development lifecycle and current state.

Repository: ${githubRepo.full_name}
Description: ${githubRepo.description || 'No description provided'}
Language: ${githubRepo.language || 'Not specified'}
Stars: ${githubRepo.stargazers_count || 0}
Forks: ${githubRepo.forks_count || 0}
Open Issues: ${githubRepo.open_issues_count || 0}

README Content:
${readmeContent.substring(0, 2000)}

Recent Commits (${commits.length}):
${commits.map((commit: any) => `- ${commit.commit.message} (by ${commit.commit.author.name})`).join('\n')}

Please provide a comprehensive analysis including:
1. Project Overview & Purpose
2. Development Activity Assessment
3. Code Quality & Maintenance Status
4. Team Collaboration Patterns
5. Project Lifecycle Stage (early, active development, mature, maintenance, etc.)
6. Key Technical Insights
7. Recommendations for improvement

Format your response as a JSON object with these sections:
{
  "overview": "Brief project summary",
  "activity_level": "high/medium/low",
  "lifecycle_stage": "early/active/mature/maintenance/inactive",
  "quality_score": 1-10,
  "collaboration_health": "excellent/good/fair/poor",
  "key_insights": ["insight1", "insight2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "commit_patterns": "Analysis of commit frequency and quality"
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

    // Save commit analysis if we have commits
    if (commits.length > 0) {
      const commitAnalysis = {
        total_commits: commits.length,
        recent_commits: commits.map((commit: any) => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author.name,
          date: commit.commit.author.date,
          translated_message: translateCommitMessage(commit.commit.message)
        }))
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