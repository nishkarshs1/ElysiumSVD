import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Database, Network, Cpu, ShieldCheck } from 'lucide-react';
import './Pages.css';

export default function Architecture() {
  const pageRef = useRef(null);

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current.children, 
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div className="page-container" ref={pageRef}>
      <div className="page-header">
        <h2>System Architecture</h2>
        <p>A deep dive into the Matrix Factorization pipeline powering 6,040 users and 3,706 movies.</p>
      </div>

      <div className="arch-grid">
        <div className="arch-card glass-panel">
          <Database className="text-accent arch-icon" size={32} />
          <h3>1. Data Processing (Python)</h3>
          <p>User-movie interaction data from the MovieLens 1M dataset is ingested and normalized. The system pivots this data into a highly sparse Coordinate Format (COO/CSR) matrix using <code>scipy.sparse</code>, preparing it for decomposition.</p>
        </div>

        <div className="arch-card glass-panel">
          <Cpu className="text-accent arch-icon" size={32} />
          <h3>2. SVD Training</h3>
          <p>Using <code>scipy.sparse.linalg.svds</code>, the system performs Truncated Singular Value Decomposition (SVD), decomposing the massive sparse matrix into three dense, low-rank matrices (U, Sigma, and V-transpose) to isolate k=50 latent factors.</p>
        </div>

        <div className="arch-card glass-panel">
          <Network className="text-accent arch-icon" size={32} />
          <h3>3. Model Serialization</h3>
          <p>The resulting matrices and datasets are serialized using <code>joblib</code> and saved as <code>.pkl</code> (Pickle) files, allowing the API server to load the pre-computed "brain" into memory instantly without retraining.</p>
        </div>

        <div className="arch-card glass-panel">
          <ShieldCheck className="text-accent arch-icon" size={32} />
          <h3>4. Fast API Serving</h3>
          <p>The pre-computed matrices are loaded into memory by a <code>FastAPI</code> Python backend. The system calculates Cosine Similarity on the fly using high-performance <code>numpy.dot</code> operations, enabling sub-millisecond recommendation generation.</p>
        </div>
      </div>
    </div>
  );
}
