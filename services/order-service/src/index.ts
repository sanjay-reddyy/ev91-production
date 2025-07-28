import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/', (req, res) => res.send('Job Service Running'));

// Example: Get all jobs
app.get('/jobs', async (req, res) => {
  const jobs = await prisma.job.findMany();
  res.json(jobs);
});

const PORT = process.env.PORT || 4005;
app.listen(PORT, () => console.log(`Job Service listening on port ${PORT}`));
