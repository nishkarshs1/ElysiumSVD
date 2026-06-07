import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { BrainCircuit } from 'lucide-react';
import './InferenceLoader.css';

export default function InferenceLoader() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Sonar pulse rings
    gsap.fromTo('.sonar-ring', 
      { scale: 0.5, opacity: 1 },
      { scale: 4, opacity: 0, duration: 2, stagger: 0.6, repeat: -1, ease: 'power2.out' }
    );

    // Orbit rotations (different speeds and directions)
    gsap.to('.track-1', { rotation: 360, duration: 3, repeat: -1, ease: 'linear' });
    gsap.to('.track-2', { rotation: -360, duration: 5, repeat: -1, ease: 'linear' });
    gsap.to('.track-3', { rotation: 360, duration: 7, repeat: -1, ease: 'linear' });

    // Core pulsing effect
    gsap.to('.core-center', {
      scale: 1.1,
      boxShadow: '0 0 30px rgba(79, 70, 229, 0.4)',
      duration: 1,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    gsap.to('.core-icon', {
      opacity: 0.7,
      duration: 1,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }, []);

  return (
    <div className="modern-inference-wrapper" ref={containerRef}>
      <div className="synapse-core">
        <div className="sonar-ring ring-1"></div>
        <div className="sonar-ring ring-2"></div>
        <div className="sonar-ring ring-3"></div>
        
        <div className="orbit-track track-1"><div className="particle p-1"></div></div>
        <div className="orbit-track track-2"><div className="particle p-2"></div></div>
        <div className="orbit-track track-3"><div className="particle p-3"></div></div>

        <div className="core-center">
          <BrainCircuit className="core-icon text-accent" size={36} />
        </div>
      </div>
      
      <div className="loader-text-container">
        <div className="gradient-typing-text">Computing Latent Space Projections...</div>
      </div>
    </div>
  );
}
