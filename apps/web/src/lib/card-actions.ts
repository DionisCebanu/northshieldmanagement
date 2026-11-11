import type { CardStatus } from '@/lib/banking-types';

export type CardAction = { status: CardStatus; label: string; tone: 'primary' | 'secondary' | 'danger' };

// Freeze/Unfreeze are reversible. Lost, Stolen, Fraud and Closed block normal
// actions; once reported the only remaining action is to close the card.
export function availableActions(status: CardStatus): CardAction[] {
  switch (status) {
    case 'ACTIVE':
      return [
        { status: 'FROZEN', label: 'Freeze card', tone: 'secondary' },
        { status: 'LOST', label: 'Report lost', tone: 'danger' },
        { status: 'STOLEN', label: 'Report stolen', tone: 'danger' },
        { status: 'FRAUD', label: 'Report fraud', tone: 'danger' },
        { status: 'CLOSED', label: 'Close card', tone: 'danger' },
      ];
    case 'FROZEN':
      return [
        { status: 'ACTIVE', label: 'Unfreeze card', tone: 'primary' },
        { status: 'LOST', label: 'Report lost', tone: 'danger' },
        { status: 'STOLEN', label: 'Report stolen', tone: 'danger' },
        { status: 'FRAUD', label: 'Report fraud', tone: 'danger' },
        { status: 'CLOSED', label: 'Close card', tone: 'danger' },
      ];
    case 'LOST':
    case 'STOLEN':
    case 'FRAUD':
      return [{ status: 'CLOSED', label: 'Close card', tone: 'danger' }];
    case 'CLOSED':
      return [];
  }
}

export function actionDescription(status: CardStatus): string {
  switch (status) {
    case 'FROZEN': return 'Freezing this card will temporarily block all new transactions. The card can be unfrozen later.';
    case 'ACTIVE': return 'Unfreezing this card will restore normal transaction access.';
    case 'LOST': return 'Reporting this card as lost permanently blocks normal use. It cannot be reactivated.';
    case 'STOLEN': return 'Reporting this card as stolen permanently blocks normal use. It cannot be reactivated.';
    case 'FRAUD': return 'Reporting fraud permanently blocks normal use while the activity is investigated. It cannot be reactivated.';
    case 'CLOSED': return 'Closing this card is permanent. The card cannot be reactivated and the close date will be set to today.';
  }
}
