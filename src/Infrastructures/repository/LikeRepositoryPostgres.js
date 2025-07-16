const LikeRepository = require('../../Domains/likes/LikeRepository');

class LikeRepositoryPostgres extends LikeRepository {
    constructor(pool, idGenerator) { super(); this._pool = pool; this._idGenerator = idGenerator; }

    async addLike(commentId, owner) {
        const id = `like-${this._idGenerator()}`;
        const query = { text: 'INSERT INTO comment_likes (id, comment_id, owner) VALUES ($1, $2, $3)', values: [id, commentId, owner] };
        await this._pool.query(query);
    }

    async removeLike(commentId, owner) {
        const query = { text: 'DELETE FROM comment_likes WHERE comment_id = $1 AND owner = $2', values: [commentId, owner] };
        await this._pool.query(query);
    }

    async verifyLikeExists(commentId, owner) {
        const query = { text: 'SELECT id FROM comment_likes WHERE comment_id = $1 AND owner = $2', values: [commentId, owner] };
        const result = await this._pool.query(query);
        return result.rowCount > 0;
    }
}
module.exports = LikeRepositoryPostgres;