const NewComment = require('../../Domains/comments/entities/NewComment');

class AddCommentUseCase {
    constructor({ commentRepository, threadRepository }) {
        this._commentRepository = commentRepository;
        this._threadRepository = threadRepository;
    }

    async execute(useCasePayload, threadId, ownerId) {
        await this._threadRepository.verifyThreadExists(threadId);
        const newComment = new NewComment(useCasePayload); // Validates content

        return this._commentRepository.addComment({
            content: newComment.content,
            threadId,
            owner: ownerId,
        });
    }
}

module.exports = AddCommentUseCase;