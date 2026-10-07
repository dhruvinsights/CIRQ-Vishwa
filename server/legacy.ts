/**
 * Domain engine only (no Vite, no static files). Listens on 127.0.0.1 so only the Python
 * backend can reach it. Remove route groups from api.ts as they are ported (docs/TODO.md).
 */
import express from 'express';
import { apiRouter } from './api.js';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use('/api/v1', apiRouter);

const PORT = Number(process.env.LEGACY_PORT) || 3001;
app.listen(PORT, '127.0.0.1', () => console.log(`[CIRQ legacy engine] http://127.0.0.1:${PORT}`));
