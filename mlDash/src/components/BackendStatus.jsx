import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import { Activity } from 'lucide-react';
import './BackendStatus.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function BackendStatus() {
  const [isOnline, setIsOnline] = useState(false);
  const [latency, setLatency] = useState(0);
  
  const latencyRef = useRef(null);
  const prevLatencyRef = useRef(0);

  useEffect(() => {
    const checkStatus = async () => {
      const start = performance.now();
      try {
        await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
        const end = performance.now();
        const currentLatency = Math.round(end - start);
        
        setIsOnline(true);
        
        // GSAP animate number update
        if (latencyRef.current) {
          const obj = { val: prevLatencyRef.current };
          gsap.to(obj, {
            val: currentLatency,
            duration: 1,
            ease: 'power2.out',
            onUpdate: () => {
              if (latencyRef.current) {
                latencyRef.current.innerText = `${Math.round(obj.val)}ms`;
              }
            }
          });
          prevLatencyRef.current = currentLatency;
        }
      } catch (err) {
        setIsOnline(false);
        if (latencyRef.current) latencyRef.current.innerText = '--ms';
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`backend-status glass-panel ${isOnline ? 'online' : 'offline'}`}>
      <Activity size={16} className="status-icon" />
      <span className="status-text">{isOnline ? 'System Online' : 'System Offline'}</span>
      {isOnline && (
        <div className="latency-container">
          <span className="ping-dot"></span>
          <span ref={latencyRef} className="latency-ms">0ms</span>
        </div>
      )}
    </div>
  );
}
