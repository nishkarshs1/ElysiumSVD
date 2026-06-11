import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Layers, BrainCircuit, Sparkles } from 'lucide-react';
import './HeroSection.css';

export default function HeroSection() {
  const heroRef = useRef(null);

  useEffect(() => {
    if (heroRef.current) {
      const elements = heroRef.current.children;
      gsap.fromTo(elements, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div className="hero-section" ref={heroRef}>
      <div className="hero-card glass-panel">
        <BrainCircuit className="text-accent hero-icon" size={40} />
        <h3>SVD Matrix Projection</h3>
        <p>Our backend uses Singular Value Decomposition (SVD) to project 6,040 users and 3,706 movies into a shared latent space, predicting preferences with high accuracy.</p>
      </div>

      <div className="hero-card glass-panel">
        <Layers className="text-accent hero-icon" size={40} />
        <h3>Cold Start Fallbacks</h3>
        <p>New users automatically receive popularity-based fallback recommendations until sufficient interaction data is gathered for the matrix.</p>
      </div>

      <div className="hero-card glass-panel">
        <Sparkles className="text-accent hero-icon" size={40} />
        <h3>Real-time Inference</h3>
        <p>Vectors are computed and stored efficiently, allowing for sub-millisecond retrieval of similar movies using cosine similarity math.</p>
      </div>
    </div>
  );
}
