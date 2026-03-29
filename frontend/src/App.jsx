import { useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import "./App.css";

const API = "http://localhost:5000";

// Colour logic based on keyword density
function getColor(density) {
  if (density > 3)   return "#E24B4A"; // red  — overused
  if (density > 1.5) return "#1D9E75"; // green — ideal
  return "#378ADD";                     // blue  — low
}

export default function App() {
  const [text, setText]     = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

/*The analyse function — calling the Flask API*/
  async function handleAnalyse() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await axios.post(`${API}/analyse`, { text });
      setResult(res.data);
    } catch (e) {
      setError(
        e.response?.data?.error ||
        "Something went wrong. Is the Flask server running?"
      );
    }
    setLoading(false);
  }

/*The JSX — what gets rendered*/
  return (
    <div className="app">
      <h1>SEOBuddy</h1>
      <p className="message">Your personal SEO Analyser tool which analyses your article to provide SEO insights.</p>
      <p className="subtitle">
        Paste any article to get keyword density,
        readability scores and SEO insights.
      </p>

      {/* Text input area */}
      <textarea className="textarea"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="You can paste your article here..."
        rows={30} cols={100}
      />

      {/* Word count + Analyse button */}
      <div className="meta">
        <span>
          {text.split(/\s+/).filter(Boolean).length} words
        </span>
      </div>
      <div className="button"><button className="analyse-button"
        onClick={handleAnalyse}
        disabled={loading || !text.trim()}
      >
        {loading ? "Analysing..." : "Analyse"}
      </button>

      {/* Error message */}
      {error && <div className="error">{error}</div>}
    </div>
      {/* Results section */}
      {result && (
        <div className="results">

          {/* Stat cards row */}
          <div className="stats-grid">
            <StatCard label='Total words'
              value={result.total_words} />
            <StatCard label='Sentences'
              value={result.sentences} />
            <StatCard label='Avg sentence'
              value={`${result.avg_sentence_length} words`} />
            <StatCard
              label='Readability'
              value={result.readability_label}
              sub={`Flesch: ${result.flesch_score}`}
              color={
                result.flesch_score >= 70 ? 'green' :
                result.flesch_score >= 50 ? 'amber' : 'red'
              }
            />
          </div>

          {/* Bar chart — recharts */}
          <h2>Top keywords by density</h2>
          <ResponsiveContainer width='100%' height={320}>
            <BarChart
              data={result.keywords}
              layout='vertical'
              margin={{ left: 80, right: 40 }}
            >
              <XAxis type='number' unit='%'
                tick={{ fontSize: 12 }} />
              <YAxis dataKey='word' type='category'
                tick={{ fontSize: 12 }} width={80} />
              <Tooltip
                formatter={(val) => [`${val}%`, 'Density']}
              />
              <Bar dataKey='density'
                radius={[0, 4, 4, 0]}>
                {result.keywords.map((entry, i) => (
                  <Cell key={i}
                    fill={getColor(entry.density)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Keyword table */}
          <h2>Keyword breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Keyword</th><th>Count</th>
                <th>Density</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {result.keywords.map((k, i) => (
                <tr key={i}>
                  <td>{k.word}</td>
                  <td>{k.count}</td>
                  <td>{k.density}%</td>
                  <td>
                    <span className={`badge ${ 
                      k.density > 3 ? 'badge-red' :
                      k.density >= 1.5 ? 'badge-green' :
                      'badge-blue'
                    }`}>
                      {k.density > 3 ? 'Overused' :
                       k.density >= 1.5 ? 'Ideal' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Reusable stat card component
function StatCard({ label, value, sub, color }) {
  return (
    <div className={`stat-card ${color || ''}`}>
      <div className='stat-value'>{value}</div>
      <div className='stat-label'>{label}</div>
      {sub && <div className='stat-sub'>{sub}</div>}
    </div>
  );
}
