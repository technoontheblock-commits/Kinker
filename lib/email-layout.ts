/**
 * Centralized email layout helper.
 * All KINKER emails use a consistent light theme matching the verification email.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinker.ch'

/**
 * Wraps email content in the standard KINKER light-themed HTML layout.
 * @param unsubscribeEmail - If provided, adds an unsubscribe link to the footer.
 */
export function wrapEmail(contentHtml: string, pageTitle?: string, unsubscribeEmail?: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  ${pageTitle ? `<title>${pageTitle}</title>` : ''}
  <style>
    :root { color-scheme: light; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;border:1px solid #e5e5e5">
          <tr>
            <td style="padding:40px 32px 16px;text-align:center">
              <img src="${siteUrl}/images/logo.png" alt="KINKER" width="100" height="75" style="display:block;margin:0 auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px">
              <div style="height:2px;background:linear-gradient(90deg,transparent,#dc2626,transparent)"></div>
            </td>
          </tr>
          ${contentHtml}
          ${getStandardFooter(unsubscribeEmail)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function getStandardFooter(unsubscribeEmail?: string): string {
  const unsubscribeLink = unsubscribeEmail ? `
        <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(unsubscribeEmail)}" style="color:#bbbbbb;text-decoration:underline;font-size:10px;">Abmelden</a>` : ''

  return `
  <tr>
    <td style="padding:32px;text-align:center;background-color:#fafafa;border-top:1px solid #e5e5e5">
      <p style="margin:0 0 16px;font-size:14px;color:#999999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
        <strong style="color:#dc2626;">KINKER</strong>
      </p>
      <p style="margin:0 0 4px;font-size:12px;color:#bbbbbb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
        Barcelona-Strasse 4<br>
        4142 Münchenstein, Switzerland
      </p>
      <p style="margin:0 0 16px;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
        <a href="mailto:support@kinker.ch" style="color:#dc2626;text-decoration:none;">support@kinker.ch</a>
      </p>
      <p style="margin:0 0 8px;font-size:12px;color:#bbbbbb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
        <a href="https://www.instagram.com/kinker_club/" style="color:#dc2626;text-decoration:none;margin:0 8px;">Instagram</a>
        |
        <a href="https://www.facebook.com/kinkerbasel/" style="color:#dc2626;text-decoration:none;margin:0 8px;">Facebook</a>
      </p>
      <p style="margin:0;font-size:10px;color:#bbbbbb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
        ${unsubscribeLink}
      </p>
    </td>
  </tr>`
}
