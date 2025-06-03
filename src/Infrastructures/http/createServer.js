const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const ClientError = require('../../Commons/exceptions/ClientError');
const DomainErrorTranslator = require('../../Commons/exceptions/DomainErrorTranslator');
const users = require('../../Interfaces/http/api/users');
const authentications = require('../../Interfaces/http/api/authentications');
const threads = require('../../Interfaces/http/api/threads');
const comments = require('../../Interfaces/http/api/comments');

const createServer = async (container) => {
  const server = Hapi.server({
    host: process.env.HOST,
    port: process.env.PORT,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register(Jwt);

  server.auth.strategy('forumapi_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      nbf: true,
      exp: true,
      maxAgeSec: parseInt(process.env.ACCESS_TOKEN_AGE || '3600', 10),
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
    {
      plugin: threads,
      options: { container },
    },
    {
      plugin: comments,
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

      if (response.isBoom && response.isServer) { // Check if it's a Boom server error
        console.error('------ Original Server Error Start ------');
        console.error(response.stack || response.message || response); // Log stack or message of the Boom error
        if (response.data) {
          console.error('Wrapped Error Data:', response.data);
        }
        if (response.output && response.output.payload && response.output.payload.message !== 'An internal server error occurred') {
          console.error('Boom Payload Message:', response.output.payload.message);
        }
        console.error('------ Original Server Error End ------');

        const newResponse = h.response({
          status: 'error',
          message: 'terjadi kegagalan pada server kami',
        });
        newResponse.code(500);
        return newResponse;
      }

      if (!translatedError.isServer) {
        return h.continue; // Let Hapi handle other client errors (like 404 for truly unmatched routes)
      }

      console.error('------ Unhandled Application Error Start ------');
      console.error(response.stack || response.message || response); // Log the actual error
      console.error('------ Unhandled Application Error End ------');
      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami (unexpected)',
      });
      newResponse.code(500);
      return newResponse;

    }

    return h.continue;
  });

  return server;
};

module.exports = createServer;