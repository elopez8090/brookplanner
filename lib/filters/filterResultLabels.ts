/** User-facing result counts for Phase 30 filter views. */

export function vendorsDirectoryResultLabel(
  count: number,
  opts: { hasActiveFilters: boolean; catalogEmpty: boolean },
): string {
  if (count === 0) {
    if (opts.catalogEmpty) {
      return "No vendors in the directory yet";
    }
    if (opts.hasActiveFilters) {
      return "No vendors match your filters";
    }
    return "No vendors to show";
  }
  return count === 1 ? "1 vendor found" : `${count} vendors found`;
}

export function marketplaceVendorsResultLabel(count: number, hasActiveFilters: boolean): string {
  if (count === 0) {
    return hasActiveFilters ? "No vendors match your filters" : "No vendors in this category yet";
  }
  return count === 1 ? "1 vendor found" : `${count} vendors found`;
}

/** Borough category pages: unfiltered empty copy differs from NYC-wide category hubs. */
export function marketplaceBoroughVendorsResultLabel(count: number, hasActiveFilters: boolean): string {
  if (count === 0) {
    return hasActiveFilters ? "No vendors match your filters" : "No vendors match right now";
  }
  return count === 1 ? "1 vendor found" : `${count} vendors found`;
}

export function adminEventsResultLabel(count: number, hasActiveFilters: boolean): string {
  if (count === 0) {
    return hasActiveFilters ? "No events match your filters" : "No submitted events yet";
  }
  return count === 1 ? "1 event matches your filters" : `${count} events match your filters`;
}

export function adminCustomersResultLabel(count: number, hasActiveFilters: boolean): string {
  if (count === 0) {
    return hasActiveFilters ? "No customers match your filters" : "No customer accounts yet";
  }
  return count === 1 ? "1 customer matches your filters" : `${count} customers match your filters`;
}

export function adminVendorsResultLabel(count: number, hasActiveFilters: boolean): string {
  if (count === 0) {
    return hasActiveFilters ? "No vendors match your filters" : "No vendor accounts yet";
  }
  return count === 1 ? "1 vendor matches your filters" : `${count} vendors match your filters`;
}

export function vendorLeadsResultLabel(count: number, hasActiveFilters: boolean): string {
  if (count === 0) {
    return hasActiveFilters ? "No leads match your filters" : "No active opportunities right now";
  }
  return count === 1 ? "1 opportunity matches your filters" : `${count} opportunities match your filters`;
}
