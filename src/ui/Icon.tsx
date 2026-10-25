const paths = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  tasks: 'm3 6 2 2 4-4 M12 6h9 M3 13l2 2 4-4 M12 13h9 M3 20h6 M12 20h9',
  folder: 'M3 6h7l2 2h9v12H3z',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  plus: 'M12 4v16 M4 12h16',
  close: 'm6 6 12 12 M6 18 18 6',
  bell: 'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z M10 21h4',
  search: 'M16 16l5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  check: 'm5 12 4 4L19 6',
  bolt: 'm13 2-9 12h7l-1 8 10-13h-7z',
  leaf: 'M20 4C9 3 3 9 5 19c10 2 16-4 15-15z M5 19l9-9',
  lock: 'M6 10h12v11H6z M8 10V6a4 4 0 0 1 8 0v4',
  warning: 'm12 3 10 18H2z M12 9v5 M12 17v1',
  trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
} as const
export type IconName = keyof typeof paths

export function Icon({ name }: { name: IconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
