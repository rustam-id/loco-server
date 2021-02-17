import expressLoader from './express';
import mongooseLoader from './mongoose';
import express from 'express';
import Logger from '../utils/logger';

export default async ({ expressApp }: { expressApp: express.Application }): Promise<void> => {
    try {
        const mongoConnection = await mongooseLoader();
        Logger.info('MongoDB successfully connected');
    } catch (error) {
        Logger.error(`loaders.index: MongoDB connection error: ${error}`);
    }

    await expressLoader({ app: expressApp });
    Logger.info('Express services loaded');
    
};