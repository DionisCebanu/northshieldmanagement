import { useState } from 'react';
import { Link } from 'react-router';
import { Smartphone, ShieldCheck, CreditCard, FileText, Search, ChevronRight, History } from 'lucide-react';
import { PageHeading } from '@/components/customer/page-heading';
import serviceCatalog from '@/data/service-catalog.json';
const icons = { digital: Smartphone, payments: ShieldCheck, cards: CreditCard, statements: FileText };
export function ServiceCentre() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState('');
  const q = query.trim().toLowerCase();
  const visible = serviceCatalog.filter(c => (category === 'all' || c.id === category) && (c.title.toLowerCase().includes(q) || c.services.some(s => s.toLowerCase().includes(q))));
  return <><PageHeading title="Service Centre" description="Manage customer banking services from one workspace." />
    <section className="ns-sc" aria-label="Service catalogue">
      <div className="ns-sc-toolbar"><label className="ns-sc-search"><Search size={19}/><input aria-label="Search services" placeholder="Search banking services..." value={query} onChange={e => {setQuery(e.target.value); setSelected('');}} /></label><span className="ns-sc-tag">Demo catalogue</span></div>
      <div className="ns-sc-filters" aria-label="Filter services">{[{id:'all',title:'All services'}, ...serviceCatalog].map(c => <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => {setCategory(c.id);setSelected('');}}>{c.title}</button>)}</div>
      {selected && <div className="ns-sc-notice" role="status"><div><strong>{selected}</strong><p>This workflow is planned for a future release. No request has been submitted.</p></div><button type="button" onClick={() => setSelected('')}>Close</button></div>}
      <div className="ns-sc-grid">{visible.map(c => { const Icon = icons[c.id]; return <article className="ns-sc-card" key={c.id}><div className="ns-sc-card-head"><span className="ns-sc-icon"><Icon size={24}/></span><div><h2>{c.title}</h2><p>{c.description}</p></div></div><div className="ns-sc-items">{c.services.filter(s => c.title.toLowerCase().includes(q) || s.toLowerCase().includes(q)).map(s => s === 'PIN management' ? <Link className="ns-sc-item" key={s} to="/cards"><span>{s}<small>Open Cards</small></span><ChevronRight size={16}/></Link> : <button className="ns-sc-item" key={s} type="button" onClick={() => setSelected(s)}><span>{s}<small>Planned</small></span><ChevronRight size={16}/></button>)}</div></article>; })}</div>
      {!visible.length && <p className="ns-sc-empty">No services match your search.</p>}
      <button className="ns-sc-history" type="button" onClick={() => setSelected('Service request history')}><History size={23}/><span><strong>Service request history</strong><small>Centralized audit history · Planned</small></span><ChevronRight size={18}/></button>
    </section></>;
}
