export const getValueOrDefault = <T>(value: any, defaultValue: T): T => {
  return value !== null && value !== undefined ? (value as T) : defaultValue;
};
