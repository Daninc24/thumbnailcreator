import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Thumbnail Generator API',
      version: '1.0.0',
      description: 'AI-powered thumbnail and video creation platform API',
      contact: {
        name: 'API Support',
        email: 'support@thumbnailgenerator.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.thumbnailgenerator.com' 
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['user', 'admin'] },
            subscription: {
              type: 'object',
              properties: {
                plan: { type: 'string', enum: ['free', 'pro', 'premium'] },
                quota: { type: 'number' },
                used: { type: 'number' },
                expiresAt: { type: 'string', format: 'date-time' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            paymentMethod: { type: 'string', enum: ['stripe', 'mpesa'] },
            amount: { type: 'number' },
            currency: { type: 'string', enum: ['usd', 'kes'] },
            plan: { type: 'string', enum: ['pro', 'premium'] },
            status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [
      { bearerAuth: [] },
      { cookieAuth: [] },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };