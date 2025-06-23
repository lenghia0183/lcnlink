export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const delayRandom = (min: number, max: number) =>
  delay(Math.floor(Math.random() * (max - min + 1)) + min);

export const promiseHelper = {
  delay,
  delayRandom,
};
