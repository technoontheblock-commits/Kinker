import { redirect } from 'next/navigation'

export default function BonusCardViewRedirectPage({
  params,
}: {
  params: { token: string }
}) {
  redirect(`/membership/view/${params.token}`)
}
