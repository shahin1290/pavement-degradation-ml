import React, { useState } from 'react';

import { predictD0000 } from '../../services/api';

function LivePredictor() {

  const [formData, setFormData] = useState({
    sci300: 115.91,
    aadt: 15140,
    bells_temp: 28.41172,
    layer_1_thk: 0.089455
  });

  const [result, setResult] = useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);


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
      sci300: parseFloat(formData.sci300),
      aadt: parseFloat(formData.aadt),
      bells_temp: parseFloat(formData.bells_temp),
      layer_1_thk: parseFloat(formData.layer_1_thk)
    };

    try {

      const data =
        await predictD0000(payload);

      setResult(data);

    } catch (err) {

      const detail =
        err.response?.data?.detail;

      if (typeof detail === 'object') {

        setError(
          JSON.stringify(detail)
        );

      } else {

        setError(
          detail ||
          'Failed to communicate with FastAPI server.'
        );

      }

    } finally {

      setLoading(false);

    }
  };


  return (

    <section className="info-card">

      <h2>
        Evaluate Pavement Structural Response
      </h2>

      <form onSubmit={handleSubmit}>

        <div className="predictor-grid">

          <div className="form-group">

            <label>
              SCI300 (TSD structural-response index):
            </label>

            <input
              type="number"
              step="any"
              name="sci300"
              value={formData.sci300}
              onChange={handleChange}
              required
            />

          </div>


          <div className="form-group">

            <label>
              AADT (vehicles/day):
            </label>

            <input
              type="number"
              step="any"
              name="aadt"
              value={formData.aadt}
              onChange={handleChange}
              required
            />

          </div>


          <div className="form-group">

            <label>
              Pavement Temperature /
              BELLS_TEMP (°C):
            </label>

            <input
              type="number"
              step="any"
              name="bells_temp"
              value={formData.bells_temp}
              onChange={handleChange}
              required
            />

          </div>


          <div className="form-group">

            <label>
              Layer 1 Thickness (m):
            </label>

            <input
              type="number"
              step="any"
              name="layer_1_thk"
              value={formData.layer_1_thk}
              onChange={handleChange}
              required
            />

          </div>

        </div>


        <button
          type="submit"
          disabled={loading}
          className="predict-button"
        >
          {loading
            ? 'Processing Structural AI...'
            : 'Predict D0000'}
        </button>

      </form>


      {error && (

        <div className="error-box">

          ⚠️ <strong>Error:</strong>{' '}
          {error}

        </div>

      )}


      {result && (

        <div className="result-box">

          <h3>
            Model Analysis Output
          </h3>

          <p>

            <strong>
              Predicted D0000:
            </strong>{' '}

            <span className="prediction-value">

              {Number(
                result.predicted_d0000
              ).toFixed(2)}

            </span>

          </p>

        </div>

      )}

    </section>

  );
}

export default LivePredictor;