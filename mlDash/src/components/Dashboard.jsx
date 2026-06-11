import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import { Search, Loader2 } from 'lucide-react';
import ProductList from './ProductList';
import LatentSpaceMap from './LatentSpaceMap';
import HeroSection from './HeroSection';
import InferenceLoader from './InferenceLoader';
import './Dashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Dashboard() {
  const [userId, setUserId] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState(null);
  const [searchedNode, setSearchedNode] = useState(null);

  const containerRef = useRef(null);

  const fetchRecommendations = async (e, forcedId = null) => {
    if (e) e.preventDefault();
    const idToSearch = forcedId || userId;
    if (!idToSearch) return;

    setLoading(true);
    setError('');
    setRecommendations(null);
    setSearchedNode(parseInt(idToSearch));

    try {
      const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
      const apiCall = axios.get(`${API_BASE_URL}/recommend/${idToSearch}?n=5`);
      
      const [response] = await Promise.all([apiCall, minDelay]);
      setRecommendations(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (nodeId) => {
    setUserId(nodeId);
    fetchRecommendations(null, nodeId);
  };

  useEffect(() => {
    if (recommendations) {
      gsap.fromTo('.results-container', 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, [recommendations]);

  return (
    <div className="dashboard" ref={containerRef}>
      
      <HeroSection />

      <div className="how-to-use glass-panel" style={{ marginBottom: '32px', textAlign: 'left', lineHeight: '1.6' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
          <span className="text-accent">💡</span> How to use the Inference Engine
        </h3>
        <ul style={{ paddingLeft: '24px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <li><strong style={{color: 'var(--text-primary)'}}>1. Enter a User ID (0-6039):</strong> The SVD model requires a user profile to generate personalized recommendations. It multiplies that user's unique "Taste Vector" against the database of 3,706 movies to find their best matches. Try ID <strong>0</strong> or <strong>42</strong>!</li>
          <li><strong style={{color: 'var(--text-primary)'}}>2. Explore the Latent Space Map:</strong> Scroll down to see the live graph. This plots the algorithm's "brain" across 3,706 movies. Movies with similar hidden traits cluster together. When you search, a web will connect your recommendations on the grid!</li>
          <li><strong style={{color: 'var(--text-primary)'}}>3. Interactive Nodes:</strong> You can click directly on any dot in the graph to instantly run inference for that specific node.</li>
          <li><strong style={{color: 'var(--text-primary)'}}>4. Cold Start Fallback:</strong> Enter an unknown ID (e.g., <strong>9999</strong>) to simulate a brand new user. The system will detect the lack of history and automatically fall back to serving the most universally popular movies!</li>
        </ul>
      </div>

      <form className="search-bar glass-panel" onSubmit={fetchRecommendations}>
        <div className="input-wrapper">
          <Search className="search-icon" size={20} />
          <input 
            type="number" 
            placeholder="Enter User ID (e.g., 42)" 
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            min="0"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="spinner" size={20} /> : 'Get Recommendations'}
        </button>
      </form>

      {error && (
        <div className="error-message glass-panel">
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="loader-container">
          <InferenceLoader />
        </div>
      )}

      {recommendations && !loading && (
        <div className="results-container">
          <div className="user-insights glass-panel">
            <h2 className="section-title">
              Insights for User {recommendations.user_id}
            </h2>
            <div className="insight-stats">
              <div className="stat-box">
                <span className="stat-label">Algorithm</span>
                <span className="stat-value text-accent">
                  {recommendations.cold_start ? 'Popularity Fallback' : 'SVD Matrix'}
                </span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Profile Status</span>
                <span className="stat-value text-accent">
                  {recommendations.cold_start ? 'New / Cold Start' : 'Active Profile'}
                </span>
              </div>
            </div>
          </div>

          <ProductList 
            items={recommendations.recommendations} 
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            setHoveredProduct={setHoveredProduct}
            onSimilarFetch={setSimilarProducts}
          />
        </div>
      )}

      <div className="latent-space-section">
         <LatentSpaceMap 
            highlightedProducts={
              recommendations ? recommendations.recommendations : []
            }
            hoveredProduct={hoveredProduct}
            selectedProduct={selectedProduct}
            searchedNode={searchedNode}
            similarProducts={similarProducts ? similarProducts.map(s => s.product_id) : []}
            isFetching={loading}
            onNodeClick={handleNodeClick}
         />
      </div>
    </div>
  );
}
