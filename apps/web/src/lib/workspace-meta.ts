import { seo } from '@/lib/seo';
type SeoContext = Parameters<typeof seo>[0];
export function workspaceMeta(context: SeoContext, title: string, description: string) {
  return seo(context, { title: `${title} | NorthShield`, description, image: 'https://images.hostinger.com/afff0461-e1b9-4735-ad44-65a8c1a58716/e2593db1-1397-442a-8890-8c64577877c7.png', noindex: true });
}
