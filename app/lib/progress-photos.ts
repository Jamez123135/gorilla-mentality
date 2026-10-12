export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export function photoUrl(id: string) {
  return `/api/progress/${encodeURIComponent(id)}/image`;
}
