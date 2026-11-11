import { NavLink } from 'react-router';
import { Shield, LayoutDashboard, UserRound, Wallet, ArrowLeftRight, ArrowRightLeft, CreditCard, ClipboardList, ShieldCheck, Layers, ChartNoAxesCombined, ChevronRight, CircleHelp, Receipt, type LucideIcon } from 'lucide-react';
import { navigationItems } from '@/data/navigation';
const icons: Record<(typeof navigationItems)[number]['icon'], LucideIcon> = { overview: LayoutDashboard, profile: UserRound, accounts: Wallet, transactions: ArrowLeftRight, transfers: ArrowRightLeft, cards: CreditCard, billpay: Receipt, requests: ClipboardList, security: ShieldCheck, products: Layers, reports: ChartNoAxesCombined };
export function Sidebar({ mobileOpen, panelId }: { mobileOpen: boolean; panelId: string }) {
  return <aside id={panelId} className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
    <a className="bank-brand" href="/"><span className="brand-shield"><Shield size={29} strokeWidth={1.8} /></span><span>NorthShield<span className="brand-sub">BANK</span></span></a>
    <div className="sidebar-workspace">AGENT WORKSPACE <span>01</span></div>
    <div className="nav-caption">CUSTOMER MANAGEMENT</div>
    <nav aria-label="Main navigation">{navigationItems.map(item => { const Icon = icons[item.icon]; return <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}><Icon size={19} strokeWidth={1.7} /><span>{item.label}</span>{item.path === '/' && <ChevronRight className="nav-chevron" size={15} />}</NavLink>; })}</nav>
    <div className="sidebar-bottom"><div className="workspace-mode"><span className="mode-dot" /><div>Demo workspace<small>Fictional data · Read-only</small></div></div><div className="help-note"><CircleHelp size={17} /><span>Foundation release</span><span className="version">v1.0</span></div><div className="sidebar-copyright">© 2026 NorthShield Bank</div></div>
  </aside>;
}
