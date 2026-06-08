export function calculateOverdueDays(expectedReturnDate: Date, actualReturnDate: Date | null): number {
  const now = actualReturnDate || new Date();
  const expected = new Date(expectedReturnDate);
  const diffTime = now.getTime() - expected.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function isOverdue(expectedReturnDate: Date, actualReturnDate: Date | null): boolean {
  if (actualReturnDate) return false;
  return calculateOverdueDays(expectedReturnDate, null) > 0;
}

export const OVERDUE_THRESHOLD_DAYS = 3;

export function shouldTriggerCleanup(expectedReturnDate: Date, actualReturnDate: Date | null): boolean {
  return calculateOverdueDays(expectedReturnDate, actualReturnDate) > OVERDUE_THRESHOLD_DAYS;
}
