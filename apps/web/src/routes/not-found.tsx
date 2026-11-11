import type { Route } from './+types/not-found';
import { Link } from 'react-router';
import { workspaceMeta } from '@/lib/workspace-meta';
export function meta({ matches, location }: Route.MetaArgs) { return workspaceMeta({ matches, location }, 'Page Not Found', 'This workspace page is unavailable. Return to the NorthShield Customer Overview to explore the demonstration customer information.'); }
export default function NotFoundPage() { return <section className="empty-state"><h1>Page not found</h1><p>This page is not part of the workspace.</p><Link to="/" className="button-primary">Back to overview</Link></section>; }
