import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('https://server-seven-puce-23.vercel.app/api/health');
    console.log('STATUS:', res.status);
    console.log('HEADERS:', res.headers);
    console.log('BODY:', res.data);
  } catch (err) {
    console.log('ERROR STATUS:', err.response?.status);
    console.log('ERROR HEADERS:', err.response?.headers);
    console.log('ERROR BODY:', err.response?.data);
  }
}

test();
