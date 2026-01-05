import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-FLASHCARDS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { notes, imageBase64 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const messages: any[] = [];

    if (imageBase64) {
      // Image-based generation
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this image of notes/text and create flashcards from it. Generate between 5 and 20 flashcards based on the content. Each flashcard should have a clear question on the front and a concise answer on the back.

Return ONLY a valid JSON array with no additional text, in this exact format:
[
  {"front": "Question 1?", "back": "Answer 1"},
  {"front": "Question 2?", "back": "Answer 2"}
]

Focus on key concepts, definitions, formulas, and important facts from the image.`
          },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      });
    } else if (notes) {
      // Text-based generation
      messages.push({
        role: 'system',
        content: 'You are a helpful study assistant that creates effective flashcards from notes. Always respond with valid JSON only.'
      });
      messages.push({
        role: 'user',
        content: `Create flashcards from these notes. Generate between 5 and 20 flashcards based on the content complexity. Each flashcard should have a clear question on the front and a concise answer on the back.

Notes:
${notes}

Return ONLY a valid JSON array with no additional text, in this exact format:
[
  {"front": "Question 1?", "back": "Answer 1"},
  {"front": "Question 2?", "back": "Answer 2"}
]

Focus on key concepts, definitions, formulas, and important facts.`
      });
    } else {
      throw new Error('Either notes or imageBase64 is required');
    }

    logStep('Calling AI gateway to generate flashcards...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageBase64 ? 'google/gemini-2.5-flash' : 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep('AI gateway error', { status: response.status });
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    logStep('AI response received, parsing flashcards...');

    // Parse the JSON response
    let flashcards;
    try {
      // Try to find JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      } else {
        flashcards = JSON.parse(content);
      }
    } catch (parseError) {
      logStep('Failed to parse AI response');
      throw new Error('Failed to parse flashcards from AI response');
    }

    // Validate and limit to 20 cards
    if (!Array.isArray(flashcards)) {
      throw new Error('Invalid flashcard format');
    }

    const validFlashcards = flashcards
      .filter((card: any) => card.front && card.back)
      .slice(0, 20)
      .map((card: any, index: number) => ({
        id: `card-${Date.now()}-${index}`,
        front: String(card.front).trim(),
        back: String(card.back).trim(),
        mastered: false,
      }));

    logStep(`Generated ${validFlashcards.length} flashcards`);

    return new Response(
      JSON.stringify({ flashcards: validFlashcards }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logStep('ERROR', { message: error instanceof Error ? error.message : 'Unknown error' });
    return new Response(
      JSON.stringify({ error: 'Failed to generate flashcards' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
