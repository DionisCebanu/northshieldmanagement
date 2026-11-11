import { SearchX, LoaderCircle, AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useClient } from '@/contexts/client-context';
import { clientProfile } from '@/config/client-profile';
export function WorkspaceState({ children }: { children: ReactNode }) {
  const { workspace, loading, error, selectClient } = useClient();
  if (loading) return <section className="empty-state" role="status"><LoaderCircle className="animate-spin" size={32} /><h2>Loading customer workspace</h2><p>Retrieving the profile, accounts and transactions.</p></section>;
  if (error) return <section className="empty-state" role="alert"><AlertCircle size={32} /><h2>Unable to load customer</h2><p>{error}</p><button className="button-primary" onClick={() => void selectClient(clientProfile.clientId)}>Try again</button></section>;
  if (!workspace) return <section className="empty-state"><SearchX size={36} /><h2>Customer not found</h2><p>No customer matches the configured ID. Update clientId in src/config/client-profile.ts to an existing customer ID.</p></section>;
  return children;
}
