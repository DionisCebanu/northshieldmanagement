import type { LucideIcon } from 'lucide-react';
export function ProfileSection({ title, icon: Icon, fields }: { title: string; icon: LucideIcon; fields: { label: string; value: string | number | null | undefined }[] }) {
  return <section className="panel profile-section"><div className="panel-heading"><h2><Icon size={18} />{title}</h2></div><dl className="profile-fields">{fields.map(field => <div key={field.label}><dt>{field.label}</dt><dd>{field.value ?? 'Not provided'}</dd></div>)}</dl></section>;
}
