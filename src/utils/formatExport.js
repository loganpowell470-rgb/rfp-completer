export function formatAsMarkdown(questions, responses) {
  let md = '# RFP Response\n\n';
  md += `*Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*\n\n---\n\n`;

  let currentSection = '';

  for (const q of questions) {
    if (q.section !== currentSection) {
      currentSection = q.section;
      md += `## ${currentSection}\n\n`;
    }
    md += `### ${q.question}\n\n`;
    md += `${responses[q.id]?.text || '*No response provided*'}\n\n`;
  }

  return md;
}

export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

export function downloadAsFile(content, filename = 'rfp-response.md') {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}
