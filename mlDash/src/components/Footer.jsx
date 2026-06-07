import { Link } from 'react-router-dom';
import { Code2, Cpu, Database } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <Cpu className="text-accent" size={24} />
            <span>ElysiumSVD</span>
          </Link>
          <p>Advanced Matrix Factorization Recommender Dashboard</p>
        </div>
        
        <div className="footer-tech">
          <h4>Powered By</h4>
          <div className="tech-stack">
            <span className="tech-badge"><Code2 size={14} /> React + Vite</span>
            <span className="tech-badge"><Database size={14} /> FastAPI Backend</span>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ElysiumSVD. All rights reserved.</p>
        <div className="footer-links">
          <Link to="/docs">Documentation</Link>
          <Link to="/architecture">System Architecture</Link>
        </div>
      </div>
    </footer>
  );
}
