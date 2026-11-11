import type { Route } from './+types/transactions';
import { workspaceMeta } from '@/lib/workspace-meta';
import { Transactions } from '@/pages/transactions';
export function meta({ matches, location }: Route.MetaArgs) { return workspaceMeta({ matches, location }, 'Transaction History', 'Filter the selected fictional customer’s transaction history by account, transaction type and date range in the NorthShield Agent Workspace.'); }
export default function TransactionsPage() { return <Transactions />; }
