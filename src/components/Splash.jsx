import { useEffect, useState } from 'react'
import Logo from './Logo'

// Welcome screen shown when the app opens. Edit the bottom text to show your organisation's name.
export default function Splash({ onDone }) {
  const [out, setOut] = useState(false)
  useEffect(() => {
    const a = setTimeout(() => setOut(true), 2000), b = setTimeout(onDone, 2500)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [onDone])
  return (
    <div className={'splash' + (out ? ' out' : '')} role="status" aria-label="Loading BloodLink Gambia">
      <Logo size={112} className="mark" />
      <div className="name">BloodLink Gambia</div>
      <div className="from">Connecting hospitals with volunteer donors<b>EVERY MINUTE MATTERS</b></div>
    </div>
  )
}
