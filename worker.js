export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = [
      'https://diasdigital.co.uk',
      'http://localhost',
      'http://127.0.0.1'
    ];

    const corsHeaders = {
      'Access-Control-Allow-Origin':
        allowedOrigins.includes(origin) ? origin : 'https://diasdigital.co.uk',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // ROUTE 1 — /chat (Anthropic proxy)
    if (url.pathname === '/chat' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { message, systemPrompt } = body;

        const response = await fetch(
          'https://api.anthropic.com/v1/messages',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-6',
              max_tokens: 500,
              system: systemPrompt || '',
              messages: [{ role: 'user', content: message }],
            }),
          }
        );

        const data = await response.json();
        const reply = data.content?.[0]?.text || 'Sorry I could not get a response.';

        return new Response(
          JSON.stringify({ response: reply }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Something went wrong' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ROUTE 2 — /contact (Formspree proxy)
    if (url.pathname === '/contact' && request.method === 'POST') {
      try {
        const body = await request.json();

        const response = await fetch(env.FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: 'Submission failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Something went wrong' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Unknown route
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};
