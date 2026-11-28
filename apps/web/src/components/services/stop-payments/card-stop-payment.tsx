interface CardStopPaymentProps {
  transactionName: string;
  setTransactionName: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
}

export function CardStopPayment({
  transactionName,
  setTransactionName,
  amount,
  setAmount
}: CardStopPaymentProps) {
  return (
    <div className="stop-payments-service-fields">
      <label>
        Transaction name
        <input
          value={transactionName}
          onChange={event => setTransactionName(event.target.value)}
        />
      </label>
      <label>
        Amount (card currency)
        <input
          type="number" min="0.01" step="0.01"
          value={amount}
          onChange={event => setAmount(event.target.value)}
        />
      </label>
      <p className="stop-payments-notice">
        This simulates a restriction on future online purchases for the card.
        Transaction details are for reference only. Already authorized payments
        require merchant cancellation or dispute review.
      </p>
    </div>
  );
}
