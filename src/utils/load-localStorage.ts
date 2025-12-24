export function loadFromLocalStorage(key: string) {
  const dataString = localStorage.getItem(key);
  if (!dataString) return null;

  const data = JSON.parse(dataString);
  if (new Date().getTime() > data.expiry) {
    localStorage.removeItem(key);
    return null;
  }

  return data.value;
}
