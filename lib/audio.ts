import { Howl } from 'howler';

// In a real production app, you would place these mp3 files in the /public folder.
// Howler will handle them gracefully if they 404 in development, or we can catch it.

const sounds = {
  click: typeof window !== 'undefined' ? new Howl({ src: ['/click.mp3'], volume: 0.5 }) : null,
  ageUp: typeof window !== 'undefined' ? new Howl({ src: ['/age_up.mp3'], volume: 0.7 }) : null,
  death: typeof window !== 'undefined' ? new Howl({ src: ['/death.mp3'], volume: 0.8 }) : null,
};

export function playSound(name: keyof typeof sounds) {
  if (sounds[name] && sounds[name]?.state() === 'loaded') {
    sounds[name]?.play();
  } else if (sounds[name]) {
    // Attempt to play anyway if it's loading, Howler queues it natively
    sounds[name]?.play();
  }
}
