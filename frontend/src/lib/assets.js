// Resolves a path under /public/images against the current base URL ("/" —
// root-hosted at cleanandcaremotera.github.io, same locally and in prod).
export function img(path) {
  return `${import.meta.env.BASE_URL}images/${path}`;
}
