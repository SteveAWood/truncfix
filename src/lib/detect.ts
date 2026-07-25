import { FileType } from '@/types';

/**
 * Detect the most likely file type from filename + a small content sample.
 * Order matters: more specific formats are checked before generic text.
 */
export function detectFileType(filename: string, contentSample: string): FileType {
  const lower = filename.toLowerCase();
  const sample = contentSample.slice(0, 4000);

  // Repomix / packed codebase
  if (
    lower.endsWith('.xml') ||
    sample.includes('<file path="') ||
    sample.includes('This file is a merged representation of the entire codebase')
  ) {
    return 'repomix';
  }

  // WhatsApp export (very distinctive header / line format)
  if (
    /WhatsApp Chat with /i.test(sample) ||
    /^\[\d{1,2}\/\d{1,2}\/\d{2,4},\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\]\s+[^:]+:/m.test(sample) ||
    /^\d{1,2}\/\d{1,2}\/\d{2,4},\s+\d{1,2}:\d{2}\s+[AP]M\s+-\s+/m.test(sample)
  ) {
    return 'whatsapp';
  }

  // Discord JSON export
  if (
    (lower.endsWith('.json') && (sample.includes('"channel"') || sample.includes('"messages"'))) ||
    sample.includes('"author":') && sample.includes('"timestamp":') && sample.includes('"content":')
  ) {
    // Could be Discord or Slack – prefer Discord if guild/channel markers exist
    if (sample.includes('"guild"') || sample.includes('"channel"') || sample.includes('"embeds"')) {
      return 'discord';
    }
    if (sample.includes('"user_profile"') || sample.includes('"client_msg_id"')) {
      return 'slack';
    }
    return 'discord';
  }

  // Slack JSON
  if (lower.includes('slack') && lower.endsWith('.json')) {
    return 'slack';
  }

  // Telegram
  if (
    sample.includes('"from_id"') ||
    sample.includes('"reply_to_message_id"') ||
    (lower.includes('telegram') && (lower.endsWith('.json') || lower.endsWith('.html')))
  ) {
    return 'telegram';
  }

  // iMessage-ish
  if (lower.includes('imessage') || lower.includes('messages') && lower.endsWith('.csv')) {
    return 'imessage';
  }

  // Markdown
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) {
    return 'markdown';
  }

  // Log files
  if (lower.endsWith('.log')) {
    return 'log';
  }

  // DOCX
  if (lower.endsWith('.docx')) {
    return 'docx';
  }

  // Plain text fallback
  if (lower.endsWith('.txt') || lower.endsWith('.text')) {
    return 'plain';
  }

  // Last resort: treat as plain text if it looks like text
  if (sample.length > 0 && !sample.includes('\0')) {
    return 'plain';
  }

  return 'unknown';
}
