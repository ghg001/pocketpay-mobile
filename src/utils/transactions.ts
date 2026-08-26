import { TransactionRecord } from '../store/walletStore';

export interface TransactionDateGroup {
  title: string;
  data: TransactionRecord[];
}

const getTimestamp = (value?: string | null): number => {
  if (!value) return Number.NaN;

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
};

const formatDateLabel = (value?: string | null): string => {
  if (!value) return 'Unknown date';

  const timestamp = getTimestamp(value);
  if (Number.isNaN(timestamp)) return 'Unknown date';

  const parsedDate = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const normalizedDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());

  if (normalizedDate.getTime() === today.getTime()) return 'Today';
  if (normalizedDate.getTime() === yesterday.getTime()) return 'Yesterday';

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const groupTransactionsByDate = (transactions: TransactionRecord[]): TransactionDateGroup[] => {
  const sortedTransactions = [...transactions].sort((left, right) => {
    const leftTime = getTimestamp(left.created_at);
    const rightTime = getTimestamp(right.created_at);

    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
    if (Number.isNaN(leftTime)) return 1;
    if (Number.isNaN(rightTime)) return -1;

    return rightTime - leftTime;
  });

  return sortedTransactions.reduce<TransactionDateGroup[]>((groups, transaction) => {
    const title = formatDateLabel(transaction.created_at);
    const existingGroup = groups.find((group) => group.title === title);

    if (existingGroup) {
      existingGroup.data.push(transaction);
      return groups;
    }

    groups.push({ title, data: [transaction] });
    return groups;
  }, []);
};
