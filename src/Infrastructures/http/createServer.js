const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt'); // Added
const ClientError = require('../../Commons/exceptions/ClientError');
const DomainErrorTranslator = require('../../Commons/exceptions/DomainErrorTranslator');
const users = require('../../Interfaces/http/api/users');
const authentications = require('../../Interfaces/http/api/authentications');
const threads = require('../../Interfaces/http/api/threads'); // Added

const createServer = async (container) => {
  const server = Hapi.server({
    host: process.env.HOST,
    port: process.env.PORT,
    routes: { // Optional: good for CORS handling if needed later
      cors: {
        origin: ['*'], // Be more specific in production
      },
    },
  });

  // Register @hapi/jwt plugin for authentication (from package.json)
  await server.register(Jwt); // Added

  // Define authentication strategy
  server.auth.strategy('forumapi_jwt', 'jwt', { // Added
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      nbf: true,
      exp: true,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE || 3600, // e.g., 1 hour
    },
    validate: (artifacts, request, h) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
        username: artifacts.decoded.payload.username,
      },
    }),
  });

  await server.register([
    {
      plugin: users,
      options: { container },
    },
    {
      plugin: authentications,
      options: { container },
    },
    { // Added
      plugin: threads,
      options: { container },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      const translatedError = DomainErrorTranslator.translate(response);

      if (translatedError instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: translatedError.message,
        });
        newResponse.code(translatedError.statusCode);
        return newResponse;
      }

      if (!translatedError.isServer) {
        return h.continue;
      }

      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      console.error(response); // Log the original server error
      return newResponse;
    }

    return h.continue;
  });

  return server;
};

module.exports = createServer;