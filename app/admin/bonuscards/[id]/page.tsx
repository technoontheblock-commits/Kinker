import { redirect } from 'next/navigation'

export default function AdminBonusCardDetailRedirectPage({
  params,
}: {
  params: { id: string }
}) {
  redirect(`/admin/memberships/${params.id}`)
}
