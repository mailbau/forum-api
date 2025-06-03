// src/Infrastructures/repository/CommentRepositoryPostgres.js
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

    async verifyCommentOwner(commentId, ownerId) { // Added
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

    async deleteCommentById(commentId) { // Added for soft delete
        const query = {
            text: 'UPDATE comments SET is_deleted = TRUE WHERE id = $1 RETURNING id',
            values: [commentId],
        };
        const result = await this._pool.query(query);
        if (!result.rowCount) {
            // This case should ideally be caught by verifyCommentOwner or a verifyCommentExists first
            // but as a safeguard:
            throw new NotFoundError('Gagal menghapus komentar. Komentar tidak ditemukan.');
        }
    }

    // Implement other methods like getCommentById etc. if needed for other features
    // For getCommentById, you might want to check is_deleted status based on requirements.
}

module.exports = CommentRepositoryPostgres;