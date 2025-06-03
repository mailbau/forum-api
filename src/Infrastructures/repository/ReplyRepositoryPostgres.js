const AddedReply = require('../../Domains/replies/entities/AddedReply');
const ReplyRepository = require('../../Domains/replies/ReplyRepository');
// Import NotFoundError, AuthorizationError if needed for other methods

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

    async getRepliesByCommentId(commentId) { // Added
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
}

module.exports = ReplyRepositoryPostgres;