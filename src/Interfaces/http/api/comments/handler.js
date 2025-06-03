// src/Interfaces/http/api/comments/handler.js
const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');

class CommentsHandler {
    constructor(container) {
        this._container = container;
        this.postCommentHandler = this.postCommentHandler.bind(this);
        // Bind other comment handlers here if you add them later
    }

    async postCommentHandler(request, h) {
        const addCommentUseCase = this._container.getInstance(AddCommentUseCase.name);
        const { id: ownerId } = request.auth.credentials;
        const { threadId } = request.params; // Get threadId from path parameters
        const addedComment = await addCommentUseCase.execute(request.payload, threadId, ownerId);

        const response = h.response({
            status: 'success',
            data: {
                addedComment,
            },
        });
        response.code(201);
        return response;
    }

    // You can add other comment-specific handlers here in the future, e.g.:
    // async deleteCommentHandler(request, h) { /* ... */ }
}

module.exports = CommentsHandler;