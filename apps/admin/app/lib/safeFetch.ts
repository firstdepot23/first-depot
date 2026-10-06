export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };


export async function safeFetch<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8000,
): Promise<Result<T>> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        message: "Your session could not be verified. Please sign in again.",
      };
    }

    if (!res.ok) {
      console.error(`Request to ${url} failed with status ${res.status}`);
      return {
        ok: false,
        message:
          "The server is having trouble right now. Please try again shortly.",
      };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (error) {
    console.error(`Request to ${url} failed:`, error);

    const isTimeout =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    return {
      ok: false,
      message: isTimeout
        ? "The request took too long. Please check your internet connection and try again."
        : "We couldn't reach the server. Please check your internet connection and try again.",
    };
  }
}