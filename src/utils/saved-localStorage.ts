import { getMillisecondsUntilMidnight } from './get-midnight';

export function saveToLocalStorage(key: string, value: number) {
  const expiresIn = getMillisecondsUntilMidnight();
  const data = {
    value,
    expiry: new Date().getTime() + expiresIn,
  };
  localStorage.setItem(key, JSON.stringify(data));
}
