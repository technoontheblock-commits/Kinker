/**
 * Reusable email footer for all KINKER emails.
 * Supports light and dark theme variants.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinker.ch'

const commonInfo = {
  address: 'Barcelona-Strasse 4',
  city: '4142 Münchenstein',
  country: 'Switzerland',
  friday: 'Freitag: 23:00 - 07:00',
  saturday: 'Samstag: 23:00 - 07:00',
  supportEmail: 'support@kinker.ch',
  instagram: 'https://www.instagram.com/kinker_club/',
  facebook: 'https://www.facebook.com/kinkerbasel/',
}

/**
 * Light theme footer (for verification, register emails)
 */
export function getLightFooter(): string {
  return `
  <tr>
    <td style="padding: 32px; text-align: center; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
      <p style="margin: 0 0 16px; font-size: 14px; color: #999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <strong style="color: #dc2626;">KINKER</strong>
      </p>
      <p style="margin: 0 0 16px; font-size: 12px; color: #bbbbbb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ${commonInfo.address}<br>
        ${commonInfo.city}, ${commonInfo.country}
      </p>
      <p style="margin: 0 0 16px; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <a href="mailto:${commonInfo.supportEmail}" style="color: #dc2626; text-decoration: none;">${commonInfo.supportEmail}</a>
      </p>
      <p style="margin: 0; font-size: 12px; color: #bbbbbb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <a href="${commonInfo.instagram}" style="color: #dc2626; text-decoration: none; margin: 0 8px;">Instagram</a>
        |
        <a href="${commonInfo.facebook}" style="color: #dc2626; text-decoration: none; margin: 0 8px;">Facebook</a>
      </p>
    </td>
  </tr>`
}

/**
 * Dark theme footer (for order, rental, application, newsletter emails)
 */
export function getDarkFooter(): string {
  return `
  <tr>
    <td style="padding: 30px; text-align: center; border-top: 1px solid #333; background-color: #0d0d0d;">
      <p style="margin: 0 0 16px; font-size: 14px; color: #6B7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Du hast Fragen?<br>
        <a href="mailto:${commonInfo.supportEmail}" style="color: #FF4D00; text-decoration: none;">${commonInfo.supportEmail}</a>
      </p>
      <p style="margin: 0 0 16px; font-size: 12px; color: #4B5563; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ${commonInfo.address} • ${commonInfo.city}, ${commonInfo.country}
      </p>
      <p style="margin: 0; font-size: 12px; color: #4B5563; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <a href="${commonInfo.instagram}" style="color: #FF4D00; text-decoration: none; margin: 0 8px;">Instagram</a>
        |
        <a href="${commonInfo.facebook}" style="color: #FF4D00; text-decoration: none; margin: 0 8px;">Facebook</a>
      </p>
    </td>
  </tr>`
}
