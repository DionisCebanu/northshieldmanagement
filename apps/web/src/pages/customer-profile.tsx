import { PageHeading } from '@/components/customer/page-heading';
import { CustomerHeader } from '@/components/customer/customer-header';
import { ProfileInformation } from '@/components/customer/profile-information';
import { CustomerNotes } from '@/components/customer/customer-notes';
import { WorkspaceState } from '@/components/customer/workspace-state';
export function CustomerProfile() {
  return <><PageHeading title="Customer Profile" description="Personal, contact and background information for the selected customer." /><WorkspaceState><CustomerHeader /><ProfileInformation /><CustomerNotes /></WorkspaceState></>;
}
