import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(request) {
  try {
    const { questions, knowledgeBase, rfpContext } = await request.json();

    if (!questions?.length) {
      return Response.json({ error: 'No questions provided' }, { status: 400 });
    }

    const questionsFormatted = questions
      .map((q, i) => `[${q.id}] (Section: ${q.section}) ${q.question}${q.required ? ' [REQUIRED]' : ''}`)
      .join('\n\n');

    const systemPrompt = `You are a senior proposal writer creating responses for a Request for Proposal (RFP).

## Knowledge Base (Company Information):
${knowledgeBase}

${rfpContext ? `## Additional RFP Context:\n${rfpContext}\n` : ''}

## Instructions:
- Write professional, compelling, and specific responses for each question
- Draw heavily from the knowledge base to provide concrete details, metrics, and examples
- Use a confident but not arrogant tone
- Include specific metrics, certifications, and past performance where relevant
- Each response should be 100-300 words unless the question demands more detail
- For required questions, be especially thorough

## CRITICAL FORMAT REQUIREMENT:
After completing EACH response, you MUST emit this exact delimiter on its own line:
---RESPONSE_BOUNDARY:questionId---

Where questionId is the ID from the question (e.g., q1, q2, etc.)

Example output format:
Our approach to cloud migration leverages our proven methodology...

---RESPONSE_BOUNDARY:q1---

We maintain SOC 2 Type II certification and...

---RESPONSE_BOUNDARY:q2---

Do NOT include the question text in your response. Just write the answer directly.`;

    const stream = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 16384,
      stream: true,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Generate professional responses for each of the following RFP questions:\n\n${questionsFormatted}`,
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
    console.error('Generate error:', err);
    return Response.json(
      { error: err.message || 'Failed to generate responses' },
      { status: 500 }
    );
  }
}
