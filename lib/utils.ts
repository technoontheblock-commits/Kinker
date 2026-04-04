import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInSeconds = Math.floor(diffInMs / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInSeconds < 60) {
    return 'gerade eben'
  } else if (diffInMinutes < 60) {
    return `vor ${diffInMinutes} Minute${diffInMinutes > 1 ? 'n' : ''}`
  } else if (diffInHours < 24) {
    return `vor ${diffInHours} Stunde${diffInHours > 1 ? 'n' : ''}`
  } else if (diffInDays < 30) {
    return `vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`
  } else {
    return new Intl.DateTimeFormat('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }
}
