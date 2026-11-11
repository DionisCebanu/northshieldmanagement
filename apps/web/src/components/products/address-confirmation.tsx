import { useState } from 'react';
import { MapPin, Check, Pencil, ShieldCheck } from 'lucide-react';
import type { Client } from '@/lib/banking-types';
import { useClient } from '@/contexts/client-context';
import { PROVINCE_OPTIONS } from '@/components/customer/editable-profile-section';
import { isValidCanadianPostalCode } from '@/lib/validation';

export function AddressConfirmation({ client, confirmed, onStateChange }: { client: Client; confirmed: boolean; onStateChange: (confirmed: boolean) => void }) {
  const { updateClient } = useClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    street: client.address.street,
    unit: client.address.unit ?? '',
    city: client.address.city,
    province: client.address.province,
    postalCode: client.address.postalCode,
    country: client.address.country,
  });
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setEditing(false);
    onStateChange(true);
  }

  function startEdit() {
    setDraft({
      street: client.address.street,
      unit: client.address.unit ?? '',
      city: client.address.city,
      province: client.address.province,
      postalCode: client.address.postalCode,
      country: client.address.country,
    });
    setError(null);
    setEditing(true);
    onStateChange(false);
  }

  function saveEdit() {
    if (!draft.street.trim() || !draft.city.trim() || !draft.country.trim()) {
      setError('Street, city and country are required.');
      return;
    }
    if (!isValidCanadianPostalCode(draft.postalCode)) {
      setError('Enter a valid Canadian postal code (e.g. H1A 1A1).');
      return;
    }
    void updateClient({
      address: {
        ...client.address,
        street: draft.street.trim(),
        unit: draft.unit.trim() || null,
        city: draft.city.trim(),
        province: draft.province,
        postalCode: draft.postalCode.toUpperCase(),
        country: draft.country.trim(),
      },
    });
    setEditing(false);
    setError(null);
  }

  return (
    <section className="panel address-confirmation">
      <div className="panel-heading">
        <h2><MapPin size={18} />Mailing address confirmation</h2>
        {confirmed && !editing && <span className="status-badge status-positive"><span /><ShieldCheck size={12} />Address confirmed</span>}
      </div>
      {!editing ? (
        <div className="address-confirm-body">
          <div className="address-confirm-text">
            <strong>{client.firstName} {client.lastName}</strong>
            <span>{client.address.street}{client.address.unit ? `, ${client.address.unit}` : ''}</span>
            <span>{client.address.city}, {client.address.province} {client.address.postalCode}</span>
            <span>{client.address.country}</span>
          </div>
          <div className="address-confirm-actions">
            {!confirmed && <button className="button-primary" type="button" onClick={confirm}><Check size={15} />Confirm address</button>}
            <button className="button-secondary" type="button" onClick={startEdit}><Pencil size={14} />Edit address</button>
          </div>
        </div>
      ) : (
        <div className="address-edit-form">
          <div className="transfer-row">
            <label><span>Street</span><input className="profile-input" value={draft.street} onChange={e => setDraft({ ...draft, street: e.target.value })} /></label>
            <label><span>Unit</span><input className="profile-input" value={draft.unit} onChange={e => setDraft({ ...draft, unit: e.target.value })} /></label>
          </div>
          <div className="transfer-row">
            <label><span>City</span><input className="profile-input" value={draft.city} onChange={e => setDraft({ ...draft, city: e.target.value })} /></label>
            <label><span>Province</span>
              <select className="profile-input" value={draft.province} onChange={e => setDraft({ ...draft, province: e.target.value })}>
                {PROVINCE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
          <div className="transfer-row">
            <label><span>Postal code</span><input className="profile-input" value={draft.postalCode} onChange={e => setDraft({ ...draft, postalCode: e.target.value })} /></label>
            <label><span>Country</span><input className="profile-input" value={draft.country} onChange={e => setDraft({ ...draft, country: e.target.value })} /></label>
          </div>
          {error && <p className="filter-error" role="alert">{error}</p>}
          <div className="transfer-actions">
            <button className="button-secondary" type="button" onClick={() => setEditing(false)}>Cancel</button>
            <button className="button-primary" type="button" onClick={saveEdit}>Save address</button>
          </div>
        </div>
      )}
      <p className="transfer-note">The customer mailing address must be confirmed before a card can be issued.</p>
    </section>
  );
}
