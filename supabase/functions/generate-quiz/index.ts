import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-QUIZ] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { notes, imageBase64, topic, questionCount = 5 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert quiz generator. Create multiple choice quiz questions based on the provided content.

Your response must be a valid JSON array with this exact structure:
[
  {
    "id": "1",
    "question": "The question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]

Guidelines:
- Generate exactly ${questionCount} questions
- Each question must have 2-4 options (prefer 4 options for variety)
- correctAnswer is the index (0-based) of the correct option
- Make questions clear and educational
- Include a mix of difficulty levels
- Explanations should be concise but helpful
- Focus ONLY on the content provided - do not make up facts

IMPORTANT: Return ONLY the JSON array, no markdown code blocks or other formatting.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (imageBase64) {
      logStep("Processing image-based quiz generation");
      messages.push({
        role: "user",
        content: [
          { 
            type: "text", 
            text: `Create ${questionCount} quiz questions based on the content in this image. Focus on key concepts, facts, and important details visible in the image.` 
          },
          { 
            type: "image_url", 
            image_url: { 
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` 
            } 
          }
        ]
      });
    } else if (notes) {
      logStep("Processing notes-based quiz generation");
      messages.push({
        role: "user",
        content: `Create ${questionCount} quiz questions based on these notes:\n\n${notes}`
      });
    } else if (topic) {
      logStep("Processing topic-based quiz generation");
      messages.push({
        role: "user",
        content: `Create ${questionCount} quiz questions about: ${topic}`
      });
    } else {
      throw new Error("Either notes, imageBase64, or topic is required");
    }

    logStep("Calling AI gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      logStep("AI gateway error", { status: response.status, error: errorText });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    logStep("AI response received, parsing questions...");

    // Parse the JSON response
    let questions;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(cleanContent);
      }
    } catch (parseError) {
      logStep("Failed to parse AI response", { error: parseError });
      throw new Error("Failed to parse quiz questions from AI response");
    }

    // Validate questions
    if (!Array.isArray(questions)) {
      throw new Error("Invalid question format");
    }

    const validQuestions = questions
      .filter((q: any) => q.question && Array.isArray(q.options) && typeof q.correctAnswer === 'number')
      .slice(0, questionCount)
      .map((q: any, index: number) => ({
        id: String(index + 1),
        question: String(q.question).trim(),
        options: q.options.map((opt: any) => String(opt).trim()),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation ? String(q.explanation).trim() : "No explanation provided.",
      }));

    logStep(`Generated ${validQuestions.length} questions`);

    return new Response(
      JSON.stringify({ questions: validQuestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logStep("ERROR", { message: error instanceof Error ? error.message : "Unknown error" });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate quiz" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
