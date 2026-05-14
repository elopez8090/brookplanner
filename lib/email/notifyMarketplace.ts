import "server-only";
import { getUserEmailById } from "@/lib/email/getUserEmailById";
import { shouldSendMarketplaceEmail } from "@/lib/email/preferences";
import { absoluteUrl, sendTransactionalEmail } from "@/lib/email/sendEmail";
import { serverWarn } from "@/lib/logging/serverLog";
import {
  templateAdminNewVendor,
  templateCustomerNewMessage,
  templateCustomerNewQuote,
  templateVendorNewMessage,
  templateVendorNewReview,
  templateVendorQuoteAccepted,
  templateVendorQuoteDeclined,
} from "@/lib/email/templates";

export async function notifyCustomerNewQuoteEmail(params: {
  customerUserId: string;
  eventId: string;
  eventTitle: string;
}): Promise<void> {
  try {
    if (!(await shouldSendMarketplaceEmail(params.customerUserId, "quote_submitted_customer"))) {
      return;
    }
    const to = await getUserEmailById(params.customerUserId);
    if (!to) {
      return;
    }
    const actionUrl = absoluteUrl(`/events/${params.eventId}`);
    await sendTransactionalEmail({
      to,
      content: templateCustomerNewQuote({ eventTitle: params.eventTitle, actionUrl }),
    });
  } catch (err) {
    serverWarn("EMAIL", "notifyCustomerNewQuoteEmail failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}

export async function notifyVendorQuoteAcceptedEmail(params: {
  vendorUserId: string;
  eventId: string;
  eventTitle: string;
}): Promise<void> {
  try {
    if (!(await shouldSendMarketplaceEmail(params.vendorUserId, "quote_accepted_vendor"))) {
      return;
    }
    const to = await getUserEmailById(params.vendorUserId);
    if (!to) {
      return;
    }
    const actionUrl = absoluteUrl(`/vendor/events/${params.eventId}`);
    await sendTransactionalEmail({
      to,
      content: templateVendorQuoteAccepted({ eventTitle: params.eventTitle, actionUrl }),
    });
  } catch (err) {
    serverWarn("EMAIL", "notifyVendorQuoteAcceptedEmail failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}

export async function notifyVendorQuoteDeclinedEmail(params: {
  vendorUserId: string;
  eventId: string;
  eventTitle: string;
}): Promise<void> {
  try {
    if (!(await shouldSendMarketplaceEmail(params.vendorUserId, "quote_declined_vendor"))) {
      return;
    }
    const to = await getUserEmailById(params.vendorUserId);
    if (!to) {
      return;
    }
    const actionUrl = absoluteUrl(`/vendor/events/${params.eventId}`);
    await sendTransactionalEmail({
      to,
      content: templateVendorQuoteDeclined({ eventTitle: params.eventTitle, actionUrl }),
    });
  } catch (err) {
    serverWarn("EMAIL", "notifyVendorQuoteDeclinedEmail failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}

export async function notifyRecipientNewMessageEmail(params: {
  recipientUserId: string;
  recipientRole: "customer" | "vendor";
  eventTitle: string;
  conversationId: string;
}): Promise<void> {
  try {
    const prefKey = params.recipientRole === "customer" ? "message_customer" : "message_vendor";
    if (!(await shouldSendMarketplaceEmail(params.recipientUserId, prefKey))) {
      return;
    }
    const to = await getUserEmailById(params.recipientUserId);
    if (!to) {
      return;
    }
    const path =
      params.recipientRole === "customer"
        ? `/customer/messages/${params.conversationId}`
        : `/vendor/messages/${params.conversationId}`;
    const actionUrl = absoluteUrl(path);
    const content =
      params.recipientRole === "customer"
        ? templateCustomerNewMessage({ eventTitle: params.eventTitle, actionUrl })
        : templateVendorNewMessage({ eventTitle: params.eventTitle, actionUrl });
    await sendTransactionalEmail({ to, content });
  } catch (err) {
    serverWarn("EMAIL", "notifyRecipientNewMessageEmail failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}

export async function notifyVendorNewReviewEmail(params: {
  vendorUserId: string;
  rating: number;
}): Promise<void> {
  try {
    if (!(await shouldSendMarketplaceEmail(params.vendorUserId, "review_vendor"))) {
      return;
    }
    const to = await getUserEmailById(params.vendorUserId);
    if (!to) {
      return;
    }
    const actionUrl = absoluteUrl("/vendor/dashboard");
    await sendTransactionalEmail({
      to,
      content: templateVendorNewReview({ rating: params.rating, actionUrl }),
    });
  } catch (err) {
    serverWarn("EMAIL", "notifyVendorNewReviewEmail failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}

export async function notifyAdminNewVendorEmail(params: {
  vendorUserId: string;
  vendorEmail: string | null;
  fullName: string;
}): Promise<void> {
  try {
    const adminTo = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
    if (!adminTo) {
      return;
    }
    const actionUrl = absoluteUrl("/");
    await sendTransactionalEmail({
      to: adminTo,
      content: templateAdminNewVendor({
        vendorEmail: params.vendorEmail,
        fullName: params.fullName,
        userId: params.vendorUserId,
        actionUrl,
      }),
    });
  } catch (err) {
    serverWarn("EMAIL", "notifyAdminNewVendorEmail failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}
