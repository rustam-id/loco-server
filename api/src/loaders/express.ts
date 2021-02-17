import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from '../routes';
import { requestsLogger, requestsErrorHandler } from '../middlewares/loggerMW';
import { accesByIPHandler } from '../middlewares/privateMW';

export default async ({ app }: { app: express.Application }) => {
  app.use(cors());
  app.use(bodyParser.json());
  app.use(accesByIPHandler);
  app.use(requestsLogger);
  app.use(routes);
  app.use(requestsErrorHandler);
};