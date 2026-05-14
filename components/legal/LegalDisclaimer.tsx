import Link from "next/link";

type LegalDisclaimerProps = {
  className?: string;
};

export function LegalDisclaimer({ className }: LegalDisclaimerProps) {
  return (
    <p
      className={
        className ??
        "text-xs leading-relaxed text-brand-navy-muted [&_a]:font-semibold [&_a]:text-brand-navy [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:hover:text-brand-navy-hover"
      }
    >
      By using Brook Planner, you agree to our{" "}
      <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link> and understand that
      Brook Planner connects customers with independent vendors and is not responsible for transactions or services
      between users.
    </p>
  );
}
