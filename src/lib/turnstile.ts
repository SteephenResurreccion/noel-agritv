/**
 * Verify a Cloudflare Turnstile token against the siteverify endpoint.
 * Returns true only when Cloudflare reports success. Reads TURNSTILE_SECRET_KEY.
 * `fetchImpl` is injectable for tests.
 */
export async function verifyTurnstile(
  token: string,
  fetchImpl: typeof fetch = fetch
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;
  const body = new URLSearchParams({ secret, response: token });
  try {
    const res = await fetchImpl(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      }
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
