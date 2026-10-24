
import { NavLink } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  ListChecks,
  Fingerprint,
  CreditCard,
  Landmark,
  FileSignature,
  Wallet,
  History,
  UserRound,
  PanelLeftClose,
  PanelLeftOpen,
  LockKeyhole,
  Store,
  X,
} from "lucide-react";

const menuGroups = [
  {
    title: "DASHBOARD",
    items: [
      {
        label: "Overview",
        path: "/retailer/overview",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "VERIFY",
    items: [
      {
        label: "Complete KYC",
        path: "/retailer/complete-kyc",
        icon: ListChecks,
      },
      {
        label: "Aadhaar Verification",
        path: "/retailer/aadhaar-verification",
        icon: Fingerprint,
      },
      {
        label: "PAN Verification",
        path: "/retailer/pan-verification",
        icon: CreditCard,
      },
      {
        label: "Bank Penny Drop",
        path: "/retailer/bank-penny-drop",
        icon: Landmark,
      },
      {
        label: "Consent e-Sign",
        path: "/retailer/consent-esign",
        icon: FileSignature,
      },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      {
        label: "Wallet",
        path: "/retailer/wallet",
        icon: Wallet,
      },
      {
        label: "Verification History",
        path: "/retailer/verification-history",
        icon: History,
      },
      {
        label: "Profile",
        path: "/retailer/profile",
        icon: UserRound,
      },
    ],
  },
];

export default function RetailerSidebar({
  collapsed = false,
  setCollapsed = () => {},
  mobileOpen = false,
  setMobileOpen = () => {},
}) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Main sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-white/10 bg-[#0d193b] text-[#bdc9e6] transition-all duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${collapsed ? "lg:w-[82px]" : "lg:w-[250px]"}
          w-[290px] lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2954e9] text-white">
              <ShieldCheck size={26} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-[21px] font-bold leading-6 text-white">
                  Verify<span className="text-[#94aaff]">Hub</span>
                </h1>

                <p className="text-[10px] font-semibold tracking-[0.09em]">
                  KYC PLATFORM
                </p>
              </div>
            )}
          </div>

          {/* Desktop collapse button */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
            className="hidden rounded-lg p-2 hover:bg-white/10 lg:block"
          >
            {collapsed ? (
              <PanelLeftOpen size={19} />
            ) : (
              <PanelLeftClose size={19} />
            )}
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Retailer role badge */}
        {!collapsed && (
          <div className="px-5 py-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#455c9c] bg-[#1a2c60] px-3 py-1 text-[12px] font-semibold text-[#d7e2ff]">
              <Store size={15} />
              RETAILER
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-5">
              {!collapsed && (
                <p className="mb-2 px-3 text-[11px] font-bold tracking-[0.1em] text-[#7185b1]">
                  {group.title}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex min-h-[49px] items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors ${
                          isActive
                            ? "bg-[#1b3066] text-white"
                            : "hover:bg-white/10 hover:text-white"
                        }`
                      }
                    >
                      <Icon
                        size={20}
                        className="shrink-0"
                        strokeWidth={1.8}
                      />

                      {!collapsed && (
                        <>
                          <span className="flex-1">
                            {item.label}
                          </span>

                          {item.count && (
                            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-bold text-[#101936]">
                              {item.count}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom demo panel */}
        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <LockKeyhole
              size={20}
              className="shrink-0 text-emerald-300"
            />

            {!collapsed && (
              <div>
                <p className="text-[12px] font-semibold text-white">
                  Demo environment
                </p>

                <p className="mt-1 text-[11px] leading-5">
                  Synthetic data · masked identifiers · no live KYC calls
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
