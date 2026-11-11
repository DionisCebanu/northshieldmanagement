import type { Route } from './+types/cards';
import { workspaceMeta } from '@/lib/workspace-meta';
import { Cards } from '@/pages/cards';
export function meta({ matches, location }: Route.MetaArgs) { return workspaceMeta({ matches, location }, 'Cards Management', 'Manage the selected fictional NorthShield customer’s debit and credit cards, including freeze, lost, stolen, fraud and close status servicing.'); }
export default function CardsPage() { return <Cards />; }
