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


      {/* =====================================================
          TITLE
      ====================================================== */}

      <h2>
        🔮 Live Predictor — Prototype
      </h2>


      {/* =====================================================
          PURPOSE
      ====================================================== */}

      <div className="objective-box">

        <h3>
          Purpose of the Live Predictor
        </h3>

        <p>
          This Live Predictor is a prototype used to
          demonstrate the complete machine learning
          prediction and deployment workflow.
        </p>

        <p>
          The prototype allows pavement-related input
          variables to be entered through the React
          interface. The data are sent to the FastAPI
          backend, which passes the inputs to the trained
          machine learning model and returns the prediction.
        </p>


        <div className="note-box">

          <strong>
            Current prototype workflow:
          </strong>

          <p>
            React → FastAPI → ML Model → Prediction
          </p>

        </div>

      </div>


      {/* =====================================================
          CURRENT PROTOTYPE
      ====================================================== */}

      <div className="note-box">

        <strong>
          Current Status:
        </strong>

        <p>
          The current predictor is a technical prototype.
          It is being used to test the connection between
          the machine learning model, FastAPI backend and
          React web interface.
        </p>

        <p>
          The current D0000 prediction is not the final
          project target. The final prediction target will
          be defined after the ERAPave analytical
          back-calculation data become available.
        </p>

      </div>


      {/* =====================================================
          INPUT DESCRIPTION
      ====================================================== */}

      <h3 className="sub-title">
        Prototype Input Variables
      </h3>


      <p className="paragraph">

        The current prototype uses a small set of pavement
        variables to demonstrate real-time model prediction.

        The final AI model will use the project-defined
        input variables and ERAPave/back-calculated targets.

      </p>


      {/* =====================================================
          PREDICTOR FORM
      ====================================================== */}

      <form onSubmit={handleSubmit}>

        <div className="predictor-grid">


          {/* SCI300 */}

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


          {/* AADT */}

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


          {/* TEMPERATURE */}

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


          {/* LAYER THICKNESS */}

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


        {/* =================================================
            BUTTON
        ================================================== */}

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


      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="error-box">

          ⚠️ <strong>Error:</strong>{' '}

          {error}

        </div>

      )}


      {/* =====================================================
          RESULT
      ====================================================== */}

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


      {/* =====================================================
          FINAL PROJECT DIRECTION
      ====================================================== */}

      <div className="objective-box">

        <h3>
          Final Project Direction
        </h3>

        <p>
          The final AI system is intended to use
          field and pavement information as inputs
          and predict pavement layer characteristics
          obtained from analytical back-calculation.
        </p>


        <div className="note-box">

          <strong>
            Planned final workflow:
          </strong>

          <p>
            TSD + Pavement Structure + Traffic +
            Environmental Conditions
          </p>

          <p>
            ↓
          </p>

          <p>
            ERAPave / MLET Back-Calculation
          </p>

          <p>
            ↓
          </p>

          <p>
            Best-Fitting Layer Characteristics
          </p>

          <p>
            ↓
          </p>

          <p>
            AI Training
          </p>

          <p>
            ↓
          </p>

          <p>
            Rapid AI Estimation for New Road Sections
          </p>

        </div>

      </div>


    </section>

  );
}


export default LivePredictor;