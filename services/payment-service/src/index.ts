import express from 'express';
import paymentRoutes from './routes/payment';

const app = express();
app.use(express.json());

app.use('/payment', paymentRoutes);

app.get('/', (req, res) => res.send('Payment Service Running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Payment Service listening on port ${PORT}`));
