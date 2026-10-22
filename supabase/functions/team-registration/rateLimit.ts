async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('')
}

// No verified client IP is available in this function. The legacy p_ip_hash
// parameter receives an email-scoped fallback: this is NOT IP protection.
// Never derive client identity from unverified forwarding/request headers.
export async function registrationRateLimitHashes(email: string, secret: string) {
  const normalizedEmail = email.trim().toLowerCase()
  return {
    p_ip_hash: await hash('registration-email-fallback:' + normalizedEmail + secret),
    // Preserve the existing email bucket and its 3/hour limit.
    p_email_hash: await hash(normalizedEmail + secret),
  }
}
