import { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import { Network, RefreshCw } from 'lucide-react';
import './LatentSpaceMap.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function LatentSpaceMap({ highlightedProducts, hoveredProduct, selectedProduct, isFetching, onNodeClick, searchedNode, similarProducts }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Home & Garden', 'Books'];
  // Deterministically assign a category based on product ID
  const getCategory = (id) => CATEGORIES[(id % (CATEGORIES.length - 1)) + 1];
  
  const mapRef = useRef(null);
  const linesRef = useRef(null);
  const idleTweenRef = useRef(null);
  const fetchTweenRef = useRef(null);

  const fetchMap = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/latent-space`);
      setPoints(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch latent space data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMap();
  }, []);

  // Idle and Fetching Animations
  useEffect(() => {
    if (points.length === 0 || !mapRef.current) return;
    const dots = mapRef.current.querySelectorAll('.latent-dot');
    
    if (isFetching) {
      // Stop idle animation
      if (idleTweenRef.current) idleTweenRef.current.kill();
      
      // Fast radar sweep pulse
      fetchTweenRef.current = gsap.to(dots, {
        scale: 1.5,
        opacity: 0.8,
        backgroundColor: '#4F46E5', // Accent color
        duration: 0.4,
        ease: 'power2.inOut',
        stagger: {
          each: 0.01,
          from: 'center',
          grid: 'auto',
          yoyo: true,
          repeat: -1
        }
      });
    } else {
      // Stop fetching animation
      if (fetchTweenRef.current) fetchTweenRef.current.kill();
      
      // Reset dots
      gsap.to(dots, { scale: 1, backgroundColor: '', opacity: '', duration: 0.5 });
      
      // Start/Resume idle floating
      idleTweenRef.current = gsap.to(dots, {
        y: 'random(-5, 5)',
        x: 'random(-5, 5)',
        duration: 'random(2, 4)',
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: { amount: 2, from: 'random' }
      });
    }

    return () => {
      if (idleTweenRef.current) idleTweenRef.current.kill();
      if (fetchTweenRef.current) fetchTweenRef.current.kill();
    };
  }, [points, isFetching]);

  // Scatter reveal on mount
  useEffect(() => {
    if (points.length > 0 && mapRef.current) {
      const dots = mapRef.current.querySelectorAll('.latent-dot');
      gsap.fromTo(dots,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 0.6, duration: 1, stagger: 0.002, ease: 'back.out(2)' }
      );
    }
  }, [points.length]);

  // Calculate scaling ranges
  const scales = useMemo(() => {
    if (points.length === 0) return null;
    const xs = points.map(p => p.coordinates.x);
    const ys = points.map(p => p.coordinates.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      rangeX: (Math.max(...xs) - Math.min(...xs)) || 1,
      rangeY: (Math.max(...ys) - Math.min(...ys)) || 1,
    };
  }, [points]);

  // Draw Constellation Web for Recommendations
  useEffect(() => {
    if (highlightedProducts.length < 2 || !scales || !linesRef.current) {
      if (linesRef.current) linesRef.current.innerHTML = '';
      return;
    }

    linesRef.current.innerHTML = '';
    const lines = [];
    const validPoints = highlightedProducts
      .map(id => points.find(p => p.product_id === id))
      .filter(Boolean);

    // Draw lines connecting each highlighted point to all others (forming a web)
    for (let i = 0; i < validPoints.length; i++) {
      for (let j = i + 1; j < validPoints.length; j++) {
        const p1 = validPoints[i];
        const p2 = validPoints[j];

        const x1 = 5 + ((p1.coordinates.x - scales.minX) / scales.rangeX) * 90;
        const y1 = 95 - ((p1.coordinates.y - scales.minY) / scales.rangeY) * 90;
        const x2 = 5 + ((p2.coordinates.x - scales.minX) / scales.rangeX) * 90;
        const y2 = 95 - ((p2.coordinates.y - scales.minY) / scales.rangeY) * 90;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute('x1', `${x1}%`);
        line.setAttribute('y1', `${y1}%`);
        line.setAttribute('x2', `${x2}%`);
        line.setAttribute('y2', `${y2}%`);
        line.setAttribute('class', 'constellation-line');
        linesRef.current.appendChild(line);
        lines.push(line);
      }
    }

    // Modern glowing draw-in animation for lines
    gsap.fromTo(lines,
      { strokeDasharray: 100, strokeDashoffset: 100, opacity: 0 },
      { strokeDashoffset: 0, opacity: 0.6, duration: 1.5, stagger: 0.1, ease: 'power3.out' }
    );

  }, [highlightedProducts, points, scales]);


  const renderDots = () => {
    if (!scales) return null;

    return points.map((p) => {
      const xPercent = 5 + ((p.coordinates.x - scales.minX) / scales.rangeX) * 90;
      const yPercent = 95 - ((p.coordinates.y - scales.minY) / scales.rangeY) * 90;
      
      const isHighlighted = highlightedProducts.includes(p.product_id);
      const isSelected = selectedProduct === p.product_id;
      const isHovered = hoveredProduct === p.product_id;
      const isSearched = searchedNode === p.product_id;
      const isSimilar = similarProducts && similarProducts.includes(p.product_id);
      const hasSearch = highlightedProducts.length > 0 || searchedNode !== null;
      const nodeCategory = getCategory(p.product_id);
      const matchesCategory = selectedCategory === 'All' || nodeCategory === selectedCategory;

      let className = "latent-dot";
      if (!isFetching) {
        if (!matchesCategory) {
          className += " filtered-out";
        } else if (hasSearch) {
          if (isSearched) className += " searched";
          else if (isSimilar) className += " similar-result";
          else if (isSelected || isHovered) className += " selected";
          else if (isHighlighted) className += " highlighted";
          else className += " dimmed";
        }
      }

      return (
        <div 
          key={p.product_id}
          className={className}
          style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
          title={`Product ${p.product_id} (${nodeCategory})`}
          onClick={() => {
            if (onNodeClick) onNodeClick(p.product_id);
          }}
        >
          <div className="dot-tooltip">Item #{p.product_id} <br/><span style={{fontSize:'10px', color:'var(--text-secondary)'}}>{nodeCategory}</span></div>
        </div>
      );
    });
  };

  return (
    <div className="latent-space-container glass-panel">
      <div className="latent-header">
        <div className="latent-title">
          <Network className="text-accent" size={24} />
          <h2>Live Latent Space</h2>
        </div>
        <div className="latent-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            className="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button className="icon-btn" onClick={fetchMap} disabled={loading || isFetching} title="Refresh Map">
            <RefreshCw size={18} className={loading ? 'spinner' : ''} />
          </button>
        </div>
      </div>
      
      <p className="latent-desc">
        A 2D projection of how the matrix factorization model clusters products. {points.length > 0 && `Tracking ${points.length} nodes.`}
      </p>

      {error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="map-area">
          <svg className="map-connections-layer" ref={linesRef} width="100%" height="100%" />
          
          <div ref={mapRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
            {loading && points.length === 0 ? (
              <div className="map-loading">Initializing Matrix...</div>
            ) : (
              <>
                <div className="grid-lines"></div>
                <div className="grid-lines horizontal"></div>
                {renderDots()}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
