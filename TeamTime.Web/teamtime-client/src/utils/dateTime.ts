export function toLocalDateTimeInput(utcValue: string): string {
  const date = new Date(utcValue);

  if (!Number.isFinite(date.getTime())) {
    throw new Error("The saved date and time are invalid.");
  }

  const localTime = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localTime.toISOString().slice(0, 23);
}
