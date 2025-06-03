/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const ThreadsTableTestHelper = {
    async addThread({
        id = 'thread-123', title = 'Test Thread', body = 'Test body', owner = 'user-123', date = new Date().toISOString(),
    }) {
        const query = {
            text: 'INSERT INTO threads(id, title, body, owner, date) VALUES($1, $2, $3, $4, $5) RETURNING id',
            values: [id, title, body, owner, date],
        };

        const result = await pool.query(query);
        return result.rows[0].id;
    },

    async findThreadById(id) {
        const query = {
            text: 'SELECT * FROM threads WHERE id = $1',
            values: [id],
        };

        const result = await pool.query(query);
        return result.rows;
    },

    async cleanTable() {
        await pool.query('DELETE FROM threads WHERE 1=1');
        // If you have a foreign key to users and want to reset users as well for some tests:
        // await pool.query('DELETE FROM users WHERE 1=1');
    },
};

module.exports = ThreadsTableTestHelper;