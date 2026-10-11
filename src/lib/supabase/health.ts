export interface HealthQueryResult {
  error: { code?: string; message: string } | null
}

/** A response is operational only when the required query succeeds. */
export async function inspectHealth(
  query: PromiseLike<HealthQueryResult>,
  timeoutMs = 4000,
) {
  const start = performance.now()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const result = await Promise.race([
      query,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Timeout de conexão')), timeoutMs)
      }),
    ])
    return {
      configured: true,
      connected: !result.error,
      latencyMs: Math.round(performance.now() - start),
      ...(result.error ? { error: result.error.message } : {}),
    }
  } catch (error) {
    return {
      configured: true,
      connected: false,
      error: error instanceof Error ? error.message : 'Falha de conexão',
    }
  } finally {
    if (timer) clearTimeout(timer)
  }
}
