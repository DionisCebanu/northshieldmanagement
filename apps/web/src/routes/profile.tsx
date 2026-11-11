import type { Route } from './+types/profile';
import { workspaceMeta } from '@/lib/workspace-meta';
import { CustomerProfile } from '@/pages/customer-profile';
export function meta({ matches, location }: Route.MetaArgs) { return workspaceMeta({ matches, location }, 'Customer Profile', 'Read-only personal, address, contact, employment and student information for the selected fictional NorthShield Bank customer.'); }
export default function ProfilePage() { return <CustomerProfile />; }
