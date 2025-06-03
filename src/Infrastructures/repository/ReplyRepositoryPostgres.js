const AddedReply = require('../../Domains/replies/entities/AddedReply');
const ReplyRepository = require('../../Domains/replies/ReplyRepository');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');

class ReplyRepositoryPostgres extends ReplyRepository {
    constructor(pool, idGenerator) {
        super();
        this._pool = pool;
        this._idGenerator = idGenerator;
    }

    async addReply(addReplyPayload) {
        const { content, commentId, owner } = addReplyPayload;
        const id = `reply-${this._idGenerator()}`;

        const query = {
            text: 'INSERT INTO replies(id, content, owner, comment_id) VALUES($1, $2, $3, $4) RETURNING id, content, owner',
            values: [id, content, owner, commentId],
        };

        const result = await this._pool.query(query);
        return new AddedReply({ ...result.rows[0] });
    }

    async getRepliesByCommentId(commentId) {
        const query = {
            text: `
            SELECT
              replies.id,
              users.username,
              replies.date,
              replies.content,
              replies.is_deleted
            FROM replies
            INNER JOIN users ON replies.owner = users.id
            WHERE replies.comment_id = $1
            ORDER BY replies.date ASC
          `,
            values: [commentId],
        };
        const result = await this._pool.query(query);
        return result.rows;
    }

    async verifyReplyOwner(replyId, ownerId) {
        const query = {
            text: 'SELECT owner FROM replies WHERE id = $1 AND is_deleted = FALSE',
            values: [replyId],
        };
        const result = await this._pool.query(query);

        if (!result.rowCount) {
            throw new NotFoundError('balasan tidak ditemukan atau sudah dihapus');
        }
        if (result.rows[0].owner !== ownerId) {
            throw new AuthorizationError('anda tidak berhak mengakses resource ini');
        }
    }

    async deleteReplyById(replyId) {
        const query = {
            text: 'UPDATE replies SET is_deleted = TRUE WHERE id = $1 RETURNING id',
            values: [replyId],
        };
        const result = await this._pool.query(query);

        if (!result.rowCount) {
            throw new NotFoundError('Gagal menghapus balasan. Balasan tidak ditemukan.');
        }
    }
}

module.exports = ReplyRepositoryPostgres;