const routes = (handler) => ([
    {
        method: 'POST',
        path: '/threads',
        handler: handler.postThreadHandler,
        options: {
            auth: 'forumapi_jwt', // Apply the JWT authentication strategy
        },
    },
    // ... other thread routes can be added here later
]);

module.exports = routes;