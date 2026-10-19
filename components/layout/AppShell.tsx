"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Activity,
  ArrowUpRight,
  Bell,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  Command,
  FlaskConical,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Orbit,
  PanelLeftClose,
  Search,
  Settings2,
  ShieldCheck,
  Signal,
  Sparkles,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { useDemoStore } from "@/store/demo-store";
import { Badge, Drawer } from "@/components/ui/primitives";
import type { AssetId } from "@/types";
export const navigation = [
  {
    group: "MAIN WORKSPACE",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/markets", label: "Market Terminal", icon: ChartNoAxesCombined },
      { href: "/agents", label: "AI Agent War Room", icon: UsersRound },
      { href: "/signals", label: "Signal Center", icon: Signal },
      { href: "/portfolio", label: "Portfolio", icon: Wallet },
    ],
  },
  {
    group: "INTELLIGENCE",
    items: [
      { href: "/strategies", label: "Strategy Lab", icon: FlaskConical },
      { href: "/risk", label: "Risk Control", icon: ShieldCheck },
      { href: "/assistant", label: "AI Assistant", icon: MessageSquare },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { href: "/activity", label: "Activity Logs", icon: Activity },
      { href: "/settings", label: "Settings", icon: Settings2 },
    ],
  },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(),
    router = useRouter();
  const state = useDemoStore();
  const [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(""),
    [notifications, setNotifications] = useState(false),
    [profile, setProfile] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(() => {
    void useDemoStore.persist.rehydrate();
    const timer = setTimeout(() => {
      setReady(true);
      setCollapsed(localStorage.getItem("crypto-sidebar") === "collapsed");
    }, 0);
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setSearch((value) => !value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handler);
    };
  }, []);
  const pending = state.signals.filter(
    (signal) => signal.status === "pending",
  ).length;
  const current =
    navigation
      .flatMap((group) => group.items)
      .find((item) => item.href === pathname)?.label ?? "Workspace";
  const navContent = (
    <>
      <Link
        className="brand"
        href="/dashboard"
        onClick={() => setMobile(false)}
      >
        <span className="brand-mark">
          <Orbit size={23} />
        </span>
        <span className="brand-type">
          CRYPTO<span>AI</span>
          <small>MISSION CONTROL</small>
        </span>
      </Link>
      <div className="workspace-switch">
        <span className="workspace-avatar">P</span>
        <div>
          Personal workspace<small>Research & paper trading</small>
        </div>
        <ChevronDown size={14} />
      </div>
      <nav aria-label="Main navigation">
        {navigation.map((group) => (
          <div className="nav-group" key={group.group}>
            <div className="nav-label">{group.group}</div>
            {group.items.map((item) => (
              <Link
                title={collapsed ? item.label : undefined}
                onClick={() => setMobile(false)}
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? "active" : ""}`}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.href === "/signals" && pending > 0 && (
                  <b className="nav-count">{pending}</b>
                )}
                {item.href === "/assistant" && (
                  <Sparkles size={12} className="nav-spark" />
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="engine-status">
          <span className="status-dot" />
          <span>
            Demo engine online<small>Local simulation · v1.0</small>
          </span>
        </div>
        <button
          className="collapse-button"
          onClick={() => {
            setCollapsed(!collapsed);
            localStorage.setItem(
              "crypto-sidebar",
              !collapsed ? "collapsed" : "expanded",
            );
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeftClose size={17} />
          <span>Collapse sidebar</span>
        </button>
      </div>
    </>
  );
  return (
    <div
      className={`app-shell ${collapsed ? "sidebar-collapsed" : ""} ${state.settings.density === "compact" ? "density-compact" : ""} ${state.settings.reduceMotion ? "reduce-motion" : ""}`}
      data-number-format={state.settings.numberFormat}
    >
      <aside className="sidebar">{navContent}</aside>
      <Dialog.Root open={mobile} onOpenChange={setMobile}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="mobile-sidebar">
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Dialog.Description className="sr-only">
              Select a workspace page
            </Dialog.Description>
            <Dialog.Close
              className="mobile-close icon-button"
              aria-label="Close navigation"
            >
              <X size={20} />
            </Dialog.Close>
            {navContent}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="app-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMobile(true)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{current}</strong>
          </div>
          <div className="topbar-actions">
            <label className="global-asset">
              <span className="sr-only">Global asset</span>
              <select
                value={state.selectedAsset}
                onChange={(e) => state.selectAsset(e.target.value as AssetId)}
              >
                {state.assets.map((asset) => (
                  <option value={asset.id} key={asset.id}>
                    {asset.id}/USDT
                  </option>
                ))}
              </select>
            </label>
            <span className="feed-status">
              <span className="status-dot" />
              {state.clock.slice(11, 16)} UTC · demo
            </span>
            <button
              className="search-button"
              aria-label="Open command palette"
              onClick={() => setSearch(true)}
            >
              <Search size={16} />
              <span>Search anything</span>
              <kbd>⌘ K</kbd>
            </button>
            <div className="top-divider" />
            <button
              className="icon-button notification-button"
              aria-label="Open notifications"
              onClick={() => setNotifications(true)}
            >
              <Bell size={18} />
              {state.settings.notifications && state.events.length > 0 && <i />}
            </button>
            <button
              className="profile-button"
              aria-label="Open profile"
              onClick={() => setProfile(true)}
            >
              JD
            </button>
          </div>
        </header>
        <div
          className={`environment-bar ${state.emergencyStop ? "stopped" : ""}`}
        >
          <span>
            <span className="status-dot" />
            {state.emergencyStop
              ? "EMERGENCY STOP · NEW ORDERS BLOCKED"
              : "DEMO ENVIRONMENT"}
            <span className="environment-detail">
              {" "}
              · SIMULATED MARKET DATA · PAPER TRADING ONLY
            </span>
          </span>
          <Link href="/risk">
            {state.emergencyStop ? "Review & unlock" : "Risk controls active"}
            <ChevronRight size={12} />
          </Link>
        </div>
        <main id="main-content">
          {ready ? (
            children
          ) : (
            <div className="loading-skeleton" role="status">
              Preparing your workspace…
            </div>
          )}
        </main>
        <footer className="app-footer">
          <span>
            <Orbit size={12} /> CRYPTO AI <span className="footer-dot">/</span>{" "}
            Intelligent markets. Controlled decisions.
          </span>
          <span>
            Local demo <span className="status-dot" /> All systems simulated
          </span>
        </footer>
      </div>
      <Drawer
        open={notifications}
        onOpenChange={setNotifications}
        title="Notification center"
      >
        <p className="muted">Recent simulation and account events.</p>
        <div className="stack">
          {state.events.slice(0, 8).map((event) => (
            <Link
              className="notification-item"
              href="/activity"
              onClick={() => setNotifications(false)}
              key={event.id}
            >
              <Badge>{event.type}</Badge>
              <p>{event.summary}</p>
              <small className="muted">
                {new Date(event.timestamp).toLocaleString("en-GB", {
                  timeZone: "UTC",
                })}{" "}
                UTC
              </small>
            </Link>
          ))}
        </div>
      </Drawer>
      <Drawer
        open={profile}
        onOpenChange={setProfile}
        title="Personal workspace"
      >
        <div className="profile-card">
          <span className="profile-button">JD</span>
          <div>
            <h3>Jamie Demo</h3>
            <p className="muted">Local demonstration account</p>
          </div>
        </div>
        <p>
          No account connection is required. Your demo state stays in this
          browser.
        </p>
        <Link
          className="button"
          href="/settings"
          onClick={() => setProfile(false)}
        >
          Workspace settings <ArrowUpRight size={14} />
        </Link>
      </Drawer>
      <Dialog.Root open={search} onOpenChange={setSearch}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="command-dialog">
            <Dialog.Title className="sr-only">Search workspace</Dialog.Title>
            <Dialog.Description className="sr-only">
              Search pages or assets, then select a result
            </Dialog.Description>
            <div className="command-input">
              <Search size={20} />
              <input
                autoFocus
                id="command-palette-input"
                placeholder="Search pages or assets…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Command palette search"
              />
              <Dialog.Close className="icon-button" aria-label="Close search">
                <X size={18} />
              </Dialog.Close>
            </div>
            <div className="command-results">
              {navigation
                .flatMap((group) => group.items)
                .filter((item) =>
                  item.label.toLowerCase().includes(query.toLowerCase()),
                )
                .map((item) => (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      setSearch(false);
                      setQuery("");
                    }}
                  >
                    <item.icon size={17} />
                    {item.label}
                    <ChevronRight size={14} />
                  </button>
                ))}
              {state.assets
                .filter((asset) =>
                  (asset.name + asset.id)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      state.selectAsset(asset.id);
                      router.push("/markets");
                      setSearch(false);
                    }}
                  >
                    <ChartNoAxesCombined size={17} />
                    {asset.name} · {asset.id}/USDT
                    <ArrowUpRight size={14} />
                  </button>
                ))}
            </div>
            <div className="command-footer">
              <Command size={12} /> Search your entire demo workspace
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
