import * as express from 'express';
import * as axios from 'axios';
import * as moment from 'moment';

interface IAPIAnalysis {
  name: string;
  responseTime: number;
  statusCode: number;
  success: boolean;
  timestamp: string;
}

interface IAPIConfig {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: { [key: string]: string };
  data?: any;
}

class APIServiceAnalyzer {
  private app: express.Application;
  private apiConfigs: IAPIConfig[];

  constructor(apiConfigs: IAPIConfig[]) {
    this.apiConfigs = apiConfigs;
    this.app = express();
    this.app.use(express.json());

    this.app.get('/analyze', (req, res) => {
      const analysisResults: IAPIAnalysis[] = [];

      apiConfigs.forEach((apiConfig) => {
        axios({
          method: apiConfig.method,
          url: apiConfig.url,
          headers: apiConfig.headers,
          data: apiConfig.data,
        })
          .then((response) => {
            const analysis: IAPIAnalysis = {
              name: apiConfig.name,
              responseTime: moment().diff(moment(response.config.metadata.start), 'milliseconds'),
              statusCode: response.status,
              success: response.status >= 200 && response.status < 300,
              timestamp: moment().toISOString(),
            };
            analysisResults.push(analysis);
          })
          .catch((error) => {
            const analysis: IAPIAnalysis = {
              name: apiConfig.name,
              responseTime: moment().diff(moment(error.config.metadata.start), 'milliseconds'),
              statusCode: error.response ? error.response.status : 500,
              success: false,
              timestamp: moment().ISOString(),
            };
            analysisResults.push(analysis);
          });
      });

      setTimeout(() => {
        res.json(analysisResults);
      }, 5000); // wait for all API requests to complete
    });

    this.app.listen(3000, () => {
      console.log('API Service Analyzer listening on port 3000');
    });
  }
}

const apiConfigs: IAPIConfig[] = [
  {
    name: 'Google API',
    url: 'https://www.googleapis.com/customsearch/v1',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      key: 'YOUR_API_KEY',
      cx: 'YOUR_CSE_ID',
      q: 'test',
    },
  },
  {
    name: 'Twitter API',
    url: 'https://api.twitter.com/1.1/statuses/user_timeline.json',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_BEARER_TOKEN',
    },
    data: {
      screen_name: 'twitter',
      count: 10,
    },
  },
];

new APIServiceAnalyzer(apiConfigs);