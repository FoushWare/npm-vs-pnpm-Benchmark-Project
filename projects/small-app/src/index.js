import _ from 'lodash';
import axios from 'axios';
import { z } from 'zod';
import dayjs from 'dayjs';

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

function processData(data) {
  return _.map(data, item => ({
    ...item,
    processed: true,
    timestamp: dayjs().toISOString()
  }));
}

async function fetchUser(id) {
  const response = await axios.get(`https://api.example.com/users/${id}`);
  return userSchema.parse(response.data);
}

export { processData, fetchUser };

console.log('Small app initialized');