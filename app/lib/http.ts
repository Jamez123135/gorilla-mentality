export async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || "The request failed. Please try again.");
  }
  return response.json() as Promise<T>;
}
