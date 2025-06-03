const AddedComment = require('../../Domains/comments/entities/AddedComment');
const CommentRepository = require('../../Domains/comments/CommentRepository');
// const InvariantError = require('../../Commons/exceptions/InvariantError'); // If needed for repo-specific errors
// const NotFoundError = require('../../Commons/exceptions/NotFoundError'); // For getCommentById etc.

class CommentRepositoryPostgres extends CommentRepository {
    constructor(pool, idGenerator) {
        super();
        this._pool = pool;
        this._idGenerator = idGenerator;
    }

    async addComment(addCommentPayload) {
        const { content, threadId, owner } = addCommentPayload;
        const id = `comment-${this._idGenerator()}`;
        // date and is_deleted will use DB defaults

        const query = {
            text: 'INSERT INTO comments(id, content, owner, thread_id) VALUES($1, $2, $3, $4) RETURNING id, content, owner',
            values: [id, content, owner, threadId],
        };

        const result = await this._pool.query(query);
        return new AddedComment({ ...result.rows[0] });
    }

    // Implement other methods from CommentRepository interface as needed for future criteria
    // async verifyCommentOwner(commentId, ownerId) { /* ... */ }
    // async getCommentById(commentId) { /* ... */ }
    // async deleteCommentById(commentId) { /* ... */ } // Likely a soft delete: UPDATE comments SET is_deleted = TRUE
    // async getCommentsByThreadId(threadId) { /* ... */ }
}

module.exports = CommentRepositoryPostgres;