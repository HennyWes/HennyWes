import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import freeTrialRouter from './routes/free-trial.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/free-trial', freeTrialRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
