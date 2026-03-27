// Deno runtime type declarations for IDE compatibility
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

console.log("Gemini Bot edge function is running!")

// Note: JWT verification is disabled in config.toml for development.
// Ensure production usage re-enables it and uses proper auth headers.

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    let body;

    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = body?.message;
    const user_name = body?.user_name;
    const previous_interaction_id = body?.previous_interaction_id;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key from environment
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment")
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not set" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const prompt = `Sen "Workigom AI" adında bir yapay zeka asistanısın. Cyberpunk/neon tarzında 'Muhabbet' adlı bir grup sohbetindesin.
Kullanıcı '${user_name || 'Bir kullanıcı'}' sana şu mesajı gönderdi:
"${message}"

Türkçe olarak EKSTREM KISA, NET ve öz bir yanıt yaz. Yanıtın en fazla 1-2 cümle olsun. Gereksiz nezaket ifadelerinden kaçın, doğrudan konuya gir.`

    // Sadece BU TEK SATIR kalsın (v1beta + gemini-2.5-flash):
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    console.log("Calling Gemini generateContent API...")

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const geminiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: controller.signal
      })
      clearTimeout(timeoutId);

    const responseBody = await geminiResponse.text()
    console.log("Gemini API status:", geminiResponse.status)
    
    if (!geminiResponse.ok) {
      console.error("Gemini API error:", geminiResponse.status, responseBody)
      return new Response(JSON.stringify({ 
        error: `Gemini API error: ${geminiResponse.status}`,
        detail: responseBody 
      }), {
        status: geminiResponse.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = JSON.parse(responseBody)
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sanırım sistemlerimde bir arıza var..."

    return new Response(JSON.stringify({ 
      response: responseText,
      interaction_id: null 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
    } catch (e) {
      const error = e as Error;
      if (error.name === 'AbortError') {
        return new Response(JSON.stringify({ error: "Gemini API timeout (10s)" }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Edge function error:", errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, 
    })
  }
})
