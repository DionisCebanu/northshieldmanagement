import type { Route } from './+types/transfers';
import { workspaceMeta } from '@/lib/workspace-meta';
import { Transfers } from '@/pages/transfers';
export function meta({ matches, location }: Route.MetaArgs) { return workspaceMeta({ matches, location }, 'Internal Transfers', 'Simulate moving funds between the selected fictional NorthShield customer’s active accounts in the same currency.'); }
export default function TransfersPage() { return <Transfers />; }
