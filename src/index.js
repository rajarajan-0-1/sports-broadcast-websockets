import express, { json } from 'express';
import { matchRouter } from './routes/matches.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.use('/api/matches', matchRouter);

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});