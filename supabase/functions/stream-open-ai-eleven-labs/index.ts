const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 });
    }

    try {
        const { messages, systemPrompt, voiceId } = await req.json();

        const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

        if (!ELEVENLABS_API_KEY || !LOVABLE_API_KEY) {
            throw new Error('Missing API keys');
        }

        // 1. Start OpenAI Stream
        const openAIResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                stream: true,
            }),
        });

        if (!openAIResponse.ok) {
            throw new Error(`OpenAI API error: ${openAIResponse.status}`);
        }

        // 2. Setup ElevenLabs Stream
        // We will pipe text chunks to ElevenLabs WebSocket or Stream endpoint.
        // Since ElevenLabs HTTP stream requires full text or chunked transfer which is complex to coordinate with OpenAI stream in a stateless function without WebSockets,
        // we will use a simpler approach for MVP: Buffer sentences and send them to ElevenLabs.
        // Ideally, we would use ElevenLabs WebSocket API for true bi-directional streaming, but that requires a WebSocket server.
        // Here we will use the HTTP Streaming endpoint of ElevenLabs, but we need to feed it text.

        // Actually, to make it truly fast, we should use the ElevenLabs WebSocket API, but Deno Edge Functions have limited WebSocket support for acting as a client in this specific way (piping two streams).
        // A more robust way for HTTP-only is:
        // OpenAI Stream -> Buffer Sentence -> ElevenLabs TTS (Stream) -> Client Audio Stream

        // Let's implement the "Buffer Sentence -> TTS" approach.
        // We will return a ReadableStream that yields audio chunks.

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        // Process OpenAI stream in background and write to output stream
        (async () => {
            try {
                const reader = openAIResponse.body?.getReader();
                if (!reader) throw new Error('No OpenAI body');

                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                            try {
                                const data = JSON.parse(line.slice(6));
                                const content = data.choices[0]?.delta?.content || '';
                                if (content) {
                                    buffer += content;
                                    // Check for sentence delimiters
                                    if (buffer.match(/[.!?]\s$/)) {
                                        await processSentence(buffer, writer, ELEVENLABS_API_KEY, voiceId);
                                        buffer = '';
                                    }
                                }
                            } catch (e) {
                                // Ignore parse errors for partial lines
                            }
                        }
                    }
                }

                // Process remaining buffer
                if (buffer.trim()) {
                    await processSentence(buffer, writer, ELEVENLABS_API_KEY, voiceId);
                }

                await writer.close();
            } catch (error) {
                console.error('Streaming error:', error);
                await writer.abort(error);
            }
        })();

        return new Response(readable, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'audio/mpeg',
            },
        });

    } catch (error) {
        console.error('Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});

async function processSentence(text: string, writer: WritableStreamDefaultWriter, apiKey: string, voiceId: string) {
    console.log('Processing sentence:', text);
    try {
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
            {
                method: 'POST',
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            }
        );

        if (!response.ok) {
            console.error('ElevenLabs error:', await response.text());
            return;
        }

        if (response.body) {
            const reader = response.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                await writer.write(value);
            }
        }
    } catch (error) {
        console.error('Error processing sentence:', error);
    }
}
