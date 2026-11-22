import type { Route } from './+types/services';
import { workspaceMeta } from '@/lib/workspace-meta';
import { ServiceCentre } from '@/pages/service-centre';
export function meta({ matches, location }: Route.MetaArgs) { return workspaceMeta({ matches, location }, 'Service Centre', 'Browse fictional customer banking services.'); }
export default function ServicesPage() { return <ServiceCentre />; }
