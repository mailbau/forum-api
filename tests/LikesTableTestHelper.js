/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const LikesTableTestHelper = {
    async addLike({
        id = 'like-123',
        commentId = 'comment-123',
        owner = 'user-123',
    }) {
        const query = {
            text: 'INSERT INTO comment_likes(id, comment_id, owner) VALUES($1, $2, $3)',
            values: [id, commentId, owner],
        };
        await pool.query(query);
    },

    async findLikeById(id) {
        const query = {
            text: 'SELECT * FROM comment_likes WHERE id = $1',
            values: [id],
        };
        const result = await pool.query(query);
        return result.rows;
    },

    async cleanTable() {
        await pool.query('DELETE FROM comment_likes WHERE 1=1');
    },
};

module.exports = LikesTableTestHelper;