import express from 'express';

const app = express();

app.use(express.json());

app.get('/', (req, res) => res.send('Notification Service Running'));

// Example: Send notification (mock)
app.post('/notify', (req, res) => {
  // In real implementation, integrate with SMS/Email/Push provider
  res.json({ status: 'Notification sent', data: req.body });
});

const PORT = process.env.PORT || 4006;
app.listen(PORT, () => console.log(`Notification Service listening on port ${PORT}`));
