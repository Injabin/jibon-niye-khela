import type { RNG } from '../rng';

/** Fallback Bangla role labels used when a {{name}} token has no backing NPC. */
const FALLBACK_LABELS: Record<string, string> = {
  spouse: 'সঙ্গী',
  partner: 'সঙ্গী',
  child: 'বাচ্চা',
  mother: 'আম্মা',
  father: 'আব্বু',
  sibling: 'ভাই-বোন',
  ex: 'প্রাক্তন',
  university: 'ভার্সিটি',
};

/**
 * Parses and interpolates dynamic template filler slots ({opt1|opt2|opt3})
 * using deterministic random choices from the session's RNG stream.
 *
 * Named-NPC tokens ({{spouse}}, {{partner}}, {{child}}, ...) are resolved
 * first from the `names` map, then fall back to a Bangla role label so the
 * sentence stays grammatical when no NPC of that role exists.
 *
 * Example:
 *   renderTemplate("{{spouse}, you {nervously|boldly} asked your crush out to {a chai stall|the local cinema}.", rng, { spouse: 'Rahim' })
 *   // => "Rahim, you boldly asked your crush out to the local cinema."
 */
export function renderTemplate(
  template: string,
  rng: RNG,
  names?: Record<string, string>
): string {
  if (!template) return template;

  let out = template;
  if (names) {
    out = out.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (_match, key: string) => {
      return names[key] ?? FALLBACK_LABELS[key] ?? _match;
    });
  }

  if (!out.includes('{')) return out;

  return out.replace(/\{([^{}]+)\}/g, (_match, group: string) => {
    const options = group.split('|').map((opt) => opt.trim()).filter(Boolean);
    if (options.length === 0) return '';
    return rng.pick(options);
  });
}

/** Returns true if a string contains one or more template filler slots. */
export function hasTemplate(text: string): boolean {
  return /\{[^{}]+\}/.test(text);
}