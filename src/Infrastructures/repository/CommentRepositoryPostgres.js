const AddedComment = require('../../Domains/comments/entities/AddedComment');
const CommentRepository = require('../../Domains/comments/CommentRepository');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');

class CommentRepositoryPostgres extends CommentRepository {
    constructor(pool, idGenerator) {
        super();
        this._pool = pool;
        this._idGenerator = idGenerator;
    }

    async addComment(addCommentPayload) {
        const { content, threadId, owner } = addCommentPayload;
        const id = `comment-${this._idGenerator()}`;

        const query = {
            text: 'INSERT INTO comments(id, content, owner, thread_id) VALUES($1, $2, $3, $4) RETURNING id, content, owner',
            values: [id, content, owner, threadId],
        };

        const result = await this._pool.query(query);
        return new AddedComment({ ...result.rows[0] });
    }

    async verifyCommentOwner(commentId, ownerId) {
        const query = {
            text: 'SELECT owner FROM comments WHERE id = $1 AND is_deleted = FALSE', // Only check non-deleted comments
            values: [commentId],
        };
        const result = await this._pool.query(query);

        if (!result.rowCount) {
            throw new NotFoundError('komentar tidak ditemukan atau sudah dihapus');
        }

        if (result.rows[0].owner !== ownerId) {
            throw new AuthorizationError('anda tidak berhak mengakses resource ini');
        }
    }

    async deleteCommentById(commentId) {
        const query = {
            text: 'UPDATE comments SET is_deleted = TRUE WHERE id = $1 RETURNING id',
            values: [commentId],
        };
        const result = await this._pool.query(query);
        if (!result.rowCount) {
            throw new NotFoundError('Gagal menghapus komentar. Komentar tidak ditemukan.');
        }
    }

    async getCommentsByThreadId(threadId) {
        const query = {
            text: `
            SELECT
              comments.id,
              users.username,
              comments.date,
              comments.content,
              comments.is_deleted,
              COALESCE((SELECT COUNT(*)::int FROM comment_likes WHERE comment_id = comments.id), 0) AS like_count
            FROM comments
            INNER JOIN users ON comments.owner = users.id
            WHERE comments.thread_id = $1
            ORDER BY comments.date ASC
          `,
            values: [threadId],
        };
        const result = await this._pool.query(query);
        return result.rows;
    }

    async verifyCommentExists(commentId) { // Added
        const query = {
            text: 'SELECT id FROM comments WHERE id = $1 AND is_deleted = FALSE',
            values: [commentId],
        };
        const result = await this._pool.query(query);
        if (!result.rowCount) {
            throw new NotFoundError('komentar tidak ditemukan atau sudah dihapus');
        }
    }
}

module.exports = CommentRepositoryPostgres;