import { useState } from 'react';
import { useClient } from '@/contexts/client-context';
import { TransferForm } from '@/components/transfers/transfer-form';
import { TransferConfirm } from '@/components/transfers/transfer-confirm';
import { TransferResultView } from '@/components/transfers/transfer-result';
import { validateTransfer, applyTransfer, type TransferResult } from '@/services/transferService';

type Step = 'form' | 'confirm' | 'result';

export function TransferWorkspace() {
  const { workspace } = useClient();
  const [fromId, setFromId] = useState<number | null>(null);
  const [toId, setToId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransferResult | null>(null);

  if (!workspace) return null;
  const activeAccounts = workspace.accounts.filter(account => account.status === 'ACTIVE');
  const fromAccount = activeAccounts.find(account => account.id === fromId) ?? null;
  const toAccount = activeAccounts.find(account => account.id === toId) ?? null;

  function handleContinue() {
    setError(null);
    if (!fromAccount || !toAccount) {
      setError('Select both a source and destination account.');
      return;
    }
    const validation = validateTransfer({ from: fromAccount, to: toAccount, amount: Number(amount) });
    if (validation) {
      setError(validation);
      return;
    }
    setStep('confirm');
  }

  function handleConfirm() {
    if (!fromAccount || !toAccount) return;
    try {
      setResult(applyTransfer({ from: fromAccount, to: toAccount, amount: Number(amount), description }));
      setStep('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transfer could not be completed.');
    }
  }

  function reset() {
    setFromId(null);
    setToId(null);
    setAmount('');
    setDescription('');
    setError(null);
    setResult(null);
    setStep('form');
  }

  if (step === 'confirm' && fromAccount && toAccount) {
    return <TransferConfirm from={fromAccount} to={toAccount} amount={Number(amount)} description={description} onConfirm={handleConfirm} onBack={() => setStep('form')} />;
  }
  if (step === 'result' && fromAccount && toAccount && result) {
    return <TransferResultView from={fromAccount} to={toAccount} amount={Number(amount)} result={result} onReset={reset} />;
  }
  return (
    <TransferForm
      accounts={activeAccounts}
      fromId={fromId}
      toId={toId}
      amount={amount}
      description={description}
      error={error}
      onFromChange={id => { setFromId(id); setToId(null); setError(null); }}
      onToChange={id => { setToId(id); setError(null); }}
      onAmountChange={value => { setAmount(value); setError(null); }}
      onDescriptionChange={setDescription}
      onContinue={handleContinue}
    />
  );
}
