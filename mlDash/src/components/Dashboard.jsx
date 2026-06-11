import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import { Search, Loader2, X, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [movieTitles, setMovieTitles] = useState({});

  // State for map node click → similar movies
  const [clickedMovie, setClickedMovie] = useState(null);
  const [mapSimilar, setMapSimilar] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);

  const containerRef = useRef(null);

  // Fetch movie titles once on mount
  useEffect(() => {
    axios.get(`${API_BASE_URL}/movies`)
      .then(res => setMovieTitles(res.data))
      .catch(() => {});
  }, []);

  const fetchRecommendations = async (e, forcedId = null) => {
    if (e) e.preventDefault();
    const idToSearch = forcedId || userId;
    if (!idToSearch) return;

    setLoading(true);
    setError('');
    setRecommendations(null);

    try {
      const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
      const apiCall = axios.get(`${API_BASE_URL}/recommend/${idToSearch}?n=5`);
      
      const [response] = await Promise.all([apiCall, minDelay]);
      setRecommendations(response.data);
      // setSearchedNode removed previously! Wait, was setSearchedNode removed?
      // Yes, I removed it in step 1063 earlier!
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = () => {
    setUserId(prev => prev ? parseInt(prev) + 1 : 1);
  };

  const handleDecrement = () => {
    setUserId(prev => (prev && parseInt(prev) > 0) ? parseInt(prev) - 1 : 0);
  };

  const handleNodeClick = async (movieId) => {
    setClickedMovie(movieId);
    setMapSimilar(null);
    setMapLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/similar/${movieId}?n=5`);
      setMapSimilar(response.data.similar);
    } catch (err) {
      console.error('Failed to fetch similar movies', err);
    } finally {
      setMapLoading(false);
    }
  };

  const clearNodeClick = () => {
    setClickedMovie(null);
    setMapSimilar(null);
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
          <li><strong style={{color: 'var(--text-primary)'}}>3. Click a Movie Node:</strong> Click any dot on the Latent Space Map to find 5 movies most similar to it using Cosine Similarity. The results will appear below the map with a constellation web!</li>
          <li><strong style={{color: 'var(--text-primary)'}}>4. Cold Start Fallback:</strong> Enter an unknown ID (e.g., <strong>9999</strong>) to simulate a brand new user. The system will detect the lack of history and automatically fall back to serving the most universally popular movies!</li>
        </ul>
      </div>

      <form className="search-bar glass-panel" onSubmit={fetchRecommendations}>
        <div className="input-wrapper" style={{ position: 'relative' }}>
          <Search className="search-icon" size={20} />
          <input 
            type="number" 
            placeholder="Enter User ID (e.g., 42)" 
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            min="0"
          />
          <div className="custom-spinners">
            <button type="button" className="spinner-btn up" onClick={handleIncrement}><ChevronUp size={14} /></button>
            <button type="button" className="spinner-btn down" onClick={handleDecrement}><ChevronDown size={14} /></button>
          </div>
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
            movieTitles={movieTitles}
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
            similarProducts={similarProducts ? similarProducts.map(s => s.product_id) : []}
            mapSimilarIds={mapSimilar ? mapSimilar.map(s => s.product_id) : []}
            clickedMovie={clickedMovie}
            isFetching={loading}
            onNodeClick={handleNodeClick}
            movieTitles={movieTitles}
         />
      </div>

      {/* Map Node Click Results */}
      {clickedMovie !== null && (
        <div className="map-similar-results glass-panel" style={{ marginTop: '24px', padding: '24px', position: 'relative' }}>
          <button 
            className="icon-btn" 
            onClick={clearNodeClick} 
            style={{ position: 'absolute', top: '20px', right: '20px' }}
            title="Clear Selection"
          >
            <X size={20} />
          </button>
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', paddingRight: '32px' }}>
            <span className="text-accent">🎯</span> Movies Similar to: <strong className="text-accent">{movieTitles[clickedMovie] || `Movie #${clickedMovie}`}</strong>
          </h3>
          {mapLoading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Calculating cosine similarity...</p>
          ) : mapSimilar ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {mapSimilar.map((item) => (
                <div key={item.product_id} className="glass-panel" style={{ padding: '12px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => handleNodeClick(item.product_id)}
                  onMouseEnter={() => setHoveredProduct({ id: item.product_id, source: 'row' })}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{movieTitles[item.product_id] || `Movie #${item.product_id}`}</span>
                  <span style={{ color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: 500 }}>{(item.similarity * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
