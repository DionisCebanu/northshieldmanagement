interface PadStopPaymentProps {
  payee: string;
  setPayee: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  paymentDate: string;
  setPaymentDate: (value: string) => void;
  recurring: boolean;
  setRecurring: (value: boolean) => void;
}

export function PadStopPayment({
  payee,
  setPayee,
  amount,
  setAmount,
  paymentDate,
  setPaymentDate,
  recurring,
  setRecurring
}: PadStopPaymentProps) {
  return (
    <div className="stop-payments-service-fields">
      <label>
        Merchant / payee
        <input
          value={payee}
          onChange={event => setPayee(event.target.value)}
        />
      </label>
      <label>
        Amount (account currency)
        <input
          type="number" min="0.01" step="0.01"
          value={amount}
          onChange={event => setAmount(event.target.value)}
        />
      </label>
      <label>
        Expected payment date
        <input
          type="date"
          value={paymentDate}
          onChange={event => setPaymentDate(event.target.value)}
        />
      </label>
      <label className="stop-payments-checkbox">
        <input
          type="checkbox"
          checked={recurring}
          onChange={event => setRecurring(event.target.checked)}
        />
        Recurring payment
      </label>
    </div>
  );
}
