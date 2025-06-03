const CommentsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
    name: 'comments', // Plugin name
    register: async (server, { container }) => {
        const commentsHandler = new CommentsHandler(container);
        server.route(routes(commentsHandler));
    },
};