import { Bell, Search, Menu, ChevronDown, ShieldCheck } from 'lucide-react';
import { useDisclosure } from '@/hooks/use-disclosure';
import { CustomerSearchModal } from '@/components/customer/customer-search-modal';
import { useState } from 'react';
export function TopHeader({ menuProps }: { menuProps: { onClick: () => void; 'aria-expanded': boolean; 'aria-controls': string } }) {
  const notifications = useDisclosure();
  const [searchOpen, setSearchOpen] = useState(false);
  return <> 
  <header className="top-header">
    <button className="icon-button mobile-menu" aria-label="Toggle navigation" {...menuProps}><Menu size={22} /></button>
    <div className="app-title">NorthShield 
      <span>Agent Workspace</span>
    </div><button type="button" className="global-search customer-search-trigger" onClick={() => setSearchOpen(true)}>
      <Search size={17}/><span>Search customer</span></button>
      <div className="header-actions"><span className="internal-tag">
        <ShieldCheck size={14} />Internal use</span>
      <div className="notification-wrapper">
        <button className="icon-button" aria-label="Notifications" {...notifications.triggerProps}>
          <Bell size={20} />
          <span className="notification-dot" />
        </button>{notifications.isOpen && 
        <div className="notification-panel" {...notifications.panelProps}><strong>Notifications</strong>
          <p>You’re all caught up.</p>
            <small>Live notifications will be available in a future phase.</small>
        </div>}
        </div>
        <div className="employee">
          <div className="employee-avatar">AJ</div>
        <div className="employee-copy">
          <strong>Dionis Cebanu</strong><span>EveryDay Banking Specialist</span>
        </div>
         <ChevronDown size={15} className="employee-chevron" />
        </div>
        </div>
          </header>{searchOpen && <CustomerSearchModal onClose={() => setSearchOpen(false)} />}
        </>;
}
