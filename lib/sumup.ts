import { SumUp, APIError, SumUpError } from '@sumup/sdk'
import { NextResponse } from 'next/server'

export { APIError, SumUpError }

/**
 * SumUp Problem Details (RFC 9457) error response.
 * https://developer.sumup.com/api/general-errors
 */
export interface SumUpProblemDetails {
  type: string
  title: string
  status: number
  detail: string
  instance: string | null
}

export function createSumUpClient() {
  const apiKey = process.env.SUMUP_API_KEY

  if (!apiKey) {
    throw new Error('SUMUP_API_KEY not configured')
  }

  return new SumUp({ apiKey })
}

export function getMerchantCode(): string {
  const merchantCode = process.env.SUMUP_MERCHANT_CODE

  if (!merchantCode) {
    throw new Error('SUMUP_MERCHANT_CODE not configured')
  }

  return merchantCode
}

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL

  if (!url) {
    throw new Error('NEXT_PUBLIC_APP_URL not configured')
  }

  return url.replace(/\/$/, '')
}

// Lazy-initialized singleton for server-side reuse.
// Only access this in API routes, Server Components or other server-only code.
let _sumup: SumUp | null = null

export function getSumUp(): SumUp {
  if (!_sumup) {
    _sumup = createSumUpClient()
  }
  return _sumup
}

/**
 * Type guard: checks whether a thrown error from the SumUp SDK is an APIError
 * that carries a Problem Details payload.
 */
export function isSumUpProblemError(
  err: unknown
): err is APIError<SumUpProblemDetails> {
  return (
    err instanceof APIError &&
    typeof err.error === 'object' &&
    err.error !== null &&
    'status' in err.error &&
    'title' in err.error
  )
}

/**
 * Converts a SumUp SDK error into a NextResponse.
 * Use this in API routes to forward SumUp errors cleanly to the client.
 *
 * Example:
 *   try { … } catch (err) { return handleSumUpError(err) }
 */
export function handleSumUpError(err: unknown): NextResponse {
  if (isSumUpProblemError(err)) {
    const problem = err.error as SumUpProblemDetails
    return NextResponse.json(
      {
        error: problem.title,
        detail: problem.detail,
        type: problem.type,
        status: problem.status,
      },
      { status: problem.status }
    )
  }

  if (err instanceof APIError) {
    // Fallback for non-Problem-Details APIErrors (string body)
    return NextResponse.json(
      { error: typeof err.error === 'string' ? err.error : 'SumUp API error' },
      { status: err.status }
    )
  }

  if (err instanceof SumUpError) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }

  // Unknown / network / coding errors
  const message = err instanceof Error ? err.message : 'Internal server error'
  console.error('Unexpected SumUp error:', err)
  return NextResponse.json({ error: message }, { status: 500 })
}
