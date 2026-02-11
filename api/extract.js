import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(request) {
  try {
    const { content, filename } = await request.json();

    if (!content) {
      return Response.json({ error: 'No content provided' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: content,
            },
          },
          {
            type: 'text',
            text: `Extract all text content from this document${filename ? ` ("${filename}")` : ''}. Return ONLY the raw text content — no commentary, no formatting instructions. Preserve the document's structure (headings, lists, paragraphs) using plain text. This will be used as reference material for proposal writing.`,
          },
        ],
      }],
    });

    const text = message.content[0].text;
    return Response.json({ text });
  } catch (err) {
    console.error('Extract error:', err);
    return Response.json(
      { error: err.message || 'Failed to extract text' },
      { status: 500 }
    );
  }
}
