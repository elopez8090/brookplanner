import "server-only";
import { Resend } from "resend";
import { serverError, serverInfo, serverWarn } from "@/lib/logging/serverLog";
import type { TransactionalEmailContent } from "@/lib/email/templates";

export function getPublicAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const base = getPublicAppBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function sendTransactionalEmail(params: {
  to: string | string[];
  content: TransactionalEmailContent;
}): Promise<void> {
  const from = process.env.EMAIL_FROM?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();

  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const recipientCount = recipients.length;

  if (!from) {
    serverWarn("EMAIL", "Transactional send skipped: EMAIL_FROM unset", {
      recipientCount,
      subject: params.content.subject,
    });
    return;
  }

  if (!apiKey) {
    serverInfo("EMAIL", "Transactional send skipped: RESEND_API_KEY unset (dev / dry run)", {
      recipientCount,
      subject: params.content.subject,
    });
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: recipients,
      subject: params.content.subject,
      html: params.content.html,
      text: params.content.text,
    });

    if (error) {
      serverWarn("EMAIL", "Resend API returned an error", {
        recipientCount,
        subject: params.content.subject,
        message: typeof error.message === "string" ? error.message : "unknown",
      });
    }
  } catch (err) {
    serverError("Transactional email: Resend send threw", {
      recipientCount,
      subject: params.content.subject,
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}
