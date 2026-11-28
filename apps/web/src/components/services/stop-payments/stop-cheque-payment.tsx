interface StopChequePaymentProps {
  payee: string;
  setPayee: (value: string) => void;
  chequeNumber: string;
  setChequeNumber: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  paymentDate: string;
  setPaymentDate: (value: string) => void;
}

export function StopChequePayment({
  payee,
  setPayee,
  chequeNumber,
  setChequeNumber,
  amount,
  setAmount,
  paymentDate,
  setPaymentDate
}: StopChequePaymentProps) {
  return (
    <div className="stop-payments-service-fields">
      <label>
        Payee
        <input
          value={payee}
          onChange={event => setPayee(event.target.value)}
        />
      </label>
      <label>
        Cheque number
        <input
          inputMode="numeric"
          value={chequeNumber}
          onChange={event => setChequeNumber(event.target.value)}
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
    </div>
  );
}
