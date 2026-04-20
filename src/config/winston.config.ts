import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

const logStreamName = `${new Date().toISOString().split('T')[0]}-${Date.now()}`;

const isProd = process.env.NODE_ENV === 'production';

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      level: isProd ? 'warn' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilities.format.nestLike(),
      ),
    }),

    ...(process.env.CLOUDWATCH_LOG_GROUP !== 'fleetnexa-local-dev'
      ? [
          new WinstonCloudWatch({
            logGroupName:
              process.env.CLOUDWATCH_LOG_GROUP || 'fleetnexa-server',
            logStreamName: logStreamName,
            awsRegion: process.env.AWS_REGION || 'us-east-1',
            jsonMessage: true,
          }),
        ]
      : []),
  ],
};
