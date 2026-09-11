import { vi } from 'vitest';

/** jsdom (vitest) has no matchMedia; the avatar expression overlay and
 *  effective-reduced-motion hook query it at mount (Gate UI-1 A safety:
 *  environment plumbing only, no app behavior asserted). */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});