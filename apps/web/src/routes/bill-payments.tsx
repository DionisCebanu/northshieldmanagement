import type { Route } from './+types/bill-payments';
import { workspaceMeta } from '@/lib/workspace-meta';
import { BillPayments } from '@/pages/bill-payments';
export function meta({ matches, location }: Route.MetaArgs) { return workspaceMeta({ matches, location }, 'Bill Payments', 'Pay bills, manage payees, schedule payments and review payment history for the selected fictional NorthShield customer.'); }
export default function BillPaymentsPage() { return <BillPayments />; }
