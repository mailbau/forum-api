/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const CommentsTableTestHelper = {
    async addComment({
        id = 'comment-123',
        content = 'Test Comment',
        owner = 'user-123',
        threadId = 'thread-123',
        date = new Date().toISOString(),
        isDeleted = false,
    }) {
        const query = {
            text: 'INSERT INTO comments(id, content, owner, thread_id, date, is_deleted) VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
            values: [id, content, owner, threadId, date, isDeleted],
        };
        const result = await pool.query(query);
        return result.rows[0].id;
    },

    async findCommentById(id) {
        const query = {
            text: 'SELECT * FROM comments WHERE id = $1',
            values: [id],
        };
        const result = await pool.query(query);
        return result.rows;
    },

    async findCommentsByThreadId(threadId) {
        const query = {
            text: 'SELECT * FROM comments WHERE thread_id = $1 ORDER BY date ASC',
            values: [threadId],
        };
        const result = await pool.query(query);
        return result.rows;
    },

    async cleanTable() {
        await pool.query('DELETE FROM comments WHERE 1=1');
    },
};

module.exports = CommentsTableTestHelper;