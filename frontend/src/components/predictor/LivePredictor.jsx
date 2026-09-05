import React, { useState } from 'react';
import { predictModuli } from '../../services/api';

function LivePredictor() {
  const [formData, setFormData] = useState({
    h1_cm: 18.75,
    h2_cm: 33.0,
    h3_cm: 70.72,
    bells_temp: 20.81,
    d0_target: 298.02,
    sci300_target: 104.92
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      h1_cm: parseFloat(formData.h1_cm),
      h2_cm: parseFloat(formData.h2_cm),
      h3_cm: parseFloat(formData.h3_cm),
      bells_temp: parseFloat(formData.bells_temp),
      d0_target: parseFloat(formData.d0_target),
      sci300_target: parseFloat(formData.sci300_target)
    };

    try {
      const data = await predictModuli(payload);
      setResult(data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object') {
        setError(JSON.stringify(detail));
      } else {
        setError(
          detail || 'Failed to communicate with FastAPI server.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="info-card">
      {/* TITLE */}
      <h2>
        🔮 Live Predictor — 4-Layer Moduli Surrogate
      </h2>

      {/* PURPOSE */}
      <div className="objective-box">
        <h3>Purpose of the Live Predictor</h3>
        <p>
          This Live Predictor demonstrates the integrated machine learning 
          prediction pipeline for structural pavement back-calculation.
        </p>
        <p>
          The interface takes structural and environmental inputs, sends them 
          to the deployed FastAPI backend, and retrieves the predicted moduli 
          ($E_1$–$E_4$) in real time.
        </p>
        <div className="note-box">
          <strong>Current workflow:</strong>
          <p>React → FastAPI (Render) → Random Forest Surrogate → $E_1$–$E_4$ Moduli</p>
        </div>
      </div>

      {/* INPUT DESCRIPTION */}
      <h3 className="sub-title">
        Surrogate Model Input Features
      </h3>
      <p className="paragraph">
        Enter the structural layer thicknesses, pavement temperature, and target 
        deflection responses to estimate layer moduli.
      </p>

      {/* PREDICTOR FORM */}
      <form onSubmit={handleSubmit}>
        <div className="predictor-grid">
          {/* H1 */}
          <div className="form-group">
            <label>Layer 1 Thickness (h1_cm):</label>
            <input
              type="number"
              step="any"
              name="h1_cm"
              value={formData.h1_cm}
              onChange={handleChange}
              required
            />
          </div>

          {/* H2 */}
          <div className="form-group">
            <label>Layer 2 Thickness (h2_cm):</label>
            <input
              type="number"
              step="any"
              name="h2_cm"
              value={formData.h2_cm}
              onChange={handleChange}
              required
            />
          </div>

          {/* H3 */}
          <div className="form-group">
            <label>Layer 3 Thickness (h3_cm):</label>
            <input
              type="number"
              step="any"
              name="h3_cm"
              value={formData.h3_cm}
              onChange={handleChange}
              required
            />
          </div>

          {/* BELLS TEMP */}
          <div className="form-group">
            <label>Pavement Temperature (bells_temp °C):</label>
            <input
              type="number"
              step="any"
              name="bells_temp"
              value={formData.bells_temp}
              onChange={handleChange}
              required
            />
          </div>

          {/* D0 TARGET */}
          <div className="form-group">
            <label>Target Deflection D0 (um):</label>
            <input
              type="number"
              step="any"
              name="d0_target"
              value={formData.d0_target}
              onChange={handleChange}
              required
            />
          </div>

          {/* SCI300 TARGET */}
          <div className="form-group">
            <label>Target SCI300 (um):</label>
            <input
              type="number"
              step="any"
              name="sci300_target"
              value={formData.sci300_target}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="predict-button"
        >
          {loading ? 'Calculating Moduli...' : 'Predict Layer Moduli'}
        </button>
      </form>

      {/* ERROR */}
      {error && (
        <div className="error-box">
          ⚠️ <strong>Error:</strong> {error}
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div className="result-box">
          <h3>Predicted Pavement Moduli</h3>
          <p>
            <strong>E1 (Asphalt Layer):</strong>{' '}
            <span className="prediction-value">
              {Number(result.E1_Asphalt_MPa).toFixed(2)} MPa
            </span>
          </p>
          <p>
            <strong>E2 (Base Layer):</strong>{' '}
            <span className="prediction-value">
              {Number(result.E2_Base_MPa).toFixed(2)} MPa
            </span>
          </p>
          <p>
            <strong>E3 (Subbase Layer):</strong>{' '}
            <span className="prediction-value">
              {Number(result.E3_Subbase_MPa).toFixed(2)} MPa
            </span>
          </p>
          <p>
            <strong>E4 (Subgrade):</strong>{' '}
            <span className="prediction-value">
              {Number(result.E4_Subgrade_MPa).toFixed(2)} MPa
            </span>
          </p>
        </div>
      )}
    </section>
  );
}

export default LivePredictor;