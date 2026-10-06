import { HOS, CARRIERS } from './config'
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const cleanPh = p => p.replace(/[\s-]/g, '')
export const phoneOk = p => /^\d{9}$/.test(p) && !!CARRIERS[p.slice(0,2)]
export const carrier = p => { p = cleanPh(p); return p.length < 2 ? '' : CARRIERS[p.slice(0,2)] ? CARRIERS[p.slice(0,2)] + (phoneOk(p) ? ' number' : ' (needs 9 digits)') : 'Prefix must be 87, 83 or 86' }
export const mask = (ch, t) => ch === 'email' ? t.replace(/^(.).*(@.*)$/, '$1***$2') : t.slice(0,2) + '*****' + t.slice(-2)
export const fmt = iso => new Date(iso).toLocaleString([], { dateStyle:'medium', timeStyle:'short' })
export const hosp = id => HOS.find(h => h.id === id)
