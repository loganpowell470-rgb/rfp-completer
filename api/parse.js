import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const PARSE_PROMPT = `You are an expert at analyzing Request for Proposal (RFP) documents. Your task is to:

1. Extract every question, requirement, and deliverable from the RFP document provided
2. Provide a brief executive summary of the RFP
3. Identify the customer's top priorities based on the questions asked

For each extracted item, identify:
- The section or category it belongs to
- The exact question or requirement text
- Whether it appears to be mandatory/required

Return your response as valid JSON with this exact structure:
{
  "summary": {
    "overview": "2-3 sentence summary of what the RFP is about, the issuing organization, and the scope of work",
    "priorities": [
      {
        "priority": "Short priority name",
        "description": "Why this matters to the customer based on the questions asked",
        "level": "high"
      }
    ]
  },
  "questions": [
    {
      "id": "q1",
      "section": "Section Name",
      "question": "The full question or requirement text",
      "required": true
    }
  ]
}

Rules:
- The "priorities" array should have 3-5 items, ordered from highest to lowest importance
- Each priority "level" must be one of: "high", "medium", or "low"
- Number question IDs sequentially: q1, q2, q3, etc.
- Group related questions under the same section name
- Include ALL questions, requirements, and deliverables, even minor ones
- If a section asks for a narrative response, include it as a single question
- If a section lists multiple sub-requirements, break them into separate items
- Return ONLY the JSON object, no additional text, no markdown code fences
- Ensure the JSON is valid and parseable`;

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, content, filename } = body;

    if (!content) {
      return Response.json({ error: 'No content provided' }, { status: 400 });
    }

    const userContent = [];

    if (type === 'pdf') {
      userContent.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: content,
        },
      });
      userContent.push({
        type: 'text',
        text: `I've uploaded an RFP document${filename ? ` named "${filename}"` : ''}. Please extract all questions, requirements, and deliverables from it, and provide a summary with priority analysis, following the instructions in your system prompt.`,
      });
    } else {
      userContent.push({
        type: 'text',
        text: `Here is an RFP document. Please extract all questions, requirements, and deliverables from it, and provide a summary with priority analysis, following the instructions in your system prompt.\n\n---\n\n${content}`,
      });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: PARSE_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const responseText = message.content[0].text;

    // Try to parse the JSON, handling potential markdown code fences
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleanedText);

    // Handle both old format (array) and new format (object with summary + questions)
    if (Array.isArray(parsed)) {
      return Response.json({ questions: parsed, summary: null });
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Expected questions array in response');
    }

    return Response.json({
      questions: parsed.questions,
      summary: parsed.summary || null,
    });
  } catch (err) {
    console.error('Parse error:', err);
    return Response.json(
      { error: err.message || 'Failed to parse document' },
      { status: 500 }
    );
  }
}
