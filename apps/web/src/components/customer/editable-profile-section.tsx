import { useState } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { dateLabel, humanize } from '@/lib/banking-format';

export type FieldOption = { value: string; label: string };
export type EditableField = {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'email' | 'tel' | 'select';
  options?: FieldOption[];
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
};

export type EditableSectionProps = {
  title: string;
  icon: LucideIcon;
  fields: EditableField[];
  values: Record<string, string>;
  validate?: (values: Record<string, string>) => Record<string, string>;
  onSave: (values: Record<string, string>) => void;
};

function displayValue(field: EditableField, value: string): string {
  if (!value) return 'Not provided';
  if (field.options) return field.options.find(option => option.value === value)?.label ?? value;
  if (field.type === 'date') return dateLabel(value);
  return value;
}

export function EditableProfileSection({ title, icon: Icon, fields, values, validate, onSave }: EditableSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(values);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function startEdit() {
    setDraft(values);
    setErrors({});
    setEditing(true);
  }
  function cancelEdit() {
    setDraft(values);
    setErrors({});
    setEditing(false);
  }
  function save() {
    const nextErrors = validate?.(draft) ?? {};
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    onSave(draft);
    setEditing(false);
  }
  function updateField(key: string, value: string) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  return (
    <section className="panel profile-section">
      <div className="panel-heading profile-section-heading">
        <h2><Icon size={18} />{title}</h2>
        {!editing ? (
          <button className="button-secondary section-action" type="button" onClick={startEdit}><Pencil size={14} />Edit</button>
        ) : (
          <div className="section-actions">
            <button className="button-secondary section-action" type="button" onClick={cancelEdit}><X size={14} />Cancel</button>
            <button className="button-primary section-action" type="button" onClick={save}><Check size={14} />Save</button>
          </div>
        )}
      </div>
      <dl className="profile-fields">
        {fields.map(field => (
          <div key={field.key}>
            <dt>{field.label}{field.required && <span className="field-required"> *</span>}</dt>
            <dd>
              {editing && !field.readOnly ? (
                <div className="field-edit">
                  {field.type === 'select' ? (
                    <select className="profile-input" value={draft[field.key] ?? ''} onChange={event => updateField(field.key, event.target.value)}>
                      {field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : (
                    <input
                      className="profile-input"
                      type={field.type ?? 'text'}
                      value={draft[field.key] ?? ''}
                      placeholder={field.placeholder}
                      onChange={event => updateField(field.key, event.target.value)}
                    />
                  )}
                  {errors[field.key] && <span className="field-error">{errors[field.key]}</span>}
                </div>
              ) : (
                <span className={field.readOnly ? 'field-read-only' : ''}>{displayValue(field, values[field.key] ?? '')}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export const PROVINCE_OPTIONS: FieldOption[] = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
].map(code => ({ value: code, label: code }));

export const EMPLOYMENT_STATUS_OPTIONS: FieldOption[] = ['EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'STUDENT']
  .map(status => ({ value: status, label: humanize(status) }));

export const BOOLEAN_OPTIONS: FieldOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];
