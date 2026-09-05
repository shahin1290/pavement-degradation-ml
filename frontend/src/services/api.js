import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://pavement-degradation-ml.onrender.com';

export async function predictModuli(payload) {
  const response = await axios.post(
    `${API_BASE_URL}/api/predict`,
    payload
  );

  return response.data;
}