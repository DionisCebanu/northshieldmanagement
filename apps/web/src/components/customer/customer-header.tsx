import { Link } from 'react-router';
import { Phone, Mail, MapPin, CalendarDays, ArrowUpRight, UserRound } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { StatusBadge } from '@/components/customer/status-badge';
import { dateLabel } from '@/lib/banking-format';
export function CustomerHeader() {
  const { workspace } = useClient();
  if (!workspace) return null;
  const { client } = workspace;
  return <section className="customer-banner" aria-label="Selected customer"><div className="customer-identity"><div className="customer-avatar">{client.firstName.charAt(0)}{client.lastName.charAt(0)}</div><div><div className="eyebrow">CUSTOMER 360</div><div className="customer-name"><h2>{client.firstName} {client.lastName}</h2><StatusBadge status={client.status} /></div><div className="customer-identifiers"><span><UserRound size={14} />Client ID: <strong>{client.id}</strong></span><i /><span><CalendarDays size={14} />{dateLabel(client.dateOfBirth)}</span></div></div><Link className="button-secondary profile-link" to="/profile">View full profile <ArrowUpRight size={16} /></Link></div><div className="customer-contact"><span><Phone size={16} />{client.contact.mobilePhone ?? client.contact.homePhone ?? 'No phone provided'}</span><span><Mail size={16} />{client.contact.email || 'No email provided'}</span><span><MapPin size={16} />{client.address.city}, {client.address.province}</span><span className="customer-contact-note">Selected customer</span></div></section>;
}
