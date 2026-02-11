import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(request) {
  try {
    const { question, knowledgeBase, rfpContext, instructions } = await request.json();

    if (!question) {
      return Response.json({ error: 'No question provided' }, { status: 400 });
    }

    const systemPrompt = `You are a senior proposal writer creating a response for a Request for Proposal (RFP) question.

## Knowledge Base (Company Information):
${knowledgeBase}

${rfpContext ? `## Additional RFP Context:\n${rfpContext}\n` : ''}

## Instructions:
- Write a professional, compelling, and specific response
- Draw heavily from the knowledge base to provide concrete details, metrics, and examples
- Use a confident but not arrogant tone
- The response should be 100-300 words unless the question demands more detail
${instructions ? `\n## Additional Instructions from Reviewer:\n${instructions}` : ''}

Write ONLY the response text. Do not include the question or any delimiters.`;

    const stream = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      stream: true,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Please write a response for this RFP question:\n\n(Section: ${question.section}) ${question.question}${question.required ? ' [REQUIRED]' : ''}`,
      }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Regenerate error:', err);
    return Response.json(
      { error: err.message || 'Failed to regenerate response' },
      { status: 500 }
    );
  }
}
