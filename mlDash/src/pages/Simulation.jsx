import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { Play, Pause, RotateCcw, BrainCircuit, Activity, ChevronRight, GitCommit, Grid, TrendingDown, Timer } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import './Simulation.css';

export default function Simulation() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [lossData, setLossData] = useState([{ epoch: 0, loss: 8.0 }]);
  const [activeStep, setActiveStep] = useState(0);
  
  const matrixRef = useRef(null);
  const intervalRef = useRef(null);
  const stepIntervalRef = useRef(null);

  // Initialize Matrix Grid (10x10)
  const gridSize = 10;
  const initialGrid = Array(gridSize * gridSize).fill(0).map(() => Math.random());
  const [gridVals, setGridVals] = useState(initialGrid);

  const simulateEpoch = () => {
    setEpoch(prev => {
      const nextEpoch = prev + 1;
      
      // Simulate loss dropping exponentially with some noise
      setLossData(currentData => {
        const lastLoss = currentData[currentData.length - 1].loss;
        const target = 0.937;
        const noise = (Math.random() * 0.1 - 0.05); // subtle noise
        const newLoss = Math.max(0.9, (lastLoss - target) * 0.92 + target + noise);
        
        const newData = [...currentData, { epoch: nextEpoch, loss: newLoss }];
        // Keep last 50 points
        if (newData.length > 50) newData.shift();
        return newData;
      });

      // Update grid values randomly to simulate weight updates
      setGridVals(current => current.map(v => Math.max(0, Math.min(1, v + (Math.random() * 0.2 - 0.1)))));

      // Flash cells that got updated heavily
      if (matrixRef.current) {
        const cells = matrixRef.current.querySelectorAll('.sim-cell');
        const randomCells = Array.from(cells).sort(() => 0.5 - Math.random()).slice(0, 15);
        gsap.fromTo(randomCells,
          { backgroundColor: 'rgba(79, 70, 229, 0.8)' },
          { backgroundColor: 'transparent', duration: 0.5, clearProps: 'all' }
        );
      }

      return nextEpoch;
    });
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setEpoch(0);
    setActiveStep(0);
    setLossData([{ epoch: 0, loss: 8.0 }]);
    setGridVals(initialGrid);
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(simulateEpoch, 600);
      
      // Cycle through steps 1 -> 2 -> 3 repeatedly
      stepIntervalRef.current = setInterval(() => {
        setActiveStep(s => (s >= 3 ? 1 : s + 1));
      }, 200);

    } else {
      clearInterval(intervalRef.current);
      clearInterval(stepIntervalRef.current);
      setActiveStep(0);
    }
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(stepIntervalRef.current);
    };
  }, [isPlaying]);

  const steps = [
    { id: 1, title: "1. Predict & Calc Error", desc: "Compare prediction to actual target." },
    { id: 2, title: "2. Gradient Descent", desc: "Nudge matrix weights to reduce error." },
    { id: 3, title: "3. Log Performance", desc: "Record the new overall Loss (MSE)." }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Matrix Training Simulation</h2>
        <p>A live, interactive visualization of how Stochastic Gradient Descent trains the SVD model.</p>
      </div>

      <div className="info-cards-container">
        <div className="info-card glass-panel">
          <div className="info-icon text-accent"><Grid size={24} /></div>
          <h4>1. Latent Factor Matrix</h4>
          <p>This grid represents the internal "brain" (weights) of the algorithm. As training loops, cells flash as the math tweaks values to learn patterns in the data.</p>
        </div>
        <div className="info-card glass-panel">
          <div className="info-icon text-accent"><TrendingDown size={24} /></div>
          <h4>2. Loss Function</h4>
          <p>Plots the model's Error (Mean Squared Error). As the matrix updates itself, watch the error drop exponentially as predictions become more accurate.</p>
        </div>
        <div className="info-card glass-panel">
          <div className="info-icon text-accent"><Timer size={24} /></div>
          <h4>3. Epoch Counter</h4>
          <p>Counts the number of times the algorithm has looped over the entire dataset to adjust its weights. More epochs generally means better learning.</p>
        </div>
      </div>

      <div className="sim-controls glass-panel">
        <div className="sim-stats">
          <div className="stat">
            <span className="label">Current Epoch</span>
            <span className="val">{epoch}</span>
          </div>
          <div className="stat">
            <span className="label">Current Loss (MSE)</span>
            <span className="val">{lossData[lossData.length - 1].loss.toFixed(2)}</span>
          </div>
        </div>

        <div className="sim-actions">
          <button className={`btn-primary ${isPlaying ? 'paused' : ''}`} onClick={handlePlayPause}>
            {isPlaying ? <><Pause size={18} /> Pause Training</> : <><Play size={18} /> Start Training</>}
          </button>
          <button className="btn-secondary" onClick={handleReset}>
            <RotateCcw size={18} /> Reset
          </button>
        </div>
      </div>

      <div className="sim-grid-layout master-layout">
        
        {/* Left Side: The Pipeline Explained */}
        <div className="pipeline-sidebar glass-panel">
          <div className="matrix-header">
            <Activity size={20} className="text-accent" />
            <h3>The Training Loop</h3>
          </div>
          <p className="pipeline-intro">
            During training, the algorithm repeatedly loops through this process millions of times to find the optimal matrix values:
          </p>
          
          <div className="stepper-container">
            {steps.map(step => (
              <div key={step.id} className={`stepper-item ${activeStep === step.id ? 'active' : ''}`}>
                <div className="stepper-icon">
                  <GitCommit size={20} />
                </div>
                <div className="stepper-content">
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
                {activeStep === step.id && <ChevronRight className="pulse-arrow text-accent" />}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: The Visuals */}
        <div className="visuals-column">
          <div className="sim-matrix glass-panel">
            <div className="matrix-header">
              <BrainCircuit size={20} className="text-accent" />
              <h3>Latent Factor Matrix (Weights)</h3>
            </div>
            <div className="matrix-grid" ref={matrixRef} style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
              {gridVals.map((val, i) => (
                <div 
                  key={i} 
                  className="sim-cell" 
                  style={{ 
                    backgroundColor: `rgba(79, 70, 229, ${val * 0.3})`,
                    borderColor: `rgba(79, 70, 229, ${val * 0.5})`
                  }}
                >
                  {val.toFixed(1)}
                </div>
              ))}
            </div>
          </div>

          <div className="sim-graph glass-panel">
            <div className="matrix-header">
              <h3>Loss Function Minimization (MSE)</h3>
            </div>
            <div className="graph-container" style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <AreaChart data={lossData} margin={{ top: 10, right: 20, left: 30, bottom: 25 }}>
                <defs>
                  <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis 
                  dataKey="epoch" 
                  stroke="var(--text-secondary)" 
                  fontSize={12} 
                  tickLine={false}
                  label={{ value: 'Training Epochs', position: 'insideBottom', offset: -15, fill: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={12} 
                  domain={[0, 8]} 
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'MSE Loss', angle: -90, position: 'insideLeft', offset: -20, fill: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}
                />
                <RechartsTooltip 
                  contentStyle={{ background: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#4F46E5', fontWeight: 600 }}
                  labelStyle={{ color: 'var(--text-secondary)', fontWeight: 500 }}
                  formatter={(value) => [value.toFixed(2), 'Loss']}
                />
                <Area 
                  type="monotone" 
                  dataKey="loss" 
                  stroke="#4F46E5" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorLoss)" 
                  isAnimationActive={false} 
                />
              </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
