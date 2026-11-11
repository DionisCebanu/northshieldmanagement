import { BriefcaseBusiness, GraduationCap, ArrowUpRight, Info } from 'lucide-react';
import { Link } from 'react-router';
import { useClient } from '@/contexts/client-context';
import { humanize } from '@/lib/banking-format';
export function CustomerDetails() {
  const { workspace } = useClient();
  if (!workspace) return null;
  const { client } = workspace;
  return <section className="panel customer-details"><div className="panel-heading"><h2>Customer details</h2><Link to="/profile" className="icon-link" aria-label="View customer details"><ArrowUpRight size={18} /></Link></div><div className="detail-summary"><span className="detail-summary-icon"><BriefcaseBusiness size={18} /></span><div><small>EMPLOYMENT</small><strong>{client.employment.occupation ?? humanize(client.employment.status)}</strong><span>{client.employment.employer ?? 'Employer not provided'}</span><span className="subtle-label">{humanize(client.employment.status)}</span></div></div><div className="detail-summary"><span className="detail-summary-icon"><GraduationCap size={20} /></span><div><small>EDUCATION</small><strong>{client.student.isStudent ? client.student.institution ?? 'Institution not provided' : 'Not currently a student'}</strong><span>{client.student.program ?? 'No program on file'}</span>{client.student.isStudent && <span className="subtle-label">Student</span>}</div></div><div className="read-only-note"><Info size={16} /><p>Profile information is read-only in this workspace.</p></div></section>;
}
