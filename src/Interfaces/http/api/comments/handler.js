const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');
const DeleteCommentUseCase = require('../../../../Applications/use_case/DeleteCommentUseCase');
const AddReplyUseCase = require('../../../../Applications/use_case/AddReplyUseCase');
const DeleteReplyUseCase = require('../../../../Applications/use_case/DeleteReplyUseCase');
const ToggleCommentLikeUseCase = require('../../../../Applications/use_case/ToggleCommentLikeUseCase');

class CommentsHandler {
    constructor(container) {
        this._container = container;
        this.postCommentHandler = this.postCommentHandler.bind(this);
        this.deleteCommentHandler = this.deleteCommentHandler.bind(this);
        this.postReplyHandler = this.postReplyHandler.bind(this);
        this.deleteReplyHandler = this.deleteReplyHandler.bind(this);
        this.putCommentLikeHandler = this.putCommentLikeHandler.bind(this);
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

    async deleteReplyHandler(request, h) { // Added
        const deleteReplyUseCase = this._container.getInstance(DeleteReplyUseCase.name);
        const { id: ownerId } = request.auth.credentials;
        const { threadId, commentId, replyId } = request.params;

        await deleteReplyUseCase.execute(threadId, commentId, replyId, ownerId);

        return h.response({
            status: 'success',
        }).code(200);
    }

    async putCommentLikeHandler(request, h) {
        const toggleCommentLikeUseCase = this._container.getInstance(ToggleCommentLikeUseCase.name);
        const { id: ownerId } = request.auth.credentials;
        const { threadId, commentId } = request.params;

        await toggleCommentLikeUseCase.execute(threadId, commentId, ownerId);
        return h.response({
            status: 'success',
        }).code(200);
    }
}


module.exports = CommentsHandler;