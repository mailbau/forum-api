// src/Interfaces/http/api/comments/routes.js
const routes = (handler) => ([
    {
        method: 'POST',
        path: '/threads/{threadId}/comments', // Path remains the same, reflecting resource hierarchy
        handler: handler.postCommentHandler,  // But uses the new CommentsHandler
        options: {
            auth: 'forumapi_jwt',
        },
    },
    {
        method: 'DELETE',
        path: '/threads/{threadId}/comments/{commentId}',
        handler: handler.deleteCommentHandler,
        options: {
            auth: 'forumapi_jwt',
        },
    },
    {
        method: 'POST',
        path: '/threads/{threadId}/comments/{commentId}/replies',
        handler: handler.postReplyHandler,
        options: {
            auth: 'forumapi_jwt',
        },
    },
    {
        method: 'DELETE',
        path: '/threads/{threadId}/comments/{commentId}/replies/{replyId}',
        handler: handler.deleteReplyHandler,
        options: {
            auth: 'forumapi_jwt',
        },
    },
]);

module.exports = routes;