import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ConversationThreadLive } from "@/components/messages/ConversationThreadLive";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { requireRole } from "@/lib/auth/getUserProfile";
import { markConversationAsRead } from "@/lib/messages/actions";
import { fetchConversationThreadForRole } from "@/lib/messages/queries";

export const metadata: Metadata = {
  title: "Conversation",
};

type PageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function CustomerConversationPage({ params }: PageProps) {
  const { conversationId } = await params;
  const { user } = await requireRole("customer");
  const thread = await fetchConversationThreadForRole("customer", user.id, conversationId);

  if (!thread) {
    notFound();
  }

  await markConversationAsRead(thread.id);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Messages</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">
          {thread.event_title?.trim() || "Event conversation"}
        </h2>
        <p className="text-sm text-brand-navy-muted">Vendor: {thread.vendor_name || "Vendor"}</p>
        <ButtonLink href="/customer/messages" variant="secondary">
          ← Back to conversations
        </ButtonLink>
      </header>

      <DashboardCard title="Thread">
        <ConversationThreadLive
          conversationId={thread.id}
          userId={user.id}
          role="customer"
          peerDisplayName={thread.vendor_name || "Vendor"}
          syncKey={`${thread.updated_at}:${thread.messages.length}`}
          initialMessages={thread.messages}
        />
      </DashboardCard>

      <DashboardCard title="Send message">
        <MessageComposer conversationId={thread.id} returnPath={`/customer/messages/${thread.id}`} />
      </DashboardCard>
    </div>
  );
}
