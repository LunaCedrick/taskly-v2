import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import styles from './Controls.module.css'

export function Button({ children, secondary = false, ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
  return <button type="button" className={secondary ? styles.secondary : styles.button} {...props}>{children}</button>
}

export function IconButton({ icon, label, ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return <button type="button" className={styles.iconButton} aria-label={label} {...props}><Icon name={icon} /></button>
}

export function Chip({ children, colorIndex }: { children: ReactNode; colorIndex?: number }) {
  return <span className={styles.chip} data-color={colorIndex}>
    {colorIndex !== undefined && <span className={styles.dot} />}{children}</span>
}

export function Pill({ children, tone = 'none' }: { children: ReactNode; tone?: string }) {
  return <span className={styles.pill} data-tone={tone}>{children}</span>
}

export function StatCard({ label, value, note, overdue = false }:
  { label: string; value: number; note: string; overdue?: boolean }) {
  return <div className={styles.stat}><span>{label}</span><strong data-overdue={overdue}>{value}</strong><small>{note}</small></div>
}

export function Skeleton() {
  return <div className={styles.skeleton} role="status"><span className="sr-only">Loading tasks</span></div>
}
