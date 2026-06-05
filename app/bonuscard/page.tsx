import { redirect } from 'next/navigation'

export default function BonusCardRedirectPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') {
      query.append(key, value)
    }
  }
  const qs = query.toString()
  redirect(`/membership${qs ? `?${qs}` : ''}`)
}
