import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric except space & hyphen
    .replace(/\s+/g, "-")        // spaces → hyphens
    .replace(/-+/g, "-")         // collapse multiple hyphens
    .replace(/^-+|-+$/g, "");    // trim leading / trailing hyphens
}


export function formatDate(date:Date):string{

  return new Intl.DateTimeFormat('en-US',{
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}