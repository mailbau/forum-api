const AddedThread = require('../../Domains/threads/entities/AddedThread');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');

class ThreadRepositoryPostgres extends ThreadRepository {
    constructor(pool, idGenerator) {
        super();
        this._pool = pool;
        this._idGenerator = idGenerator;
    }

    async addThread(addThreadPayload) {
        const { title, body, owner } = addThreadPayload;
        const id = `thread-${this._idGenerator()}`;
        // const date = new Date().toISOString(); // DB will use DEFAULT

        const query = {
            text: 'INSERT INTO threads(id, title, body, owner) VALUES($1, $2, $3, $4) RETURNING id, title, owner',
            values: [id, title, body, owner],
        };

        const result = await this._pool.query(query);
        return new AddedThread({ ...result.rows[0] });
    }

    async getThreadById(threadId) {
        const query = {
            text: 'SELECT id, title, body, date, owner FROM threads WHERE id = $1',
            values: [threadId],
        };

        const result = await this._pool.query(query);

        if (!result.rowCount) {
            throw new NotFoundError('thread tidak ditemukan');
        }

        // This should map to a domain entity like `ThreadDetail` in a real scenario
        // For now, just return the raw row if needed or adjust as per upcoming criteria
        return result.rows[0];
    }

    async verifyThreadExists(threadId) {
        const query = {
            text: 'SELECT id FROM threads WHERE id = $1',
            values: [threadId],
        };
        const result = await this._pool.query(query);
        if (!result.rowCount) {
            throw new NotFoundError('thread tidak ditemukan');
        }
    }
}

module.exports = ThreadRepositoryPostgres;