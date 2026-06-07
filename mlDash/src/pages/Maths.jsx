import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Sigma, Binary, Network, BookOpen, Calculator, LineChart } from 'lucide-react';
import './Pages.css';

export default function Maths() {
  const pageRef = useRef(null);

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current.children, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div className="page-container" ref={pageRef}>
      <div className="page-header">
        <h2>The Mathematics of SVD</h2>
        <p>A technical deep-dive into Singular Value Decomposition and its training process.</p>
      </div>

      {/* 1. The Problem */}
      <div className="math-section glass-panel">
        <div className="math-header">
          <BookOpen className="text-accent" size={24} />
          <h3>1. The Problem: The Sparse Interaction Matrix</h3>
        </div>
        <p className="math-desc">
          In recommender systems, we start with a User-Item interaction matrix <i>R</i> of size <i>m × n</i>, where <i>m</i> is the number of users and <i>n</i> is the number of products.
        </p>
        <p className="math-desc mt-2">
          Because most users only interact with a tiny fraction of the total catalog, this matrix is highly <strong>sparse</strong> (often &gt;99% empty). It is computationally expensive to process directly and difficult to find patterns in.
        </p>
      </div>

      {/* 2. The Solution */}
      <div className="math-section glass-panel">
        <div className="math-header">
          <Sigma className="text-accent" size={24} />
          <h3>2. The Solution: Singular Value Decomposition</h3>
        </div>
        <p className="math-desc">
          SVD is a linear algebra technique that factors the large, sparse matrix <i>R</i> into three smaller, dense matrices. This reduces dimensionality and isolates the underlying "latent factors" driving user behavior.
        </p>
        
        <div className="formula-box" style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <img src="https://latex.codecogs.com/svg.image?\LARGE&space;R\approx&space;U\Sigma&space;V^T" alt="SVD Decomposition Formula" />
        </div>

        <ul className="math-list mt-4">
          <li><strong><i>U</i> (User Features):</strong> Maps users into a <i>k</i>-dimensional latent space.</li>
          <li><strong><i>Σ</i> (Singular Values):</strong> A diagonal matrix showing the "weight" or importance of each latent concept.</li>
          <li><strong><i>V<sup>T</sup></i> (Item Features):</strong> Maps items into the <em>exact same</em> <i>k</i>-dimensional latent space.</li>
        </ul>
      </div>

      {/* 3. Intuition */}
      <div className="math-section glass-panel">
        <div className="math-header">
          <Binary className="text-accent" size={24} />
          <h3>3. Intuition: What are "Latent Factors"?</h3>
        </div>
        <p className="math-desc">
          The number <i>k</i> represents hidden (latent) features. In movies, these might mathematically align with concepts like <em>"Action-packed"</em>, <em>"Romance"</em>, or <em>"CGI-heavy"</em>. 
        </p>
        <p className="math-desc mt-2">
          The algorithm discovers these traits completely automatically. If User A's vector in <i>U</i> has a high value in dimension 1, and Item B's vector in <i>V<sup>T</sup></i> also has a high value in dimension 1, their dot product will be large, resulting in a strong recommendation!
        </p>
      </div>

      {/* 4. Similarity */}
      <div className="math-section glass-panel">
        <div className="math-header">
          <Calculator className="text-accent" size={24} />
          <h3>4. Calculating Similarity</h3>
        </div>
        <p className="math-desc">
          Because items are now dense vectors in the <i>k</i>-dimensional matrix <i>V<sup>T</sup></i>, we can find "Similar Items" simply by measuring the geometric distance between their vectors.
        </p>
        <p className="math-desc mt-2">
          ElysiumSVD uses <strong>Cosine Similarity</strong>, which measures the cosine of the angle <i>θ</i> between two item vectors <b>A</b> and <b>B</b>:
        </p>
        <div className="formula-box" style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <img src="https://latex.codecogs.com/svg.image?\LARGE&space;\text{similarity}=\cos(\theta)=\frac{\vec{A}\cdot\vec{B}}{\|\vec{A}\|\|\vec{B}\|}" alt="Cosine Similarity Formula" />
        </div>
        <p className="math-desc mt-2">
          A cosine similarity approaching 1.0 means the items are nearly identical in the latent space, appealing to the exact same demographic of users.
        </p>
      </div>

      {/* 5. The Training Process */}
      <div className="math-section glass-panel">
        <div className="math-header">
          <LineChart className="text-accent" size={24} />
          <h3>5. The Training Process (SGD)</h3>
        </div>
        <p className="math-desc">
          How do we find the matrices <i>U</i> and <i>V</i>? We train them using <strong>Stochastic Gradient Descent (SGD)</strong>! The goal is to minimize the error between our model's predictions and the actual user ratings.
        </p>
        
        <h4 className="mt-4 mb-2">Step 1: Calculate the Error</h4>
        <p className="math-desc">We predict a rating by taking the dot product of a user vector and an item vector. The error is the actual rating minus our prediction:</p>
        <div className="formula-box" style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
          <img src="https://latex.codecogs.com/svg.image?\LARGE&space;e_{ui}=r_{ui}-\vec{u_i}\cdot\vec{v_j}" alt="Error Calculation Formula" />
        </div>

        <h4 className="mt-4 mb-2">Step 2: Update the Weights</h4>
        <p className="math-desc">We nudge the vectors in the opposite direction of the gradient to reduce the error. We also use a regularization term (<i>λ</i>) to prevent overfitting, and a learning rate (<i>α</i>) to control step size:</p>
        <div className="formula-box" style={{ display: 'flex', justifyContent: 'center', padding: '16px', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <img src="https://latex.codecogs.com/svg.image?\LARGE&space;\vec{u_i}\leftarrow\vec{u_i}&plus;\alpha(e_{ui}\vec{v_j}-\lambda\vec{u_i})" alt="User Vector Update Rule" />
          <img src="https://latex.codecogs.com/svg.image?\LARGE&space;\vec{v_j}\leftarrow\vec{v_j}&plus;\alpha(e_{ui}\vec{u_i}-\lambda\vec{v_j})" alt="Item Vector Update Rule" />
        </div>
        
        <p className="math-desc mt-4">
          By repeating this process over millions of interactions (Epochs), the matrices gradually lock into their optimal configuration! (Check out the <strong>Simulation</strong> page to see this live).
        </p>
      </div>
    </div>
  );
}
