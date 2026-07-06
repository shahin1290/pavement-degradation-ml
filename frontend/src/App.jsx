import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [formData, setFormData] = useState({
    spardjup: 4.5,
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

    try {
      const response = await axios.post('http://localhost:8000/api/predict', {
        spardjup: parseFloat(formData.spardjup),
        adt_fordon: parseInt(formData.adt_fordon),
        belaggningsar: parseInt(formData.belaggningsar),
        hastighet: parseInt(formData.hastighet),
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to communicate with FastAPI server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', fontFamily: 'system-ui, sans-serif', padding: '25px', border: '1px solid #ddd', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>Road Degradation IRI Predictor</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontWeight: '500' }}>Rut Depth / Spårdjup max 15 (mm): </label>
          <input type="number" step="0.1" name="spardjup" value={formData.spardjup} onChange={handleChange} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontWeight: '500' }}>Traffic Volume / ÅDT fordon: </label>
          <input type="number" name="adt_fordon" value={formData.adt_fordon} onChange={handleChange} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontWeight: '500' }}>Construction Year / Beläggningsår: </label>
          <input type="number" name="belaggningsar" value={formData.belaggningsar} onChange={handleChange} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: '500' }}>Speed Limit / Hastighetsgräns (km/h): </label>
          <input type="number" name="hastighet" value={formData.hastighet} onChange={handleChange} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#008080', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
          {loading ? 'Processing Model...' : 'Calculate IRI Prediction'}
        </button>
      </form>

      {error && <div style={{ color: '#d9534f', marginTop: '20px', fontWeight: 'bold' }}>⚠️ Error: {error}</div>}

      {result && (
        <div style={{ marginTop: '25px', padding: '15px', background: '#f9f9f9', borderRadius: '6px', borderLeft: '6px solid #008080' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Analysis Output:</h3>
          <p style={{ margin: '5px 0' }}><strong>Predicted IRI Roughness:</strong> {result.predicted_iri} mm/m</p>
          <p style={{ margin: '5px 0' }}><strong>Pavement Condition Class:</strong> {result.condition}</p>
        </div>
      )}
    </div>
  );
}

export default App;