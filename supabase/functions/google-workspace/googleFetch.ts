/** Google requests have one attempt: mutations must never be retried implicitly. */
export const GOOGLE_REQUEST_TIMEOUT_MS = 15_000
export class GoogleRequestTimeoutError extends Error {
  readonly code = 'GOOGLE_TIMEOUT'
  constructor() {
    super('O Google demorou para responder. Confira se a operação foi concluída antes de tentar novamente.')
    this.name = 'GoogleRequestTimeoutError'
  }
}
export function isGoogleTimeout(error: unknown): boolean {
  return error instanceof GoogleRequestTimeoutError || (error instanceof Error && error.name === 'TimeoutError')
}
/** The composed signal stays attached to the response body, including streamed reads. */
export async function googleFetch(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = GOOGLE_REQUEST_TIMEOUT_MS, fetcher: typeof fetch = fetch): Promise<Response> {
  const callerSignal = init.signal ?? (input instanceof Request ? input.signal : undefined)
  const deadline = AbortSignal.timeout(timeoutMs)
  const signal = callerSignal ? AbortSignal.any([callerSignal, deadline]) : deadline
  try {
    return await fetcher(input, {...init, signal})
  } catch (error) {
    // Preserve caller cancellation and its reason instead of misreporting it as slowness.
    if (signal.reason === deadline.reason && deadline.aborted) throw new GoogleRequestTimeoutError()
    throw error
  }
}
