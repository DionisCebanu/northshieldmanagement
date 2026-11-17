import { Bell, Search, Menu, ChevronDown, ShieldCheck, MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useClient } from '@/contexts/client-context';
import { CustomerSearchModal } from '@/components/customer/customer-search-modal';
import { CustomerNotesModal } from '@/components/customer/customer-notes-modal';
import { demoEmployee } from '@/config/employee-session';
import { isNoteActive } from '@/services/noteService';

export function TopHeader({ menuProps }: { menuProps: { onClick: () => void; 'aria-expanded': boolean; 'aria-controls': string } }) {
  const notifications = useDisclosure();
  const { workspace, loading } = useClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const activeNotes = workspace?.notes.filter(note => isNoteActive(note.expiresAt)).length ?? 0;

  return <>
    <header className="top-header">
      <button className="icon-button mobile-menu" aria-label="Toggle navigation" {...menuProps}><Menu size={22} /></button>
      <div className="app-title">NorthShield <span>Agent Workspace</span></div>
      <button type="button" className="global-search customer-search-trigger" onClick={() => setSearchOpen(true)}><Search size={17}/><span>Search customer</span></button>
      <div className="header-actions">
        <span className="internal-tag"><ShieldCheck size={14} />Internal use</span>
        <div className="notification-wrapper">
          <button className="icon-button" aria-label="Notifications" {...notifications.triggerProps}><Bell size={20} /><span className="notification-dot" /></button>
          {notifications.isOpen && <div className="notification-panel" {...notifications.panelProps}><strong>Notifications</strong><p>You’re all caught up.</p><small>Live notifications will be available in a future phase.</small></div>}
        </div>
        <button type="button" className="icon-button customer-notes-trigger" aria-label={`Customer notes and alerts${activeNotes ? `, ${activeNotes} active` : ''}`} title="Customer notes and alerts" onClick={() => setNotesOpen(true)} disabled={!workspace || loading}>
          <MessageSquareText size={20} />{activeNotes > 0 && <span className="customer-notes-count">{activeNotes}</span>}
        </button>
        <div className="employee"><div className="employee-avatar">DC</div><div className="employee-copy"><strong>{demoEmployee.displayName}</strong><span>{demoEmployee.role}</span></div><ChevronDown size={15} className="employee-chevron" /></div>
      </div>
    </header>
    {searchOpen && <CustomerSearchModal onClose={() => setSearchOpen(false)} />}
    {notesOpen && workspace && <CustomerNotesModal key={workspace.client.id} onClose={() => setNotesOpen(false)} />}
  </>;
}
