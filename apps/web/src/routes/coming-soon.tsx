import type { Route } from './+types/coming-soon';
import { workspaceMeta } from '@/lib/workspace-meta';
import { ComingSoon } from '@/components/customer/coming-soon';
import { navigationItems } from '@/data/navigation';
export function loader({ params }: Route.LoaderArgs) {
  const item = navigationItems.find(entry => entry.path === `/${params.section}` && !['/', '/profile', '/accounts', '/transfers', '/transactions', '/cards', '/products', '/bill-payments', '/fraud-security'].includes(entry.path));
  if (!item) throw new Response('Page not found', { status: 404 });
  return { title: item.label };
}
export function meta({ matches, location, loaderData }: Route.MetaArgs) { return workspaceMeta({ matches, location }, loaderData?.title ?? 'Workspace', 'Explore what is coming next to the fictional NorthShield employee workspace. Banking operations are not enabled in this read-only demonstration.'); }
export default function PlaceholderPage({ loaderData }: Route.ComponentProps) { return <ComingSoon title={loaderData.title} />; }
