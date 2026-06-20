import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../services/db.js';

const router = Router();

router.post('/', async (req, res) => {
  const { submitter_email, target_niche, target_location, submitter_website } = req.body;

  if (!submitter_email || !target_niche || !target_location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = uuidv4();
  const status = 'pending';

  try {
    const sql = `INSERT INTO free_trials (id, submitter_email, target_niche, target_location, submitter_website, status) VALUES ('${id}', '${submitter_email}', '${target_niche}', '${target_location}', '${submitter_website || ''}', '${status}')`;
    db.query(sql);

    res.status(201).json({ id, status });
  } catch (error) {
    console.error('Failed to submit free trial:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
