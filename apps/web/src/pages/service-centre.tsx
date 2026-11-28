import { useState } from 'react';
import { Link } from 'react-router';
import {
  Smartphone,
  ShieldCheck,
  CreditCard,
  FileText,
  Search,
  ChevronRight,
  History,
} from 'lucide-react';
import { PageHeading } from '@/components/customer/page-heading';
import { DigitalBankingPanel } from '@/components/services/digital-banking/digital-banking-panel';
import { StopPaymentsPanel } from '@/components/services/stop-payments/stop-payments-panel';
import serviceCatalog from '@/data/service-catalog.json';

const icons = {
  digital: Smartphone,
  payments: ShieldCheck,
  cards: CreditCard,
  statements: FileText,
} as const;

export function ServiceCentre() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState('');
  const [digitalService, setDigitalService] = useState('');
  const [stopService, setStopService] = useState('');
  const q = query.trim().toLowerCase();

  const visible = serviceCatalog.filter(categoryItem => (
    (category === 'all' || categoryItem.id === category) &&
    (categoryItem.title.toLowerCase().includes(q) ||
      categoryItem.services.some(service => service.toLowerCase().includes(q)))
  ));

  return (
    <>
      <PageHeading title="Service Centre" description="Manage customer banking services from one workspace." />
      <section className="ns-sc" aria-label="Service catalogue">
        {digitalService ? (
          <>
            <button type="button" onClick={() => setDigitalService('')}>← Back to services</button>
            <DigitalBankingPanel initialService={digitalService} />
          </>
        ) : stopService ? (
          <>
            <button type="button" onClick={() => setStopService('')}>
              ← Back to services
            </button>
            <StopPaymentsPanel initialService={stopService} />
          </>
        ) : (
          <>
            <div className="ns-sc-toolbar">
              <label className="ns-sc-search">
                <Search size={19} />
                <input
                  aria-label="Search services"
                  placeholder="Search banking services..."
                  value={query}
                  onChange={event => {
                    setQuery(event.target.value);
                    setSelected('');
                  }}
                />
              </label>
              <span className="ns-sc-tag">Demo catalogue</span>
            </div>
            <div className="ns-sc-filters" aria-label="Filter services">
              {[{ id: 'all', title: 'All services' }, ...serviceCatalog].map(item => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={category === item.id}
                  onClick={() => {
                    setCategory(item.id);
                    setSelected('');
                  }}
                >
                  {item.title}
                </button>
              ))}
            </div>
            {selected && (
              <div className="ns-sc-notice" role="status">
                <div>
                  <strong>{selected}</strong>
                  <p>This workflow is planned for a future release.</p>
                </div>
                <button type="button" onClick={() => setSelected('')}>Close</button>
              </div>
            )}
            <div className="ns-sc-grid">
              {visible.map(item => {
                const Icon = icons[item.id as keyof typeof icons] ?? FileText;
                return (
                  <article className="ns-sc-card" key={item.id}>
                    <div className="ns-sc-card-head">
                      <span className="ns-sc-icon"><Icon size={24} /></span>
                      <div><h2>{item.title}</h2><p>{item.description}</p></div>
                    </div>
                    <div className="ns-sc-items">
                      {item.services.filter(service => (
                        item.title.toLowerCase().includes(q) || service.toLowerCase().includes(q)
                      )).map(service => service === 'PIN management' ? (
                        <Link className="ns-sc-item" key={service} to="/cards">
                          <span>{service}<small>Open Cards</small></span>
                          <ChevronRight size={16} />
                        </Link>
                      ) : (
                        <button
                          className="ns-sc-item"
                          key={service}
                          type="button"
                          onClick={() => {
                            if (item.id === 'digital') {
                              setDigitalService(service);
                            } else if (item.id === 'payments') {
                              setStopService(service);
                            } else {
                              setSelected(service);
                            }
                          }}
                        >
                          <span>{service}<small>{item.id === 'digital' || item.id === 'payments' ? 'Available' : 'Planned'}</small></span>
                          <ChevronRight size={16} />
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
            {!visible.length && <p className="ns-sc-empty">No services match your search.</p>}
            <button className="ns-sc-history" type="button" onClick={() => setSelected('Service request history')}>
              <History size={23} />
              <span><strong>Service request history</strong><small>Centralized audit history · Planned</small></span>
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </section>
    </>
  );
}
