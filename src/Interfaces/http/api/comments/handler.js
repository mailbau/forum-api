const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');
const DeleteCommentUseCase = require('../../../../Applications/use_case/DeleteCommentUseCase');

class CommentsHandler {
    constructor(container) {
        this._container = container;
        this.postCommentHandler = this.postCommentHandler.bind(this);
        this.deleteCommentHandler = this.deleteCommentHandler.bind(this);
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

    async deleteCommentHandler(request, h) {
        const deleteCommentUseCase = this._container.getInstance(DeleteCommentUseCase.name);
        const { id: ownerId } = request.auth.credentials;
        const { threadId, commentId } = request.params;

        await deleteCommentUseCase.execute(threadId, commentId, ownerId);

        return h.response({
            status: 'success',
        }).code(200);
    }

    async postReplyHandler(request, h) { // Added
        const addReplyUseCase = this._container.getInstance(AddReplyUseCase.name);
        const { id: ownerId } = request.auth.credentials;
        const { threadId, commentId } = request.params;
        const addedReply = await addReplyUseCase.execute(request.payload, threadId, commentId, ownerId);

        const response = h.response({
            status: 'success',
            data: {
                addedReply,
            },
        });
        response.code(201);
        return response;
    }
}


module.exports = CommentsHandler;