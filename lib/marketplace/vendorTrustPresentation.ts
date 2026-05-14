export const TOP_REVIEWED_MIN_REVIEWS = 5;
export const TOP_REVIEWED_MIN_AVG = 4.5;

export function isVendorTopReviewed(reviewCount: number, avgRating: number | null | undefined): boolean {
  if (reviewCount < TOP_REVIEWED_MIN_REVIEWS) {
    return false;
  }
  if (avgRating === null || avgRating === undefined || !Number.isFinite(avgRating)) {
    return false;
  }
  return avgRating >= TOP_REVIEWED_MIN_AVG;
}

export function formatAvgRatingOneDecimal(avg: number | null | undefined): string | null {
  if (avg === null || avg === undefined || !Number.isFinite(avg)) {
    return null;
  }
  return avg.toFixed(1);
}

export function quoteActivityLabel(quoteCount: number): string | null {
  if (quoteCount <= 0) {
    return null;
  }
  if (quoteCount >= 10) {
    return "Very active — many quotes sent";
  }
  if (quoteCount >= 3) {
    return "Active on marketplace";
  }
  return null;
}
