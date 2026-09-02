"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Led from "@/components/Led";
import PanelToggle from "@/components/PanelToggle";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/tasks", label: "Tasks" },
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

function MenuIcon({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      {open ? (
        <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      ) : (
        <path
          d="M4 6h16M4 12h16M4 18h16"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });

  const onProfile = pathname.startsWith("/members/profile");
  const activeHref = onProfile
    ? null
    : TABS.find((t) => (t.href === "/" ? pathname === "/" : pathname.startsWith(t.href)))?.href ?? "/";

  useLayoutEffect(() => {
    function measure() {
      if (!activeHref) {
        setIndicator((i) => ({ ...i, opacity: 0 }));
        return;
      }
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

  return (
    <div className="sticky top-3 z-40 px-3 sm:top-4 sm:px-5">
      <div className="nav-float mx-auto flex max-w-5xl items-center justify-between gap-4 px-3 py-2 sm:px-4">
        <Link href="/" className="flex items-center gap-2.5 pl-1">
          <ChipLogo />
          <span className="flex flex-col leading-none">
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

        <div className="hidden items-center gap-2 pr-0.5 sm:flex">
          {user === undefined ? (
            <span className="flex h-9 w-20 items-center justify-center">
              <Led on pulse size={8} />
            </span>
          ) : user ? (
            <Link
              href="/members/profile"
              className={`push-btn profile-glow rounded-lg px-3 py-1.5 text-[13px] font-medium ${
                onProfile ? "primary" : ""
              }`}
            >
              Profile
            </Link>
          ) : (
            <Link href="/login" className="push-btn primary rounded-lg px-4 py-1.5 text-[13px] font-medium">
              Sign in
            </Link>
          )}
        </div>

        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="push-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:hidden"
        >
          <MenuIcon open={menuOpen} />
        </button>
      </div>

      {menuOpen && (
        <nav className="nav-float mx-auto mt-2 flex max-w-5xl flex-col gap-1 p-2 sm:hidden">
          {TABS.map((tab) => {
            const active = tab.href === activeHref;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-bold ${
                  active ? "border-border bg-orange text-foreground" : "border-transparent text-muted"
                }`}
              >
                <PanelToggle on={active} />
                {tab.label}
              </Link>
            );
          })}

          <div className="my-1 border-t-2 border-dashed border-border" />

          {user === undefined ? (
            <span className="flex items-center gap-2 px-3 py-2">
              <Led on pulse size={8} />
              <span className="text-xs font-bold uppercase tracking-widest text-muted">Checking session...</span>
            </span>
          ) : user ? (
            <Link
              href="/members/profile"
              onClick={() => setMenuOpen(false)}
              className={`profile-glow flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-bold ${
                onProfile ? "border-border bg-orange text-foreground" : "border-transparent text-muted"
              }`}
            >
              <PanelToggle on={onProfile} />
              Profile
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="push-btn primary rounded-lg px-3 py-2 text-center text-sm font-bold"
            >
              Sign in
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
