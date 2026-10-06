export default function Logo({ size = 32, ...p }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="BloodLink Gambia logo" {...p}>
      <path d="M32 4C32 4 12 26 12 40a20 20 0 0 0 40 0C52 26 32 4 32 4Z" fill="#C8102E" />
      <g fill="none" stroke="#fff" strokeWidth="4"><circle cx="26" cy="41" r="7.5" /><circle cx="38" cy="41" r="7.5" /></g>
    </svg>
  )
}
