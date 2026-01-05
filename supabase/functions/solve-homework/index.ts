import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, imageUrl, targetAudience, questionSpecifier } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const audienceContext = targetAudience === "middle-school" 
      ? "Explain concepts simply, as if teaching a middle school student. Use basic vocabulary and relatable examples."
      : "Provide detailed explanations suitable for high school or college level. Use proper mathematical notation and terminology.";

    const questionContext = questionSpecifier 
      ? `The user specifically wants help with: ${questionSpecifier}` 
      : "Solve all problems shown.";

    const systemPrompt = `You are an expert tutor helping students solve homework problems. ${audienceContext}

Your response must be a valid JSON object with this exact structure:
{
  "steps": ["Step 1: ...", "Step 2: ...", ...],
  "finalAnswer": "The final answer here"
}

Guidelines:
- Break down the solution into clear, numbered steps
- Each step should explain what you're doing and why
- The finalAnswer should be concise and directly answer the question
- For math problems, show your work in each step
- ${questionContext}
- NEVER use LaTeX notation or dollar signs ($) for math. Write variables and equations in plain text (e.g., write "x = 2k" not "$x = 2k$")
- Focus ONLY on solving the specific problem shown. Do not give study tips or memorization advice.

IMPORTANT: Return ONLY the JSON object, no markdown code blocks or other formatting.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (imageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: question || "Please solve this problem from the image." },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: question
      });
    }

    console.log("Calling Lovable AI with messages:", JSON.stringify(messages).slice(0, 500));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: false,
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
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI response content:", content.slice(0, 500));

    // Parse the JSON response
    let parsedResponse;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback: treat the entire response as the answer
      parsedResponse = {
        steps: ["The AI provided a solution:"],
        finalAnswer: content
      };
    }

    return new Response(
      JSON.stringify({
        steps: parsedResponse.steps || [],
        finalAnswer: parsedResponse.finalAnswer || "See steps above",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("solve-homework error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
