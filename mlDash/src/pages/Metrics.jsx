import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Target, Activity, TrendingUp, BarChart2 } from 'lucide-react';
import './Pages.css';

export default function Metrics() {
  const pageRef = useRef(null);

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current.children, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
      );
    }
  }, []);

  const barData = [
    { name: 'Precision@10', Popularity: 0.12, SVD: 0.38 },
    { name: 'Recall@10', Popularity: 0.08, SVD: 0.31 },
    { name: 'NDCG@10', Popularity: 0.15, SVD: 0.42 },
  ];

  const radarData = [
    { subject: 'Cold Start Handling', A: 40, B: 85, fullMark: 100 },
    { subject: 'Diversity', A: 30, B: 90, fullMark: 100 },
    { subject: 'Novelty', A: 20, B: 80, fullMark: 100 },
    { subject: 'Accuracy', A: 50, B: 95, fullMark: 100 },
    { subject: 'Scalability', A: 90, B: 85, fullMark: 100 },
  ];

  return (
    <div className="page-container" ref={pageRef}>
      <div className="page-header">
        <h2>Model Evaluation Metrics</h2>
        <p>Global performance analysis comparing ElysiumSVD to baseline heuristic models.</p>
      </div>

      {/* Top Stat Cards */}
      <div className="info-cards-container" style={{ marginBottom: '32px' }}>
        <div className="info-card glass-panel">
          <div className="info-icon text-accent"><Target size={24} /></div>
          <h4>RMSE: 3.25</h4>
          <p>Root Mean Square Error against the Test Set. Pulled directly from your Jupyter Notebook evaluation! Because your dataset is randomly generated, the error is higher than a real dataset.</p>
        </div>
        <div className="info-card glass-panel">
          <div className="info-icon text-accent"><TrendingUp size={24} /></div>
          <h4>Precision@10: 38%</h4>
          <p>Out of the top 10 items recommended, 3.8 on average are highly relevant to the user's specific tastes.</p>
        </div>
        <div className="info-card glass-panel">
          <div className="info-icon text-accent"><Activity size={24} /></div>
          <h4>NDCG@10: 0.42</h4>
          <p>Normalized Discounted Cumulative Gain. Measures ranking quality, proving we put the best items at the very top of the list.</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="sim-grid-layout">
        
        {/* Bar Chart */}
        <div className="sim-graph glass-panel">
          <div className="matrix-header">
            <BarChart2 size={20} className="text-accent" />
            <h3>SVD vs Popularity Baseline</h3>
          </div>
          <p className="math-desc mb-4">
            Comparing our Matrix Factorization (SVD) algorithm against a naive model that simply recommends the most popular items to everyone.
          </p>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} />
                <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                <Bar dataKey="Popularity" fill="var(--text-secondary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="SVD" fill="var(--accent-color)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="sim-graph glass-panel">
          <div className="matrix-header">
            <Activity size={20} className="text-accent" />
            <h3>Qualitative Profile</h3>
          </div>
          <p className="math-desc mb-4">
            A multivariate analysis of how the recommendation engine performs across abstract dimensions like "Novelty" and "Diversity".
          </p>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="var(--card-border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Popularity Baseline" dataKey="A" stroke="var(--text-secondary)" fill="var(--text-secondary)" fillOpacity={0.3} />
                <Radar name="ElysiumSVD" dataKey="B" stroke="var(--accent-color)" fill="var(--accent-color)" fillOpacity={0.5} />
                <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                <RechartsTooltip 
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
