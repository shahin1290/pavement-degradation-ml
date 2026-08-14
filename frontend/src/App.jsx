import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [activeTab, setActiveTab] = useState('predictor');
  
  const [formData, setFormData] = useState({
    sci300: 115.91,
    aadt: 15140,
    bells_temp: 28.41172,
    layer_1_thk: 0.089455
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
    // const API_BASE_URL = 'http://127.0.0.1:8000';

    const payload = {
      sci300: parseFloat(formData.sci300),
      aadt: parseFloat(formData.aadt),
      bells_temp: parseFloat(formData.bells_temp),
      layer_1_thk: parseFloat(formData.layer_1_thk)
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
    <div style={{ maxWidth: '850px', margin: '40px auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#222', padding: '0 20px', textAlign: 'left' }}>
      
      {/* Header Banner */}
      <header style={{ paddingBottom: '20px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#0f172a' }}>Trafikverket Structural Pavement AI Dashboard</h1>
        <p style={{ margin: '0', fontSize: '15px', color: '#64748b' }}>
          Machine Learning Infrastructure for Pavement Structural-Response Prediction
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
          📊 Model & Evaluation Specs
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
{/* TAB 1: LIVE PREDICTOR FORM */}
{activeTab === 'predictor' && (
  <div
    style={{
      background: '#ffffff',
      padding: '30px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      textAlign: 'left'
    }}
  >
    <h2
      style={{
        margin: '0 0 20px 0',
        fontSize: '20px',
        color: '#0f172a'
      }}
    >
      Evaluate Pavement Structural Response
    </h2>

    <form onSubmit={handleSubmit}>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '18px',
          marginBottom: '20px'
        }}
      >

        {/* SCI300 */}
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: '600',
              fontSize: '14px',
              marginBottom: '6px'
            }}
          >
            SCI300 (TSD structural-response index):
          </label>

          <input
            type="number"
            step="any"
            name="sci300"
            value={formData.sci300}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* AADT */}
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: '600',
              fontSize: '14px',
              marginBottom: '6px'
            }}
          >
            AADT (vehicles/day):
          </label>

          <input
            type="number"
            step="any"
            name="aadt"
            value={formData.aadt}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* BELLS TEMP */}
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: '600',
              fontSize: '14px',
              marginBottom: '6px'
            }}
          >
            Pavement Temperature / BELLS_TEMP (°C):
          </label>

          <input
            type="number"
            step="any"
            name="bells_temp"
            value={formData.bells_temp}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* LAYER 1 THICKNESS */}
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: '600',
              fontSize: '14px',
              marginBottom: '6px'
            }}
          >
            Layer 1 Thickness (m):
          </label>

          <input
            type="number"
            step="any"
            name="layer_1_thk"
            value={formData.layer_1_thk}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box'
            }}
          />
        </div>

      </div>

      {/* SUBMIT BUTTON */}
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
        {loading
          ? 'Processing Structural AI...'
          : 'Predict D0000'}
      </button>

    </form>

    {/* ERROR */}
    {error && (
      <div
        style={{
          marginTop: '20px',
          padding: '12px 16px',
          background: '#fef2f2',
          borderLeft: '4px solid #ef4444',
          color: '#991b1b',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      >
        ⚠️ <strong>Error:</strong> {error}
      </div>
    )}

    {/* RESULT */}
    {result && (
      <div
        style={{
          marginTop: '25px',
          padding: '20px',
          background: '#f0fdf4',
          borderRadius: '8px',
          borderLeft: '6px solid #008080',
          border: '1px solid #bbf7d0'
        }}
      >
        <h3
          style={{
            margin: '0 0 10px 0',
            fontSize: '18px',
            color: '#166534'
          }}
        >
          Model Analysis Output
        </h3>

        <p
          style={{
            margin: '6px 0',
            fontSize: '15px'
          }}
        >
          <strong>Predicted D0000:</strong>{' '}
          <span
            style={{
              fontSize: '18px',
              color: '#008080',
              fontWeight: 'bold'
            }}
          >
            {result.predicted_d0000}
          </span>
        </p>
      </div>
    )}

  </div>
)}

      {/* TAB 2: PROJECT OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ background: '#ffffff', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', lineHeight: '1.6', textAlign: 'left' }}>
          <h2 style={{ marginTop: '0', color: '#0f172a' }}>Thesis Project Context & Objectives</h2>
          <p>
            Maintaining public road networks requires scalable data-driven methods to characterize pavement structural response. This thesis prototype focuses on an operational machine learning pipeline that predicts <strong>D0000</strong>, a TSD structural-response variable, using Swedish road data provided by <strong>Trafikverket</strong>.
          </p>
          
          <h3 style={{ color: '#008080', marginTop: '24px' }}>Core Objectives</h3>
          <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
            <li style={{ marginBottom: '8px' }}><strong>Predictive Deterioration Modeling:</strong> Model non-linear relationships between traffic loading, pavement age, geometry, and surface rutting to predict right wheel track roughness (<code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>IRI höger</code>).</li>
            <li style={{ marginBottom: '8px' }}><strong>Proactive Maintenance Decision Support:</strong> Provide actionable metrics to assist road authorities (e.g., VTI, Trafikverket) in transitioning from reactive repairs to optimized lifecycle maintenance.</li>
            <li style={{ marginBottom: '8px' }}><strong>End-to-End Cloud Deployment:</strong> Bridge research and production by hosting an inference API on AWS EC2 linked directly to an interactive web dashboard.</li>
          </ul>
        </div>
      )}

      {/* TAB 3: MODEL & EVALUATION SPECS */}
      {activeTab === 'features' && (
        <>
       <h3 style={{ color: '#008080', marginTop: '28px' }}>Model Benchmark Comparison</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Model Architecture</th>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>R² Score</th>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>MAE (mm/m)</th>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>RMSE (mm/m)</th>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: '600' }}>Linear Regression (Vanilla)</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>28.1%</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>0.942</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>1.333</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Baseline</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: '600' }}>Lasso Regression (L1)</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>26.4%</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>0.930</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>1.349</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Baseline</td>
              </tr>
             <tr>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: '600' }}>Ridge Regression (L2)</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>28.1%</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>0.942</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>1.333</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Baseline</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: '600' }}>Gradient Boosting (Baseline)</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>45.6%</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>0.742</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>1.160</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Evaluated</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: '600' }}>HistGradientBoosting</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>48.5%</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>0.713</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>1.128</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Evaluated</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: '600' }}>Random Forest (Baseline)</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>49.2%</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>0.700</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>1.121</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Evaluated</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: '600' }}>Gradient Boosting (Tuned)</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>49.4%</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>0.705</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>1.118</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Candidate</td>
              </tr>
              <tr style={{ background: '#f0fdf4' }}>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#166534' }}>Random Forest (Tuned)</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>50.7%</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>0.691</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>1.103</td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#008080' }}>Best Model</td>
              </tr>
            </tbody>
          </table>
          </>
      )}

      {/* TAB 4: CLOUD ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div style={{ background: '#ffffff', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', lineHeight: '1.6', textAlign: 'left' }}>
          <h2 style={{ marginTop: '0', color: '#0f172a' }}>System & Infrastructure Architecture</h2>
          <p>
            The production system decouples user interface rendering from high-performance machine learning inference through a RESTful microservice architecture:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <div style={{ padding: '16px', borderLeft: '4px solid #008080', background: '#f8fafc', borderRadius: '4px' }}>
              <strong>Frontend Client (Vercel):</strong> Built with React (Vite) and hosted on Vercel's global CDN edge network for responsive user interaction and request validation.
            </div>

            <div style={{ padding: '16px', borderLeft: '4px solid #0284c7', background: '#f8fafc', borderRadius: '4px' }}>
              <strong>REST API Layer (AWS EC2):</strong> High-throughput FastAPI application running as a systemd background service on an AWS EC2 instance (<code style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: '3px' }}>16.192.185.215:8000</code>). Handles CORS, schema parsing via Pydantic, and request validation.
            </div>

            <div style={{ padding: '16px', borderLeft: '4px solid #8b5cf6', background: '#f8fafc', borderRadius: '4px' }}>
              <strong>Machine Learning Pipeline:</strong> Serialized Scikit-Learn/Gradient Boosting artifacts (<code style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: '3px' }}>artifacts/model.pkl</code>) trained on preprocessed Trafikverket dataset splits, performing real-time transformation and inference.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;