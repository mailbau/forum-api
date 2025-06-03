class ReplyRepository {
    async addReply(addReplyPayload) {
        // addReplyPayload = { content, commentId, owner }
        throw new Error('REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }

    async verifyReplyOwner(replyId, ownerId) {
        throw new Error('REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }

    async deleteReplyById(replyId) {
        throw new Error('REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }

    async getRepliesByCommentId(commentId) {
        throw new Error('REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }

    // Optional: verifyReplyExists might be useful later
    // async verifyReplyExists(replyId) {
    //   throw new Error('REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    // }
}

module.exports = ReplyRepository;