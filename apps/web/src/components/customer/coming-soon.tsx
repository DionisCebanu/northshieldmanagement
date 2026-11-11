import { Layers, ArrowLeft, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router';
import { PageHeading } from '@/components/customer/page-heading';
export function ComingSoon({ title }: { title: string }) {
  return <><PageHeading title={title} description="Part of your unified NorthShield employee workspace." /><section className="coming-soon panel"><span className="coming-soon-icon"><Layers size={32} /></span><span className="eyebrow">COMING SOON · WORKSPACE ROADMAP</span><h2>A foundation for what’s next.</h2><p>{title} will be available in a future phase. For now, explore the customer profile, accounts and transaction history.</p><div className="coming-soon-note"><LockKeyhole size={16} />No banking operations are enabled in this demo.</div><Link to="/" className="button-primary"><ArrowLeft size={16} />Back to Customer Overview</Link></section></>;
}
