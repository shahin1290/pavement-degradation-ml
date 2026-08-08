import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [activeTab, setActiveTab] = useState('predictor');
  
  const [formData, setFormData] = useState({
    spardjup: 4.5,
    spardjup_17: 5.2,
    vagbredd: 8.5,
    adt_fordon: 3500,
    belaggningsar: 2021,
    hastighet: 90
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    const payload = {
      spardjup: parseFloat(formData.spardjup),
      spardjup_17: parseFloat(formData.spardjup_17),
      vagbredd: parseFloat(formData.vagbredd),
      adt_fordon: parseInt(formData.adt_fordon, 10),
      belaggningsar: parseInt(formData.belaggningsar, 10),
      hastighet: parseInt(formData.hastighet, 10)
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/api/predict`, payload);
      setResult(response.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object') {
        setError(JSON.stringify(detail));
      } else {
        setError(detail || 'Failed to communicate with FastAPI server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '40px auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#222', padding: '0 20px' }}>
      
      {/* Header Banner */}
      <header style={{ textOverflow: 'ellipsis', textAlign: 'center', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#0f172a' }}>Trafikverket Road IRI Prediction Dashboard</h1>
        <p style={{ margin: '0', fontSize: '15px', color: '#64748b' }}>
          Machine Learning Infrastructure for Predictive Pavement Degradation Modeling
        </p>
      </header>

      {/* Tab Navigation */}
      <nav style={{ display: 'flex', gap: '8px', margin: '24px 0', borderBottom: '2px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('predictor')}
          style={{
            padding: '12px 20px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'predictor' ? '3px solid #008080' : '3px solid transparent',
            color: activeTab === 'predictor' ? '#008080' : '#64748b',
            transition: 'all 0.2s ease'
          }}
        >
          🔮 Live Predictor
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '12px 20px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'overview' ? '3px solid #008080' : '3px solid transparent',
            color: activeTab === 'overview' ? '#008080' : '#64748b',
            transition: 'all 0.2s ease'
          }}
        >
          📘 Project Overview
        </button>

        <button
          onClick={() => setActiveTab('features')}
          style={{
            padding: '12px 20px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'features' ? '3px solid #008080' : '3px solid transparent',
            color: activeTab === 'features' ? '#008080' : '#64748b',
            transition: 'all 0.2s ease'
          }}
        >
          📊 Model & Data Specs
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          style={{
            padding: '12px 20px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'architecture' ? '3px solid #008080' : '3px solid transparent',
            color: activeTab === 'architecture' ? '#008080' : '#64748b',
            transition: 'all 0.2s ease'
          }}
        >
          ⚡ Cloud Architecture
        </button>
      </nav>

      {/* TAB 1: LIVE PREDICTOR FORM */}
      {activeTab === 'predictor' && (
        <div style={{ background: '#ffffff', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#0f172a' }}>Evaluate Road Segment Roughness</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', marginBottom: '6px' }}>Rut Depth Max 15 (mm):</label>
                <input type="number" step="0.1" name="spardjup" value={formData.spardjup} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', marginBottom: '6px' }}>Rut Depth Max 17 (mm):</label>
                <input type="number" step="0.1" name="spardjup_17" value={formData.spardjup_17} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', marginBottom: '6px' }}>Road Width / Vägbredd (m):</label>
                <input type="number" step="0.1" name="vagbredd" value={formData.vagbredd} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', marginBottom: '6px' }}>Traffic Volume / ÅDT fordon:</label>
                <input type="number" name="adt_fordon" value={formData.adt_fordon} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', marginBottom: '6px' }}>Construction Year / Beläggningsår:</label>
                <input type="number" name="belaggningsar" value={formData.belaggningsar} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', marginBottom: '6px' }}>Speed Limit / Hastighetsgräns (km/h):</label>
                <input type="number" name="hastighet" value={formData.hastighet} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#80cbc4' : '#008080',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'background 0.2s ease'
              }}
            >
              {loading ? 'Processing Model Inference...' : 'Calculate IRI Prediction'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '20px', padding: '12px 16px', background: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', borderRadius: '4px', fontSize: '14px' }}>
              ⚠️ <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div style={{ marginTop: '25px', padding: '20px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '6px solid #008080', border: '1px solid #bbf7d0' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#166534' }}>Model Analysis Output</h3>
              <p style={{ margin: '6px 0', fontSize: '15px' }}>
                <strong>Predicted IRI Roughness:</strong> <span style={{ fontSize: '18px', color: '#008080', fontWeight: 'bold' }}>{result.predicted_iri} mm/m</span>
              </p>
              <p style={{ margin: '6px 0', fontSize: '15px' }}>
                <strong>Pavement Condition Class:</strong> <span style={{ fontWeight: 'bold' }}>{result.condition}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROJECT OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ background: '#ffffff', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', lineHeight: '1.6' }}>
          <h2 style={{ marginTop: '0', color: '#0f172a' }}>Thesis Project Context & Objectives</h2>
          <p>
            Maintaining public road networks requires scalable data-driven methodologies to monitor pavement wear and schedule timely repairs. This thesis project focuses on building an operational machine learning pipeline to predict road roughness—quantified by the <strong>International Roughness Index (IRI)</strong>—using Swedish national road data provided by <strong>Trafikverket</strong>.
          </p>
          
          <h3 style={{ color: '#008080', marginTop: '24px' }}>Core Objectives</h3>
          <ul style={{ paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}><strong>Predictive Deterioration Modeling:</strong> Model non-linear relationships between traffic loading, pavement age, geometry, and surface rutting to predict `IRI höger`.</li>
            <li style={{ marginBottom: '8px' }}><strong>Proactive Maintenance Decision Support:</strong> Provide actionable metrics to assist road authorities (e.g., VTI, Trafikverket) in transitioning from reactive repairs to optimized lifecycle maintenance.</li>
            <li style={{ marginBottom: '8px' }}><strong>End-to-End Cloud Deployment:</strong> Bridge research and production by hosting an inference API on AWS EC2 linked directly to an interactive web dashboard.</li>
          </ul>
        </div>
      )}

      {/* TAB 3: MODEL & DATA SPECS */}
      {activeTab === 'features' && (
        <div style={{ background: '#ffffff', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', lineHeight: '1.6' }}>
          <h2 style={{ marginTop: '0', color: '#0f172a' }}>Feature Engineering & Condition Classes</h2>
          
          <h3 style={{ color: '#008080', marginTop: '20px' }}>Model Features</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong>Spårdjup max 15 & 17 (mm):</strong> Lateral rut deformation depth measurements across key tire tracking paths.
            </div>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong>ÅDT fordon:</strong> Annual Average Daily Traffic volume representing cumulative axle load stress.
            </div>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong>Pavement Age (`Pavement_Age`):</strong> Derived feature computed dynamically from construction year (`2026 - Beläggningsår`).
            </div>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong>Vägbredd & Hastighetsgräns:</strong> Road width (m) and posted speed limit (km/h) accounting for structural load distribution.
            </div>
          </div>

          <h3 style={{ color: '#008080', marginTop: '28px' }}>IRI Condition Thresholds</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlignment: 'left' }}>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>IRI Range (mm/m)</th>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Condition Class</th>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Interpretation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>&lt; 1.5 mm/m</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', color: '#166534', fontWeight: 'bold' }}>Excellent</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Smooth surface; minimal structural ride impairment.</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>1.5 – 3.0 mm/m</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', color: '#b45309', fontWeight: 'bold' }}>Acceptable</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Normal operational wear; regular monitoring advised.</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>&gt; 3.0 mm/m</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', color: '#991b1b', fontWeight: 'bold' }}>Poor</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>High surface roughness; maintenance intervention required.</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: CLOUD ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div style={{ background: '#ffffff', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', lineHeight: '1.6' }}>
          <h2 style={{ marginTop: '0', color: '#0f172a' }}>System & Infrastructure Architecture</h2>
          <p>
            The production system decouples user interface rendering from high-performance machine learning inference through a RESTful microservice architecture:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <div style={{ padding: '16px', borderLeft: '4px solid #008080', background: '#f8fafc', borderRadius: '4px' }}>
              <strong>Frontend Client (Vercel):</strong> Built with React (Vite) and hosted on Vercel's global CDN edge network for responsive user interaction and request validation.
            </div>

            <div style={{ padding: '16px', borderLeft: '4px solid #0284c7', background: '#f8fafc', borderRadius: '4px' }}>
              <strong>REST API Layer (AWS EC2):</strong> High-throughput FastAPI application running as a systemd background service on an AWS EC2 instance (`16.192.185.215:8000`). Handles CORS, schema parsing via Pydantic, and request validation.
            </div>

            <div style={{ padding: '16px', borderLeft: '4px solid #8b5cf6', background: '#f8fafc', borderRadius: '4px' }}>
              <strong>Machine Learning Pipeline:</strong> Serialized Scikit-Learn/Gradient Boosting artifacts (`artifacts/model.pkl`) trained on preprocessed Trafikverket dataset splits, performing real-time transformation and inference.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;