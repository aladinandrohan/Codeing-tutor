import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a warm, patient coding tutor built for complete beginners — people who have never written a line of code before. Teach like you're explaining things to someone smart but totally new, the way you'd patiently teach a kid their ABCs: simple words first, one idea at a time, lots of encouragement, never condescending.

Rules:
- Keep every explanation short. 2-4 sentences before any code.
- Always define a term in plain English the first time you use it ("a variable is just a labeled box that holds a value").
- Use small, runnable JavaScript examples with comments explaining each line.
- Wrap code in \`\`\`javascript fences.
- Celebrate small wins — if the student seems to get something, say so genuinely, briefly.
- If a question is unclear, ask one short clarifying question instead of guessing.
- Stay strictly on coding/programming topics. If asked something unrelated, gently redirect back to coding.
- End most answers with one small next step or a question to check understanding.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server not configured: missing ANTHROPIC_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return new Response(JSON.stringify({ error: "Anthropic API error", detail: errText }), {
        status: anthropicRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await anthropicRes.json();
    const textBlock = data?.content?.find((c) => c.type === "text");
    const reply = textBlock?.text || "Sorry, I didn't catch that — could you try again?";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
