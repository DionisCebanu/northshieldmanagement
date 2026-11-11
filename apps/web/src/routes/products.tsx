import type { Route } from './+types/products';
import { workspaceMeta } from '@/lib/workspace-meta';
import { Products } from '@/pages/products';
export function meta({ matches, location }: Route.MetaArgs) { return workspaceMeta({ matches, location }, 'Banking Products', 'Issue debit and credit cards, open chequing, savings and registered accounts, and submit personal loan and line of credit applications in the fictional workspace.'); }
export default function ProductsPage() { return <Products />; }
