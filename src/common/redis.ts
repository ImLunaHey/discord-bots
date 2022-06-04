import { config } from 'dotenv';
import { Client } from 'redis-om';

// Load .env
config();

const url = process.env.REDIS_URL;
export const client = await new Client().open(url);
