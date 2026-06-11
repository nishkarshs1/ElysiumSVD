import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X } from 'lucide-react';
import './XAIPanel.css';

export default function XAIPanel({ isOpen, targetId, results, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && results && (
        <motion.div 
          className="xai-panel glass-panel"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        >
          <div className="xai-header">
            <div className="xai-title">
              <Terminal size={18} className="text-accent" />
              <h4>Explainability Panel (XAI)</h4>
            </div>
            <button onClick={onClose} className="xai-close-btn"><X size={18} /></button>
          </div>
          
          <div className="xai-content">
            <p>
              ElysiumSVD clustered <strong>Target Movie #{targetId}</strong> with the following movies based on cosine proximity in the shared latent space:
            </p>
            <ul className="xai-list">
              {results.slice(0, 3).map((item, i) => (
                <li key={i}>
                  ➔ Movie #{item.product_id} due to a <strong>{(item.similarity * 100).toFixed(1)}%</strong> cosine proximity.
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
