import type { RNG } from '../rng';

/**
 * Parses and interpolates dynamic template filler slots ({opt1|opt2|opt3})
 * using deterministic random choices from the session's RNG stream.
 *
 * Example:
 *   renderTemplate("You {nervously|boldly} asked your crush out to {a chai stall|the local cinema}.", rng)
 *   // => "You boldly asked your crush out to the local cinema."
 */
export function renderTemplate(template: string, rng: RNG): string {
  if (!template || !template.includes('{')) {
    return template;
  }

  return template.replace(/\{([^{}]+)\}/g, (_match, group: string) => {
    const options = group.split('|').map((opt) => opt.trim()).filter(Boolean);
    if (options.length === 0) return '';
    return rng.pick(options);
  });
}

/** Returns true if a string contains one or more template filler slots. */
export function hasTemplate(text: string): boolean {
  return /\{[^{}]+\}/.test(text);
}
