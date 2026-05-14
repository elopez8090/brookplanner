import type { Metadata } from "next";
import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { MessagesRealtimeRouterRefresh } from "@/components/messages/MessagesRealtimeRouterRefresh";
import { requireRole } from "@/lib/auth/getUserProfile";
import { fetchConversationsForRole } from "@/lib/messages/queries";

export const metadata: Metadata = {
  title: "Vendor messages",
};

function formatDate(value: string | null): string {
  if (!value) {
    return "No messages yet";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function VendorMessagesPage() {
  const { user } = await requireRole("vendor");
  const conversations = await fetchConversationsForRole("vendor", user.id);
  const totalUnread = conversations.reduce((acc, row) => acc + row.unread_count, 0);

  return (
    <div className="space-y-8">
      <MessagesRealtimeRouterRefresh />
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Messages</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Customer conversations</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Chat with customers after your quote is accepted.
        </p>
        {totalUnread > 0 ? (
          <p className="text-sm font-semibold text-accent-coral">{totalUnread} unread across conversations</p>
        ) : null}
      </header>

      <DashboardCard title="Conversations">
        {conversations.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            description="A thread appears here after a host accepts your quote so you can message them directly."
            action={
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <ButtonLink href="/vendor/leads">Browse opportunities</ButtonLink>
                <ButtonLink href="/vendor/dashboard" variant="secondary">
                  Back to dashboard
                </ButtonLink>
              </div>
            }
          />
        ) : (
          <ul className="space-y-3">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="rounded-xl border border-border-subtle bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-semibold text-brand-navy">
                      {conversation.event_title?.trim() || "Event conversation"}
                    </p>
                    <p className="text-xs text-brand-navy-muted">Customer: {conversation.customer_name || "Customer"}</p>
                    <p className="line-clamp-2 text-sm text-brand-navy-muted">
                      {conversation.last_message_body?.trim() || "No messages yet."}
                    </p>
                    <p className="text-xs text-brand-navy-muted">{formatDate(conversation.last_message_created_at)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {conversation.unread_count > 0 ? (
                      <p className="mb-2 text-xs font-semibold text-accent-coral">{conversation.unread_count} unread</p>
                    ) : null}
                    <Link
                      href={`/vendor/messages/${conversation.id}`}
                      className="inline-flex rounded-xl border border-border-subtle bg-card px-3 py-2 text-sm font-semibold text-brand-navy transition-colors duration-200 ease-out hover:bg-brand-navy/[0.04]"
                    >
                      Open thread
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}
