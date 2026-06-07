import { useEffect, useState, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { Sun, Moon } from 'lucide-react'
import BackendStatus from './components/BackendStatus'
import Footer from './components/Footer'
import Dashboard from './components/Dashboard'
import Architecture from './pages/Architecture'
import Documentation from './pages/Documentation'
import Simulation from './pages/Simulation'
import Maths from './pages/Maths'
import Metrics from './pages/Metrics'
import './App.css'

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageLayout({ children }) {
  const appRef = useRef(null);
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    // Cinematic page load on layout mount
    const tl = gsap.timeline();
    
    tl.fromTo('.app-header h1', 
      { opacity: 0, y: -20, filter: 'blur(10px)' }, 
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' }
    )
    .fromTo('.app-header .subtitle', 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.6 },
      '-=0.4'
    )
    .fromTo('.main-content',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.2'
    );
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDark]);

  return (
    <div className="app-container" ref={appRef}>
      <BackendStatus />
      
      {/* Persistent Top Navbar */}
      <nav className="top-navbar glass-panel">
        <Link to="/" className="nav-brand">
          <h1>ElysiumSVD</h1>
        </Link>
        <div className="nav-links">
          <Link to="/">Inference Hub</Link>
          <Link to="/maths">SVD Maths</Link>
          <Link to="/architecture">Architecture</Link>
          <Link to="/docs">Docs</Link>
          <Link to="/simulation">Simulation</Link>
          <Link to="/metrics">Metrics</Link>
          
          <button 
            onClick={() => setIsDark(!isDark)} 
            className="theme-toggle"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>
      
      <main className="main-content">
        {children}
      </main>
      
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <PageLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/maths" element={<Maths />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/metrics" element={<Metrics />} />
        </Routes>
      </PageLayout>
    </Router>
  )
}

export default App
