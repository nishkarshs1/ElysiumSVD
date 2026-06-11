import { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import { Network, RefreshCw, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import './LatentSpaceMap.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Max nodes rendered in DOM to keep animations smooth
const MAX_VISIBLE_NODES = 400;

export default function LatentSpaceMap({ highlightedProducts, hoveredProduct, selectedProduct, isFetching, onNodeClick, similarProducts, mapSimilarIds = [], clickedMovie = null, movieTitles = {} }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const CATEGORIES = ['All', 'Action', 'Comedy', 'Drama', 'Sci-Fi'];
  const getCategory = (id) => CATEGORIES[(id % (CATEGORIES.length - 1)) + 1];
  
  const mapRef = useRef(null);
  const linesRef = useRef(null);
  const mapWrapperRef = useRef(null);
  const idleTweenRef = useRef(null);
  const fetchTweenRef = useRef(null);

  const handleFullScreen = () => {
    if (!mapWrapperRef.current) return;
    if (!document.fullscreenElement) {
      mapWrapperRef.current.requestFullscreen().catch(err => {
        console.error("Error attempting to enable full-screen mode:", err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

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

  useEffect(() => { fetchMap(); }, []);

  // Build the set of "important" IDs that must always be shown
  const importantIds = useMemo(() => {
    const ids = new Set();
    highlightedProducts.forEach(id => ids.add(id));
    if (similarProducts) similarProducts.forEach(id => ids.add(id));
    if (selectedProduct !== null) ids.add(selectedProduct);
    mapSimilarIds.forEach(id => ids.add(id));
    if (clickedMovie !== null) ids.add(clickedMovie);
    return ids;
  }, [highlightedProducts, similarProducts, selectedProduct, mapSimilarIds, clickedMovie]);

  // Stable sampled set — only recompute when full points list changes
  const sampledIds = useMemo(() => {
    if (points.length === 0) return new Set();
    // Deterministic sample: pick every N-th node so the visual spread is even
    const step = Math.max(1, Math.floor(points.length / MAX_VISIBLE_NODES));
    const ids = new Set();
    for (let i = 0; i < points.length; i += step) {
      ids.add(points[i].movie_id);
    }
    return ids;
  }, [points]);

  // Final visible points = sampled ∪ important (important always shown)
  const visiblePoints = useMemo(() => {
    if (points.length === 0) return [];
    return points.filter(p => sampledIds.has(p.movie_id) || importantIds.has(p.movie_id));
  }, [points, sampledIds, importantIds]);

  // Idle and Fetching Animations — only target rendered dots
  useEffect(() => {
    if (visiblePoints.length === 0 || !mapRef.current) return;
    const dots = mapRef.current.querySelectorAll('.latent-dot');

    if (isFetching) {
      if (idleTweenRef.current) idleTweenRef.current.kill();
      fetchTweenRef.current = gsap.to(dots, {
        scale: 1.5,
        opacity: 0.8,
        backgroundColor: '#4F46E5',
        duration: 0.4,
        ease: 'power2.inOut',
        stagger: { each: 0.005, from: 'center', grid: 'auto', yoyo: true, repeat: -1 }
      });
    } else {
      if (fetchTweenRef.current) fetchTweenRef.current.kill();
      gsap.to(dots, { scale: 1, backgroundColor: '', opacity: '', duration: 0.5 });
      idleTweenRef.current = gsap.to(dots, {
        y: 'random(-4, 4)',
        x: 'random(-4, 4)',
        duration: 'random(2.5, 4.5)',
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: { amount: 3, from: 'random' }
      });
    }

    return () => {
      if (idleTweenRef.current) idleTweenRef.current.kill();
      if (fetchTweenRef.current) fetchTweenRef.current.kill();
    };
  }, [visiblePoints, isFetching]);

  // Scatter reveal — only runs when sampled set first populates
  useEffect(() => {
    if (visiblePoints.length > 0 && mapRef.current) {
      const dots = mapRef.current.querySelectorAll('.latent-dot');
      gsap.fromTo(dots,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 0.6, duration: 0.8, stagger: 0.001, ease: 'back.out(2)' }
      );
    }
  }, [sampledIds]); // only re-trigger on full resample, not every highlight

  // Calculate scaling ranges from ALL points for correct coordinate mapping
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

  // Constellation Web — uses ALL points for accurate positions
  useEffect(() => {
    if (highlightedProducts.length < 2 || !scales || !linesRef.current) {
      if (linesRef.current) linesRef.current.innerHTML = '';
      return;
    }
    linesRef.current.innerHTML = '';
    const lines = [];
    const validPoints = highlightedProducts
      .map(id => points.find(p => p.movie_id === id))
      .filter(Boolean);

    for (let i = 0; i < validPoints.length; i++) {
      for (let j = i + 1; j < validPoints.length; j++) {
        const p1 = validPoints[i];
        const p2 = validPoints[j];
        const x1 = 5 + ((p1.coordinates.x - scales.minX) / scales.rangeX) * 90;
        const y1 = 95 - ((p1.coordinates.y - scales.minY) / scales.rangeY) * 90;
        const x2 = 5 + ((p2.coordinates.x - scales.minX) / scales.rangeX) * 90;
        const y2 = 95 - ((p2.coordinates.y - scales.minY) / scales.rangeY) * 90;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', `${x1}%`);
        line.setAttribute('y1', `${y1}%`);
        line.setAttribute('x2', `${x2}%`);
        line.setAttribute('y2', `${y2}%`);
        line.setAttribute('class', 'constellation-line');
        linesRef.current.appendChild(line);
        lines.push(line);
      }
    }
    gsap.fromTo(lines,
      { strokeDasharray: 100, strokeDashoffset: 100, opacity: 0 },
      { strokeDashoffset: 0, opacity: 0.6, duration: 1.5, stagger: 0.1, ease: 'power3.out' }
    );
  }, [highlightedProducts, points, scales]);

  const renderDots = () => {
    if (!scales) return null;

    return visiblePoints.map((p) => {
      const xPercent = 5 + ((p.coordinates.x - scales.minX) / scales.rangeX) * 90;
      const yPercent = 95 - ((p.coordinates.y - scales.minY) / scales.rangeY) * 90;

      const isHighlighted = highlightedProducts.includes(p.movie_id);
      const isSelected = selectedProduct === p.movie_id;
      const isHovered = hoveredProduct?.id === p.movie_id;
      const isSimilar = similarProducts && similarProducts.includes(p.movie_id);
      const isMapSimilar = mapSimilarIds.includes(p.movie_id);
      const isClicked = clickedMovie === p.movie_id;
      const hasSearch = highlightedProducts.length > 0 || mapSimilarIds.length > 0 || clickedMovie !== null;
      const nodeCategory = getCategory(p.movie_id);
      const matchesCategory = selectedCategory === 'All' || nodeCategory === selectedCategory;

      let className = 'latent-dot';
      if (!isFetching) {
        if (!matchesCategory) {
          className += ' filtered-out';
        } else if (hasSearch) {
          if (isHovered) {
            className += (hoveredProduct?.source === 'row') ? ' hovered-node' : ' selected';
          }
          else if (isClicked) className += ' clicked-node';
          else if (isSimilar) className += ' similar-result';
          else if (isMapSimilar) className += ' map-similar-result';
          else if (isSelected) className += ' selected';
          else if (isHighlighted) className += ' highlighted';
          else className += ' dimmed';
        }
      }

      return (
        <div
          key={p.movie_id}
          className={className}
          style={{ left: `${xPercent}%`, top: `${yPercent}%`, willChange: 'transform' }}
          title={`${movieTitles[p.movie_id] || 'Movie ' + p.movie_id} (${nodeCategory})`}
          onClick={() => { if (onNodeClick) onNodeClick(p.movie_id); }}
        >
          <div className="dot-tooltip">{movieTitles[p.movie_id] || `Movie #${p.movie_id}`} <br/><span style={{fontSize:'10px', color:'var(--text-secondary)'}}>{nodeCategory}</span></div>
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
        A 2D projection of how the model clusters {points.length > 0 ? `${points.length.toLocaleString()} movies` : 'movies'}. Showing {visiblePoints.length} representative nodes.
      </p>

      {error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div ref={mapWrapperRef} className="map-area" style={{ width: '100%', height: '100%', position: 'relative', flex: 1, overflow: 'hidden', minHeight: '400px', backgroundColor: 'var(--bg-color)' }}>
          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={30}
            centerOnInit={true}
            wheel={{ step: 0.1 }}
            doubleClick={{ disabled: true }}
            panning={{ velocityDisabled: false }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="zoom-controls" style={{ position: 'absolute', right: '16px', bottom: '16px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(31,41,55,0.8)', padding: '8px', borderRadius: '12px', backdropFilter: 'blur(8px)' }}>
                  <button className="icon-btn" onClick={() => zoomIn()} title="Zoom In"><ZoomIn size={20} /></button>
                  <button className="icon-btn" onClick={() => zoomOut()} title="Zoom Out"><ZoomOut size={20} /></button>
                  <button className="icon-btn" onClick={() => resetTransform()} title="Reset Map"><RefreshCw size={20} /></button>
                  <button className="icon-btn" onClick={handleFullScreen} title="Toggle Fullscreen"><Maximize size={20} /></button>
                </div>
                <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
                  <div style={{ width: '100%', height: '100%', minHeight: '400px', position: 'relative' }}>
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
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      )}
    </div>
  );
}
