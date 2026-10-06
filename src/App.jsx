import { useEffect, useState } from 'react'
import { HashRouter, MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore, useToast, user, logout } from './lib/store'
import { Login, Signup, Verify } from './pages/Auth'
import Hospital from './pages/Hospital'
import Donor from './pages/Donor'
import Logo from './components/Logo'
import Splash from './components/Splash'

function Toast() {
  const t = useToast(), [on, setOn] = useState(false)
  useEffect(() => { if (!t.msg) return; setOn(true); const x = setTimeout(() => setOn(false), 2600); return () => clearTimeout(x) }, [t])
  return <div id="toast" className={on ? 'on' : ''} role="status">{t.msg}</div>
}
const Router = import.meta.env.VITE_MEMORY ? MemoryRouter : HashRouter // HashRouter works on any static host
const Home = () => { const u = user(); return <Navigate to={!u ? '/login' : u.role === 'hospital' ? '/hospital' : '/donor'} replace /> }
const Guard = ({ role, children }) => user()?.role === role ? children : <Navigate to="/" replace />

export default function App() {
  useStore(); const u = user(), [splash, setSplash] = useState(true)
  return (
    <Router>
      <header><div className="wrap bar">
        <h1><Logo size={28} />Blood<span>Link</span> Gambia</h1>
        <div className="row">{u && <><span className="mut">{u.name}</span><button className="btn alt sm" onClick={logout}>Log out</button></>}</div>
      </div></header>
      <main className="wrap">
        <div className="notice">Prototype: accounts and data are stored only in this browser. This platform supports donor coordination only. Eligibility and medical suitability are determined by qualified healthcare professionals.</div>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/hospital" element={<Guard role="hospital"><Hospital /></Guard>} />
          <Route path="/donor" element={<Guard role="donor"><Donor /></Guard>} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <footer className="wrap">Matching score is a donor-contact prioritization score, not a medical eligibility score.</footer>
      <Toast />
      {splash && <Splash onDone={() => setSplash(false)} />}
    </Router>
  )
}
