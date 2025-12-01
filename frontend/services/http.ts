import axios from 'axios';

// const base = (process.env.BACKEND_URL && !process.env.BACKEND_URL.includes('__APP_'))
//   ? `${process.env.BACKEND_URL}/api`
//   : '/api';

const http = axios.create({
  baseURL: process.env.API_ORIGIN,
  withCredentials: true,
  headers: { Accept: 'application/json' }
});

export default http;
