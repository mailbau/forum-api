class ToggleCommentLikeUseCase {
    constructor({ likeRepository, commentRepository, threadRepository }) {
        this._likeRepository = likeRepository;
        this._commentRepository = commentRepository;
        this._threadRepository = threadRepository;
    }

    async execute(threadId, commentId, owner) {
        await this._threadRepository.verifyThreadExists(threadId);
        await this._commentRepository.verifyCommentExists(commentId);
        const isLiked = await this._likeRepository.verifyLikeExists(commentId, owner);

        if (isLiked) {
            await this._likeRepository.removeLike(commentId, owner);
        } else {
            await this._likeRepository.addLike(commentId, owner);
        }
    }
}
module.exports = ToggleCommentLikeUseCase;