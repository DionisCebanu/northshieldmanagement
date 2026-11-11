import type { Route } from './+types/fraud-security';
import { workspaceMeta } from '@/lib/workspace-meta';
import { FraudSecurity } from '@/pages/fraud-security';
export function meta({ matches, location }: Route.MetaArgs) { return workspaceMeta({ matches, location }, 'Fraud & Security', 'Review fraud-flagged transactions and submitted transaction dispute cases for the selected fictional NorthShield Bank customer.'); }
export default function FraudSecurityPage() { return <FraudSecurity />; }
