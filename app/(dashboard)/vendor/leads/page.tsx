import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { VendorLeadsSection } from "@/components/vendor/VendorLeadsSection";
import { getUserProfile } from "@/lib/auth/getUserProfile";
import { fetchCategoryNamesOrdered } from "@/lib/categories/queries";
import { fetchVendorActiveEvents, fetchVendorCreditSummary, fetchVendorQuotedServiceMap } from "@/lib/events/queries";
import { firstSearchParam, parseVendorLeadSort, rpcOptionalText } from "@/lib/filters/phase30Search";
import { fetchConversationsForRole } from "@/lib/messages/queries";

export const metadata: Metadata = {
  title: "Vendor · Active opportunities",
};

type PageProps = {
  searchParams: Promise<{
    q?: string | string[];
    neighborhood?: string | string[];
    category?: string | string[];
    sort?: string | string[];
  }>;
};

export default async function VendorLeadsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const leadQ = rpcOptionalText(firstSearchParam(sp.q)) ?? "";
  const leadNeighborhood = rpcOptionalText(firstSearchParam(sp.neighborhood)) ?? "";
  const leadCategory = rpcOptionalText(firstSearchParam(sp.category)) ?? "";
  const leadSort = parseVendorLeadSort(firstSearchParam(sp.sort));

  const { user } = await getUserProfile();
  const [events, categoryNames, quotedMap, creditSummary] = await Promise.all([
    fetchVendorActiveEvents({
      query: leadQ || undefined,
      neighborhood: leadNeighborhood || undefined,
      category: leadCategory || undefined,
      sort: leadSort,
    }),
    fetchCategoryNamesOrdered(),
    user ? fetchVendorQuotedServiceMap(user.id) : Promise.resolve({}),
    user ? fetchVendorCreditSummary(user.id) : Promise.resolve({ creditsBalance: 0, creditsUsed: 0, quotesSubmitted: 0 }),
  ]);

  const inboxUnreadTotal = user
    ? (await fetchConversationsForRole("vendor", user.id)).reduce((acc, row) => acc + row.unread_count, 0)
    : 0;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Leads</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Active opportunities</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Browse active Brooklyn events, filter by keyword, neighborhood, or requested category, and open an opportunity to
          quote.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href="/vendor/dashboard" variant="secondary">
            Back to dashboard
          </ButtonLink>
          <ButtonLink href="/vendor/messages" variant="secondary">
            Open Messages
          </ButtonLink>
          {inboxUnreadTotal > 0 ? (
            <span className="text-sm font-semibold text-accent-coral">{inboxUnreadTotal} unread</span>
          ) : null}
        </div>
      </header>

      <VendorLeadsSection
        actionPath="/vendor/leads"
        leadQ={leadQ}
        leadNeighborhood={leadNeighborhood}
        leadCategory={leadCategory}
        leadSort={leadSort}
        events={events}
        categoryNames={categoryNames}
        quotedMap={quotedMap}
        showFirstQuoteGuidance={Boolean(user && creditSummary.quotesSubmitted === 0)}
      />
    </div>
  );
}
