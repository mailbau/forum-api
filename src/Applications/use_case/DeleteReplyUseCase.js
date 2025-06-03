const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');

class DeleteReplyUseCase {
    constructor({ replyRepository, commentRepository, threadRepository }) {
        this._replyRepository = replyRepository;
        this._commentRepository = commentRepository;
        this._threadRepository = threadRepository;
    }

    async execute(threadId, commentId, replyId, ownerId) {
        await this._threadRepository.verifyThreadExists(threadId);

        await this._commentRepository.verifyCommentExists(commentId);

        await this._replyRepository.verifyReplyOwner(replyId, ownerId);

        await this._replyRepository.deleteReplyById(replyId);
    }
}

module.exports = DeleteReplyUseCase;