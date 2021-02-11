export function debounce<T extends Function>(fn: T, ms: number): T {
  let timeoutId: any;
  return (function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(fn.bind(this, ...args), ms);
  } as unknown) as T;
}
