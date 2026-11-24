const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");



const swaggerServerUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${process.env.PORT || 5001}`;


const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Reddy API",
      version: "1.0.0",
      description: "Use versioning for scalability and backward compatibility.",
    },
    servers: [
      {
        url: swaggerServerUrl,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../routes/**/*.js"),
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
