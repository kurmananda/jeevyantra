"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Led from "@/components/Led";
import PanelToggle from "@/components/PanelToggle";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/members", label: "Members" },
  { href: "/inventory", label: "Inventory" },
];

function ChipLogo() {
  const [imgFailed, setImgFailed] = useState(false);

  if (!imgFailed) {
    return (
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[8px] border-[3px] border-border bg-orange shadow-[3px_3px_0_var(--border)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Jeevyantra logo"
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </span>
    );
  }

  return (
    <span className="relative flex h-9 w-9 items-center justify-center rounded-[8px] border-[3px] border-border bg-orange shadow-[3px_3px_0_var(--border)]">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <rect x="8" y="8" width="8" height="8" rx="1.5" stroke="#15130f" strokeWidth="1.8" />
        <path
          d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19"
          stroke="#15130f"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute -bottom-1 -right-1">
        <Led on pulse size={7} />
      </span>
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const navRef = useRef(null);
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });

  const activeHref =
    TABS.find((t) => (t.href === "/" ? pathname === "/" : pathname.startsWith(t.href)))?.href ?? "/";

  useLayoutEffect(() => {
    function measure() {
      const el = tabRefs.current[activeHref];
      const container = navRef.current;
      if (!el || !container) return;
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setIndicator({ left: elRect.left - containerRect.left, width: elRect.width, opacity: 1 });
    }

    measure();
    // re-measure once fonts finish swapping in, and on resize
    document.fonts?.ready?.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeHref]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await getSupabaseClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <div className="sticky top-3 z-40 px-3 sm:top-4 sm:px-5">
        <div className="nav-float mx-auto flex max-w-5xl items-center justify-between gap-4 px-3 py-2 sm:px-4">
          <Link href="/" className="flex items-center gap-2.5 pl-1">
            <ChipLogo />
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-display text-[15px] font-bold uppercase tracking-tight text-foreground">
                Jeevyantra
              </span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
                Robotics Club
              </span>
            </span>
          </Link>

          <nav
            ref={navRef}
            className="relative hidden items-center gap-0.5 rounded-xl border-2 border-border bg-background p-1 sm:flex"
          >
            <span
              className="absolute top-1 bottom-1 rounded-lg border-2 border-border bg-orange transition-[left,width] duration-200 ease-out"
              style={{ left: indicator.left, width: indicator.width, opacity: indicator.opacity }}
            />
            {TABS.map((tab) => {
              const active = tab.href === activeHref;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  ref={(el) => {
                    tabRefs.current[tab.href] = el;
                  }}
                  className={`relative z-10 flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
                    active ? "text-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  <PanelToggle on={active} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 pr-0.5">
            {user ? (
              <>
                <Link href="/members/profile" className="push-btn rounded-lg px-3 py-1.5 text-[13px] font-medium">
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="push-btn rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" className="push-btn primary rounded-lg px-4 py-1.5 text-[13px] font-medium">
                Sign in
              </Link>
            )}
          </div>
        </div>

        <nav className="nav-float mx-auto mt-2 flex max-w-5xl items-center gap-1 overflow-x-auto px-2 py-1.5 sm:hidden">
          {TABS.map((tab) => {
            const active = tab.href === activeHref;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex shrink-0 items-center gap-2 rounded-lg border-2 px-3 py-1 text-xs font-bold ${
                  active ? "border-border bg-orange text-foreground" : "border-transparent text-muted"
                }`}
              >
                <PanelToggle on={active} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
