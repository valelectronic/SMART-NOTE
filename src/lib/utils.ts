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


export function getPublicIdFromUrl(url: string) {
  try {
    const withoutQuery = url.split("?")[0];
    const parts = withoutQuery.split("/");
    const uploadIndex = parts.indexOf("upload");

    if (uploadIndex === -1) return null;

    const publicIdWithExt = parts.slice(uploadIndex + 1).join("/");
    
    // 💡 FIX: Strip the file extension for a clean public ID
    // This assumes your database stores the public ID without the extension.
    return publicIdWithExt.replace(/\.[^/.]+$/, ""); 
  } catch {
    return null;
  }
}

