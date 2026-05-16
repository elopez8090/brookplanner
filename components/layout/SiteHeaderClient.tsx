"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { marketingNavLinks } from "@/lib/constants";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/auth/types";
import { postAuthRedirectPath } from "@/lib/auth/roleRedirect";
import { fetchProfileByUserId } from "@/lib/auth/ensureProfile";
import { markNotificationAsRead } from "@/lib/notifications/actions";
import { signOutAndRedirect } from "@/components/auth/clientSignOut";

const navLinkClass =
  "text-[13px] font-normal leading-snug tracking-normal text-white/70 transition-colors duration-200 ease-out hover:text-white/90 hover:underline underline-offset-4 decoration-white/25 sm:text-sm";

const textButtonClass =
  "text-[13px] font-normal leading-snug tracking-normal text-white/70 transition-colors duration-200 ease-out hover:text-white/90 hover:underline underline-offset-4 decoration-white/25 sm:text-sm";

type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; profile: Profile | null };

export type HeaderNotification = {
  id: string;
  title: string;
  message: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

type SiteHeaderClientProps = {
  notifications: HeaderNotification[];
  unreadNotifications: number;
  messagesHref: string | null;
  initialUnreadMessages: number;
};

type UnreadMessagesState = {
  sourceCount: number;
  count: number;
};

function formatNotificationTimestamp(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < minuteMs) {
    return "Just now";
  }

  if (diffMs < hourMs) {
    return `${Math.max(1, Math.floor(diffMs / minuteMs))} min ago`;
  }

  if (diffMs < dayMs) {
    const hours = Math.max(1, Math.floor(diffMs / hourMs));
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  if (diffMs < dayMs * 2) {
    return "Yesterday";
  }

  return timestamp.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(fullName: string | null | undefined): string {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) {
    return "?";
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function roleLabel(role: Profile["role"] | null | undefined): string {
  if (role === "vendor") return "Vendor";
  if (role === "admin") return "Admin";
  if (role === "customer") return "Customer";
  return "Account";
}

export function SiteHeaderClient({
  notifications,
  unreadNotifications,
  messagesHref,
  initialUnreadMessages,
}: SiteHeaderClientProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [logoutPending, setLogoutPending] = useState(false);
  const [unreadMessagesState, setUnreadMessagesState] = useState<UnreadMessagesState>(() => ({
    sourceCount: initialUnreadMessages,
    count: initialUnreadMessages,
  }));
  const notificationsPanelRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  let unreadMessages = unreadMessagesState.count;
  if (unreadMessagesState.sourceCount !== initialUnreadMessages) {
    unreadMessages = initialUnreadMessages;
    setUnreadMessagesState({ sourceCount: initialUnreadMessages, count: initialUnreadMessages });
  }

  useEffect(() => {
    if (!messagesHref || auth.status !== "signedIn") {
      return;
    }

    const supabase = createClient();
    let debounce: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const channelRef: { current: ReturnType<typeof supabase.channel> | null } = { current: null };

    const refreshCount = (uid: string) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        void supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .is("read_at", null)
          .neq("sender_id", uid)
          .then(({ count, error }) => {
            if (!error) {
              const nextCount = count ?? 0;
              setUnreadMessagesState((prev) =>
                prev.count === nextCount ? prev : { ...prev, count: nextCount },
              );
            }
          });
      }, 100);
    };

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user?.id) {
        return;
      }
      const uid = user.id;
      refreshCount(uid);
      const ch = supabase
        .channel(`header-unread-messages:${uid}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => refreshCount(uid))
        .subscribe();
      if (cancelled) {
        void supabase.removeChannel(ch);
      } else {
        channelRef.current = ch;
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(debounce);
      const ch = channelRef.current;
      channelRef.current = null;
      if (ch) {
        void supabase.removeChannel(ch);
      }
    };
  }, [auth.status, messagesHref]);

  const refreshSession = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAuth({ status: "signedOut" });
      return;
    }
    const row = await fetchProfileByUserId(supabase, user.id);
    setAuth({ status: "signedIn", profile: row });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshSession();
    });
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshSession();
    });
    return () => subscription.unsubscribe();
  }, [refreshSession]);

  async function handleLogout() {
    setLogoutPending(true);
    await signOutAndRedirect(router, "/");
    setLogoutPending(false);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    setAccountMenuOpen(false);
  }

  async function handleNotificationClick(notification: HeaderNotification): Promise<void> {
    await markNotificationAsRead(notification.id);
    setNotificationsOpen(false);
    router.refresh();

    if (notification.link_url) {
      router.push(notification.link_url);
    }
  }

  const dashboardHref =
    auth.status === "signedIn" ? postAuthRedirectPath(auth.profile, { noProfile: "register" }) : "/login";

  const profileFullName = auth.status === "signedIn" ? auth.profile?.full_name ?? null : null;
  const profileRole = auth.status === "signedIn" ? auth.profile?.role ?? null : null;
  const initials = useMemo(() => getInitials(profileFullName), [profileFullName]);

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!notificationsPanelRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (auth.status !== "signedIn" && accountMenuOpen) {
      queueMicrotask(() => {
        setAccountMenuOpen(false);
      });
    }
  }, [auth.status, accountMenuOpen]);

  const messagesTrigger =
    messagesHref && auth.status === "signedIn" ? (
      <Link
        href={messagesHref}
        className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.02] text-white/85 transition-colors duration-200 ease-out hover:bg-white/10 hover:text-white"
        aria-label={unreadMessages > 0 ? `Messages, ${unreadMessages} unread` : "Messages"}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {unreadMessages > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-[#7EE5B7] px-1 py-0.5 text-center text-[10px] font-semibold leading-none text-[#06291d]">
            {unreadMessages > 99 ? "99+" : unreadMessages}
          </span>
        ) : null}
      </Link>
    ) : null;

  const notificationsTrigger = (
    <>
      <button
        type="button"
        className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.02] text-white/85 transition-colors duration-200 ease-out hover:bg-white/10 hover:text-white"
        aria-haspopup="menu"
        aria-expanded={notificationsOpen}
        aria-label={notificationsOpen ? "Close notifications" : "Open notifications"}
        onClick={() => setNotificationsOpen((value) => !value)}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V10a6 6 0 1 0-12 0v4.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M9.8 17a2.2 2.2 0 0 0 4.4 0" />
        </svg>
        {unreadNotifications > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-[#E5484D] px-1 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
            {unreadNotifications > 99 ? "99+" : unreadNotifications}
          </span>
        ) : null}
      </button>

      {notificationsOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.625rem)] z-50 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#06291d] shadow-2xl ring-1 ring-black/30 sm:w-80">
          <div className="border-b border-white/10 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Notifications</p>
          </div>
          <div className="max-h-96 overflow-y-auto px-2 py-2">
            {notifications.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-white/65">No notifications yet.</p>
            ) : (
              <ul className="space-y-1">
                {notifications.map((notification) => {
                  const isUnread = !notification.is_read;
                  const itemClass = isUnread
                    ? "border-l-2 border-[#7EE5B7] bg-white/[0.08] hover:bg-white/[0.14]"
                    : "border-l-2 border-transparent bg-transparent hover:bg-white/[0.08]";
                  const content = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`truncate text-sm ${isUnread ? "font-semibold text-white" : "font-medium text-white/85"}`}
                        >
                          {notification.title}
                        </p>
                        {isUnread ? (
                          <span
                            className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7EE5B7]"
                            aria-label="Unread notification"
                          />
                        ) : null}
                      </div>
                      <p className={`line-clamp-2 text-xs ${isUnread ? "font-medium text-white/85" : "text-white/60"}`}>
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[11px] text-white/50">{formatNotificationTimestamp(notification.created_at)}</p>
                    </>
                  );

                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        className={`block w-full rounded-xl px-2.5 py-2 text-left transition-colors duration-200 ease-out ${itemClass}`}
                        onClick={() => void handleNotificationClick(notification)}
                      >
                        {content}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </>
  );

  const accountTrigger = (
    <>
      <button
        type="button"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] text-[12px] font-semibold uppercase tracking-wide text-white transition-colors duration-200 ease-out hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
        aria-haspopup="menu"
        aria-expanded={accountMenuOpen}
        aria-label={accountMenuOpen ? "Close account menu" : "Open account menu"}
        onClick={() => setAccountMenuOpen((value) => !value)}
      >
        <span aria-hidden>{initials}</span>
      </button>

      {accountMenuOpen ? (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 top-[calc(100%+0.625rem)] z-50 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#06291d] shadow-2xl ring-1 ring-black/30"
        >
          {profileFullName ? (
            <div className="border-b border-white/10 px-4 py-3">
              <p className="truncate text-sm font-semibold text-white">{profileFullName}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/55">
                {roleLabel(profileRole)}
              </p>
            </div>
          ) : null}
          <ul className="py-1">
            <li>
              <Link
                href={dashboardHref}
                role="menuitem"
                className="block px-4 py-2 text-sm text-white/85 transition-colors duration-150 ease-out hover:bg-white/[0.08] hover:text-white"
                onClick={() => setAccountMenuOpen(false)}
              >
                Dashboard
              </Link>
            </li>
            {profileRole === "vendor" ? (
              <li>
                <Link
                  href="/vendor/profile"
                  role="menuitem"
                  className="block px-4 py-2 text-sm text-white/85 transition-colors duration-150 ease-out hover:bg-white/[0.08] hover:text-white"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  Vendor Profile
                </Link>
              </li>
            ) : null}
            {profileRole === "admin" ? (
              <li>
                <Link
                  href="/admin/dashboard"
                  role="menuitem"
                  className="block px-4 py-2 text-sm text-white/85 transition-colors duration-150 ease-out hover:bg-white/[0.08] hover:text-white"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              </li>
            ) : null}
          </ul>
          <div className="border-t border-white/10 py-1">
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2 text-left text-sm text-white/85 transition-colors duration-150 ease-out hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={logoutPending}
              onClick={() => void handleLogout()}
            >
              {logoutPending ? "Signing out…" : "Log Out"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/10 bg-[#004d40]/95 shadow-[var(--shadow-header)] backdrop-blur-md backdrop-saturate-150"
      data-notification-count={notifications.length}
      data-unread-notification-count={unreadNotifications}
      data-unread-message-count={unreadMessages}
    >
      <div className="mx-auto flex min-h-[4.5rem] max-w-6xl items-center gap-6 px-4 py-3 sm:min-h-[4.625rem] sm:gap-7 sm:px-6 md:min-h-[4.75rem] md:py-3.5 lg:gap-10 lg:px-8 xl:gap-12">
        <Link
          href="/"
          className="flex shrink-0 items-center rounded-sm pr-2 outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 sm:pr-4 md:pr-6 lg:pr-8"
        >
          <Image
            src="/logo.svg"
            alt="Brook Planner"
            width={180}
            height={40}
            sizes="(max-width: 640px) 126px, (max-width: 1024px) 144px, 180px"
            className="h-10 w-auto object-contain object-left sm:h-11 md:h-12 lg:h-14"
            priority
          />
        </Link>

        <nav
          className="hidden min-w-0 flex-1 justify-center gap-x-7 px-1 md:flex lg:gap-x-9 xl:gap-x-11"
          aria-label="Primary"
        >
          {marketingNavLinks().map((item) => (
            <Link key={item.href} href={item.href} className={`${navLinkClass} whitespace-nowrap`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 md:ml-0 md:gap-3 lg:gap-4">
          {auth.status === "signedIn" ? (
            <div className="flex shrink-0 items-center gap-2">
              {messagesTrigger}
              <div className="relative" ref={notificationsPanelRef}>
                {notificationsTrigger}
              </div>
            </div>
          ) : null}

          <div className="hidden items-center gap-x-6 border-l border-white/10 pl-6 md:flex lg:gap-x-7 lg:pl-8">
            {auth.status === "loading" ? (
              <span className="text-[13px] font-normal text-white/45 sm:text-sm" aria-hidden>
                …
              </span>
            ) : null}
            {auth.status === "signedOut" ? (
              <>
                <Link href="/login" className={`${textButtonClass} whitespace-nowrap`}>
                  Log In
                </Link>
                <Link href="/register" className={`${textButtonClass} whitespace-nowrap`}>
                  Sign Up
                </Link>
                <ButtonLink
                  href="/post-event"
                  variant="primary"
                  className="shrink-0 bg-[#E85D4A] px-4 py-2.5 text-sm font-semibold shadow-md ring-1 ring-white/15 hover:bg-[#d14f3f] hover:shadow-lg"
                >
                  Post Event
                </ButtonLink>
              </>
            ) : null}
            {auth.status === "signedIn" ? (
              <>
                <Link href={dashboardHref} className={`${textButtonClass} whitespace-nowrap`}>
                  Dashboard
                </Link>
                <div className="relative" ref={accountMenuRef}>
                  {accountTrigger}
                </div>
              </>
            ) : null}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 text-white transition-colors duration-200 ease-out hover:bg-white/10 md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((value) => !value)}
          >
            <span className="sr-only">Menu</span>
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-white/10 bg-[#004d40] px-4 py-5 md:hidden">
          <nav className="flex flex-col gap-3.5" aria-label="Mobile primary">
            {marketingNavLinks().map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 border-t border-white/10 pt-4">
              {auth.status === "loading" ? (
                <span className={`${navLinkClass} block`}>…</span>
              ) : auth.status === "signedOut" ? (
                <div className="flex flex-col gap-3.5">
                  <Link href="/login" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                    Log In
                  </Link>
                  <Link href="/register" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {profileFullName ? (
                    <div className="flex items-center gap-3 pb-1">
                      <span
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] text-[12px] font-semibold uppercase tracking-wide text-white"
                        aria-hidden
                      >
                        {initials}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">
                          {profileFullName}
                        </span>
                        <span className="block text-[11px] font-medium uppercase tracking-wide text-white/55">
                          {roleLabel(profileRole)}
                        </span>
                      </span>
                    </div>
                  ) : null}
                  <Link href={dashboardHref} className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  {messagesHref ? (
                    <Link href={messagesHref} className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                      Messages
                      {unreadMessages > 0 ? ` (${unreadMessages})` : ""}
                    </Link>
                  ) : null}
                  {profileRole === "vendor" ? (
                    <Link
                      href="/vendor/profile"
                      className={navLinkClass}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Vendor Profile
                    </Link>
                  ) : null}
                  {profileRole === "admin" ? (
                    <Link
                      href="/admin/dashboard"
                      className={navLinkClass}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className={`${navLinkClass} text-left`}
                    disabled={logoutPending}
                    onClick={() => void handleLogout()}
                  >
                    {logoutPending ? "Signing out…" : "Log Out"}
                  </button>
                </div>
              )}
            </div>
            {auth.status !== "signedIn" ? (
              <ButtonLink
                href="/post-event"
                variant="primary"
                className="mt-1 w-full bg-[#E85D4A] text-center text-sm font-semibold shadow-md ring-1 ring-white/15 hover:bg-[#d14f3f] hover:shadow-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Post Event
              </ButtonLink>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
