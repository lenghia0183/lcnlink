export const isJson = (str: string): boolean => {
  try {
    JSON.parse(str);
  } catch (e) {
    return !e; // always false
  }
  return true;
};

export function generateRandomString(length: number): string {
  const characters: string =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  if (length <= 0) {
    throw new Error('Length must be greater than 0');
  }

  let result: string = '';
  for (let i = 0; i < length; i++) {
    const randomIndex: number = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

export function formatCurrency(input: number | string): string {
  if (
    input === null ||
    (typeof input !== 'number' && typeof input !== 'string')
  ) {
    return '';
  }

  const numberString = String(input).replace(/\D/g, '');

  if (numberString === '' || isNaN(Number(numberString))) {
    return '';
  }

  return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
