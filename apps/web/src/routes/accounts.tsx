import type { Route } from './+types/accounts';
import { workspaceMeta } from '@/lib/workspace-meta';
import { Accounts } from '@/pages/accounts';
export function meta({ matches, location }: Route.MetaArgs) { return workspaceMeta({ matches, location }, 'Customer Accounts', 'View customer-owned accounts, resolved banking products, balances, branch information and related transactions in the fictional workspace.'); }
export default function AccountsPage() { return <Accounts />; }
