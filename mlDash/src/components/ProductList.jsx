import { useEffect, useRef, useState } from "react";
import axios from "axios";
import gsap from "gsap";
import { Package, ChevronRight, Activity } from "lucide-react";
import InferenceLoader from "./InferenceLoader";
import "./ProductList.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function ProductList({
  items,
  selectedProduct,
  setSelectedProduct,
  setHoveredProduct,
  onSimilarFetch,
  movieTitles = {},
}) {
  const listRef = useRef(null);
  const [similarProducts, setSimilarProducts] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset selection when new items arrive
    setSelectedProduct(null);
    setSimilarProducts(null);
    if (onSimilarFetch) onSimilarFetch(null);

    // Animate items staggering in
    if (listRef.current) {
      const cards = listRef.current.querySelectorAll(".product-card");
      gsap.fromTo(
        cards,
        { opacity: 0, scale: 0.9, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(1.2)",
        },
      );
    }
  }, [items, setSelectedProduct]);

  const fetchSimilar = async (productId) => {
    if (selectedProduct === productId) {
      setSelectedProduct(null);
      setSimilarProducts(null);
      if (onSimilarFetch) onSimilarFetch(null);
      return;
    }

    setLoading(true);
    setSelectedProduct(productId);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/similar/${productId}?n=5`,
      );
      const data = response.data.similar;
      setSimilarProducts(data);
      if (onSimilarFetch) onSimilarFetch(data);

      // Animate similar products container
      setTimeout(() => {
        gsap.fromTo(
          ".similar-container",
          { opacity: 0, height: 0 },
          { opacity: 1, height: "auto", duration: 0.4, ease: "power2.out" },
        );

        // GSAP number scrubbing for similarity percentages
        const scores = document.querySelectorAll(".similarity-score-val");
        scores.forEach((el, i) => {
          const finalVal = response.data.similar[i].similarity * 100;
          const obj = { val: 0 };
          gsap.to(obj, {
            val: finalVal,
            duration: 1.5,
            ease: "power3.out",
            onUpdate: () => {
              el.innerText = `${obj.val.toFixed(1)}%`;
            },
          });
        });
      }, 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-layout">
      <div className="product-grid" ref={listRef}>
        {items.map((productId) => (
          <div
            key={productId}
            className={`product-card glass-panel ${selectedProduct === productId ? "selected" : ""}`}
            onClick={() => fetchSimilar(productId)}
            onMouseEnter={() => setHoveredProduct({ id: productId, source: 'card' })}
            onMouseLeave={() => setHoveredProduct(null)}
          >
            <div className="product-icon">
              <Package size={28} />
            </div>
            <div className="product-info">
              <h3>{movieTitles[productId] || `Movie #${productId}`}</h3>
              <span className="view-similar">
                {selectedProduct === productId
                  ? "Hide Similar"
                  : "View Similar"}{" "}
                <ChevronRight size={16} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="similar-loader-wrapper glass-panel">
          <Activity
            className="spinner text-accent"
            size={24}
            style={{ margin: "auto" }}
          />
          <span style={{ marginLeft: "12px", color: "var(--text-secondary)" }}>
            Calculating Similarities...
          </span>
        </div>
      )}

      {selectedProduct && !loading && similarProducts && (
        <div className="similar-container glass-panel">
          <div className="similar-header">
            <h3>Similar to {movieTitles[selectedProduct] || `#${selectedProduct}`}</h3>
          </div>

          <div className="similar-list">
            {similarProducts.map((item, index) => (
              <div
                key={`${item.movie_id}-${index}`}
                className="similar-item"
                onClick={() => setHoveredProduct({ id: item.movie_id, source: 'row' })}
                onMouseEnter={() => setHoveredProduct({ id: item.movie_id, source: 'row' })}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <Package size={18} className="text-secondary" />
                <span className="item-id">{movieTitles[item.movie_id] || `Movie #${item.movie_id}`}</span>
                <div className="similarity-bar">
                  <div
                    className="similarity-fill"
                    style={{ width: `${Math.max(0, item.similarity * 100)}%` }}
                  />
                </div>
                <span className="similarity-score">
                  <span className="similarity-score-val">
                    {(item.similarity * 100).toFixed(1)}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
