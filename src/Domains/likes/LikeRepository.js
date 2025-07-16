class LikeRepository {
    async addLike(commentId, owner) { throw new Error('LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED'); }
    async removeLike(commentId, owner) { throw new Error('LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED'); }
    async verifyLikeExists(commentId, owner) { throw new Error('LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED'); }
}
module.exports = LikeRepository;