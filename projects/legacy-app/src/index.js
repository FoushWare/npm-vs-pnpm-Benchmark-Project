import _ from 'lodash';
import moment from 'moment';
import axios from 'axios';
import Promise from 'bluebird';

function processData(data) {
  return _.map(data, item => ({
    ...item,
    processed: true,
    timestamp: moment().toISOString()
  }));
}

async function fetchData(url) {
  return Promise.resolve(axios.get(url));
}

export { processData, fetchData };

console.log('Legacy app initialized');