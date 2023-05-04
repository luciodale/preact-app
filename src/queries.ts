export function fetchData() {
  return fetch('/api/data').then((res) => res.json())
}
