import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | number, formatStr = 'yyyy-MM-dd HH:mm'): string {
  if (!date) return '-'
  try {
    return format(new Date(date), formatStr, { locale: zhCN })
  } catch {
    return '-'
  }
}

export function formatRelativeDate(date: string | Date | number): string {
  if (!date) return '-'
  try {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return format(d, 'yyyy-MM-dd', { locale: zhCN })
  } catch {
    return '-'
  }
}

export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (Number.isNaN(n)) return '0'
  return new Intl.NumberFormat('zh-CN').format(n)
}

export function truncate(str: string, length: number): string {
  if (!str) return ''
  return str.length > length ? `${str.slice(0, length)}...` : str
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}
