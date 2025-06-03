const NewReply = require('../../Domains/replies/entities/NewReply');

class AddReplyUseCase {
    constructor({ replyRepository, commentRepository, threadRepository }) {
        this._replyRepository = replyRepository;
        this._commentRepository = commentRepository;
        this._threadRepository = threadRepository;
    }

    async execute(useCasePayload, threadId, commentId, ownerId) {
        await this._threadRepository.verifyThreadExists(threadId);
        await this._commentRepository.verifyCommentExists(commentId); // Ensure comment exists and is not deleted

        const newReply = new NewReply(useCasePayload); // Validates content

        return this._replyRepository.addReply({
            content: newReply.content,
            commentId,
            owner: ownerId,
        });
    }
}

module.exports = AddReplyUseCase;