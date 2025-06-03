const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');

class DeleteReplyUseCase {
    constructor({ replyRepository, commentRepository, threadRepository }) {
        this._replyRepository = replyRepository;
        this._commentRepository = commentRepository;
        this._threadRepository = threadRepository;
    }

    async execute(threadId, commentId, replyId, ownerId) {
        // 1. Verify thread exists
        await this._threadRepository.verifyThreadExists(threadId);

        // 2. Verify comment exists (and is not deleted)
        await this._commentRepository.verifyCommentExists(commentId);

        // 3. Verify reply owner (which also implies reply existence and not already deleted)
        await this._replyRepository.verifyReplyOwner(replyId, ownerId);

        // 4. Soft delete the reply
        await this._replyRepository.deleteReplyById(replyId);
    }
}

module.exports = DeleteReplyUseCase;