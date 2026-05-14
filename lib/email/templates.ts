export type TransactionalEmailContent = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buttonBlock(label: string, url: string): string {
  const safeUrl = escapeHtml(url);
  const safeLabel = escapeHtml(label);
  return `
  <p style="margin:24px 0;">
    <a href="${safeUrl}" style="display:inline-block;padding:12px 22px;background:#e85d4c;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-family:system-ui,-apple-system,sans-serif;">
      ${safeLabel}
    </a>
  </p>`;
}

function shell(innerHtml: string): string {
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;padding:28px 28px 32px;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
            <tr><td>${innerHtml}</td></tr>
          </table>
          <p style="margin-top:16px;font-size:12px;color:#64748b;">Brook Planner notifications</p>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

export function templateCustomerNewQuote(params: { eventTitle: string; actionUrl: string }): TransactionalEmailContent {
  const title = escapeHtml(params.eventTitle);
  const subject = `New quote for ${params.eventTitle}`;
  const html = shell(`
    <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">You have a new vendor quote</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.55;">A vendor submitted a quote for <strong>${title}</strong>.</p>
    ${buttonBlock("View event & quote", params.actionUrl)}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#64748b;">If the button doesn’t work, copy this link:<br /><span style="word-break:break-all;color:#334155;">${escapeHtml(params.actionUrl)}</span></p>
  `);
  const text = [
    `You have a new vendor quote for "${params.eventTitle}".`,
    "",
    `Open: ${params.actionUrl}`,
    "",
    "— Brook Planner",
  ].join("\n");
  return { subject, html, text };
}

export function templateVendorQuoteAccepted(params: { eventTitle: string; actionUrl: string }): TransactionalEmailContent {
  const title = escapeHtml(params.eventTitle);
  const subject = `Your quote was accepted — ${params.eventTitle}`;
  const html = shell(`
    <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">Quote accepted</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.55;">Great news — the customer accepted your quote for <strong>${title}</strong>.</p>
    ${buttonBlock("Open opportunity", params.actionUrl)}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#64748b;">Link: ${escapeHtml(params.actionUrl)}</p>
  `);
  const text = [
    `Your quote was accepted for "${params.eventTitle}".`,
    "",
    `Open: ${params.actionUrl}`,
    "",
    "— Brook Planner",
  ].join("\n");
  return { subject, html, text };
}

export function templateVendorQuoteDeclined(params: { eventTitle: string; actionUrl: string }): TransactionalEmailContent {
  const title = escapeHtml(params.eventTitle);
  const subject = `Quote update — ${params.eventTitle}`;
  const html = shell(`
    <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">Quote not selected</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.55;">The customer declined your quote for <strong>${title}</strong>.</p>
    ${buttonBlock("View opportunity", params.actionUrl)}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#64748b;">Link: ${escapeHtml(params.actionUrl)}</p>
  `);
  const text = [
    `Your quote was declined for "${params.eventTitle}".`,
    "",
    `Open: ${params.actionUrl}`,
    "",
    "— Brook Planner",
  ].join("\n");
  return { subject, html, text };
}

export function templateCustomerNewMessage(params: { eventTitle: string; actionUrl: string }): TransactionalEmailContent {
  const title = escapeHtml(params.eventTitle);
  const subject = `New message about ${params.eventTitle}`;
  const html = shell(`
    <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">New message</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.55;">You have a new message about <strong>${title}</strong>.</p>
    ${buttonBlock("Open conversation", params.actionUrl)}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#64748b;">Link: ${escapeHtml(params.actionUrl)}</p>
  `);
  const text = [`New message about "${params.eventTitle}".`, "", params.actionUrl, "", "— Brook Planner"].join("\n");
  return { subject, html, text };
}

export function templateVendorNewMessage(params: { eventTitle: string; actionUrl: string }): TransactionalEmailContent {
  const title = escapeHtml(params.eventTitle);
  const subject = `New message — ${params.eventTitle}`;
  const html = shell(`
    <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">New message</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.55;">You have a new customer message about <strong>${title}</strong>.</p>
    ${buttonBlock("Open conversation", params.actionUrl)}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#64748b;">Link: ${escapeHtml(params.actionUrl)}</p>
  `);
  const text = [`New customer message about "${params.eventTitle}".`, "", params.actionUrl, "", "— Brook Planner"].join("\n");
  return { subject, html, text };
}

export function templateVendorNewReview(params: { rating: number; actionUrl: string }): TransactionalEmailContent {
  const subject = "You received a new review";
  const html = shell(`
    <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">New review</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.55;">A customer left a <strong>${params.rating}-star</strong> review on Brook Planner.</p>
    ${buttonBlock("View dashboard", params.actionUrl)}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#64748b;">Link: ${escapeHtml(params.actionUrl)}</p>
  `);
  const text = [`New ${params.rating}-star review on Brook Planner.`, "", params.actionUrl, "", "— Brook Planner"].join("\n");
  return { subject, html, text };
}

export function templateAdminNewVendor(params: {
  vendorEmail: string | null;
  fullName: string;
  userId: string;
  actionUrl: string;
}): TransactionalEmailContent {
  const subject = "New vendor registration";
  const emailLine = params.vendorEmail ? escapeHtml(params.vendorEmail) : "email unavailable";
  const nameLine = escapeHtml(params.fullName);
  const idLine = escapeHtml(params.userId);
  const html = shell(`
    <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">New vendor signed up</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.55;"><strong>Name:</strong> ${nameLine}</p>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.55;"><strong>Email:</strong> ${emailLine}</p>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.55;"><strong>User ID:</strong> ${idLine}</p>
    ${buttonBlock("Open app", params.actionUrl)}
  `);
  const text = [
    "New vendor registration:",
    `Name: ${params.fullName}`,
    `Email: ${params.vendorEmail ?? "n/a"}`,
    `User ID: ${params.userId}`,
    "",
    params.actionUrl,
  ].join("\n");
  return { subject, html, text };
}
