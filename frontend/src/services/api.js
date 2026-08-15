import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || '';

export async function predictD0000(payload) {

  const response = await axios.post(
    `${API_BASE_URL}/api/predict`,
    payload
  );

  return response.data;
}