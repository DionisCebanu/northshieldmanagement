import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
	index('routes/home.tsx'),
	route('profile', 'routes/profile.tsx'),
	route('accounts', 'routes/accounts.tsx'),
	route('transfers', 'routes/transfers.tsx'),
	route('transactions', 'routes/transactions.tsx'),
	route('cards', 'routes/cards.tsx'),
	route('products', 'routes/products.tsx'),
	route('bill-payments', 'routes/bill-payments.tsx'),
	route('fraud-security', 'routes/fraud-security.tsx'),
	route(':section', 'routes/coming-soon.tsx'),
	route('*', 'routes/not-found.tsx'),

	route('sitemap.xml', 'routes/sitemap.xml.ts'),
	route('robots.txt', 'routes/robots.txt.ts'),
	route('api/health', 'routes/api.health.ts'),
	route('api/*', 'routes/api.$.ts'),
] satisfies RouteConfig;
