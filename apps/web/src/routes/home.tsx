import type { Route } from './+types/home';
import { seo } from '@/lib/seo';
import { CustomerOverview } from '@/pages/customer-overview';
export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, { title: 'NorthShield Agent Workspace | Customer Overview', description: 'A fictional Canadian banking employee workspace. View customer profiles, account balances and transaction history in one read-only interface.', image: 'https://images.hostinger.com/afff0461-e1b9-4735-ad44-65a8c1a58716/e2593db1-1397-442a-8890-8c64577877c7.png', noindex: true, jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'NorthShield Agent Workspace', description: 'Fictional banking employee demonstration workspace.' }, { '@context': 'https://schema.org', '@type': 'Organization', name: 'NorthShield Bank', description: 'Fictional Canadian bank used for demonstration purposes.' }] });
}
export default function HomePage() { return <CustomerOverview />; }
