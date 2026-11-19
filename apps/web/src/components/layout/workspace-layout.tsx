import { Outlet, useLocation } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { TopHeader } from '@/components/layout/top-header';
import { IncomingCustomerAlert } from '@/components/customer/incoming-customer-alert';
import { CallSessionProvider } from '@/contexts/call-session-context';
import { CallControlBar } from '@/components/calls/call-control-bar';
import { useDisclosure } from '@/hooks/use-disclosure';
import { navigationItems } from '@/data/navigation';
import { useClient } from '@/contexts/client-context';
export function WorkspaceLayout() {
  const menu = useDisclosure({ lockScroll: true });
  const { pathname } = useLocation();
  const { workspace } = useClient();
  const label = navigationItems.find(item => item.path === pathname)?.label ?? 'Workspace';
  return <CallSessionProvider><div className="app-shell"><a href="#main-content" className="skip-link">Skip to content</a><Sidebar mobileOpen={menu.isOpen} panelId={menu.panelProps.id} />{menu.isOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={menu.close} />}<div className="workspace-shell"><TopHeader menuProps={menu.triggerProps} /><CallControlBar /><main id="main-content" className="main-content"><div className="breadcrumb"><span>Workspace</span><ChevronRight size={13} /><span>Customers</span><ChevronRight size={13} /><strong>{label}</strong>{workspace && <span className="session-customer"></span>}</div><Outlet /></main><footer className="workspace-footer"><span>NorthShield Bank <span className="footer-separator">/</span> Employee workspace</span></footer></div><IncomingCustomerAlert /></div></CallSessionProvider>;
}
