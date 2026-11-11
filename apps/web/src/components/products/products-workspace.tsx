import { useState } from 'react';
import { CreditCard, Wallet, PiggyBank, Landmark, Banknote, ArrowRight, Layers } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import accountTypes from '@/data/accountTypes.json';
import creditCardProducts from '@/data/creditcards.json';
import debitCardProducts from '@/data/debitcards.json';
import { money, humanize } from '@/lib/banking-format';
import type { AccountType, LendingCategory } from '@/lib/banking-types';
import { DebitCardIssuance } from '@/components/products/debit-card-issuance';
import { CreditCardIssuance } from '@/components/products/credit-card-issuance';
import { AccountOpening } from '@/components/products/account-opening';
import { LendingApplication } from '@/components/products/lending-application';

type Selection =
  | { kind: 'debit'; productId: number }
  | { kind: 'credit'; productId: number }
  | { kind: 'account'; productTypeId: number }
  | { kind: 'lending'; productType: LendingCategory };

type ProductCategory = {
  key: string;
  label: string;
  icon: typeof Wallet;
  description: string;
  items: { id: number; name: string; meta: string; action: string; select: Selection }[];
};

export function ProductsWorkspace() {
  const { workspace } = useClient();
  const [selection, setSelection] = useState<Selection | null>(null);

  if (!workspace) return null;

  const types = accountTypes as unknown as AccountType[];
  const chequing = types.filter(t => t.category === 'CHEQUING');
  const savings = types.filter(t => t.category === 'SAVINGS');
  const registered = types.filter(t => t.category === 'REGISTERED');
  const gic = types.filter(t => t.category === 'INVESTMENT');
  const loans = types.filter(t => t.category === 'PERSONAL_LOAN');
  const loc = types.filter(t => t.category === 'LINE_OF_CREDIT');

  const categories: ProductCategory[] = [
    {
      key: 'debit', label: 'Debit cards', icon: CreditCard, description: 'Everyday debit cards linked to chequing or savings accounts.',
      items: debitCardProducts.map(p => ({ id: p.id, name: p.name, meta: `${p.currency} · No annual fee`, action: 'Issue', select: { kind: 'debit', productId: p.id } })),
    },
    {
      key: 'credit', label: 'Credit cards', icon: CreditCard, description: 'Rewards, travel and premium credit cards.',
      items: creditCardProducts.map(p => ({ id: p.id, name: p.name, meta: `${money(p.annualFee, p.currency)}/yr · ${p.rewardType}`, action: 'Apply', select: { kind: 'credit', productId: p.id } })),
    },
    {
      key: 'chequing', label: 'Chequing accounts', icon: Wallet, description: 'Everyday banking with monthly transaction packages.',
      items: chequing.map(t => ({ id: t.id, name: t.name, meta: `${money(t.monthlyFee, t.currency)}/mo`, action: 'Open', select: { kind: 'account', productTypeId: t.id } })),
    },
    {
      key: 'savings', label: 'Savings accounts', icon: PiggyBank, description: 'Variable and tiered interest savings.',
      items: savings.map(t => ({ id: t.id, name: t.name, meta: `${money(t.monthlyFee, t.currency)}/mo`, action: 'Open', select: { kind: 'account', productTypeId: t.id } })),
    },
    {
      key: 'registered', label: 'Registered products', icon: Landmark, description: 'TFSA, FHSA, RRSP, GIC and LIF registered products.',
      items: [...registered, ...gic].map(t => ({ id: t.id, name: t.name, meta: humanize(t.category), action: t.category === 'INVESTMENT' ? 'Open' : 'Open', select: { kind: 'account', productTypeId: t.id } })),
    },
    {
      key: 'loans', label: 'Personal loans', icon: Banknote, description: 'Fixed-term personal loans with scheduled repayments.',
      items: loans.map(t => ({ id: t.id, name: t.name, meta: humanize(t.category), action: 'Apply', select: { kind: 'lending', productType: 'PERSONAL_LOAN' } })),
    },
    {
      key: 'loc', label: 'Lines of credit', icon: Banknote, description: 'Revolving credit lines with flexible repayment.',
      items: loc.map(t => ({ id: t.id, name: t.name, meta: humanize(t.category), action: 'Apply', select: { kind: 'lending', productType: 'LINE_OF_CREDIT' } })),
    },
  ];

  if (selection?.kind === 'debit') return <DebitCardIssuance onDone={() => setSelection(null)} />;
  if (selection?.kind === 'credit') return <CreditCardIssuance onDone={() => setSelection(null)} />;
  if (selection?.kind === 'account') return <AccountOpening productTypeId={selection.productTypeId} onDone={() => setSelection(null)} />;
  if (selection?.kind === 'lending') return <LendingApplication productType={selection.productType} onDone={() => setSelection(null)} />;

  return (
    <div className="products-workspace">
      {categories.map(category => {
        const Icon = category.icon;
        return (
          <section key={category.key} className="panel product-category-panel">
            <div className="panel-heading product-category-heading">
              <h2><Icon size={18} />{category.label}</h2>
              <p>{category.description}</p>
            </div>
            <div className="product-tile-grid">
              {category.items.map(item => (
                <div key={`${category.key}-${item.id}`} className="product-tile">
                  <div className="product-tile-top"><span className="product-tile-icon"><Icon size={18} /></span><span className="product-tile-meta">{item.meta}</span></div>
                  <h3>{item.name}</h3>
                  <button className="button-primary product-tile-action" type="button" onClick={() => setSelection(item.select)}>{item.action} <ArrowRight size={14} /></button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      <p className="transfer-note"><Layers size={14} /> All issuance is simulated. New cards and accounts are saved locally and appear immediately on the relevant workspace pages.</p>
    </div>
  );
}
