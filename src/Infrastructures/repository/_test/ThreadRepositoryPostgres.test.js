const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper'); // For owner dependency
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('ThreadRepositoryPostgres', () => {
    beforeAll(async () => {
        // Ensure users table is clean or a user exists for FK constraint
        await UsersTableTestHelper.cleanTable();
        await UsersTableTestHelper.addUser({ id: 'user-test-owner', username: 'threadowner' });
    });

    afterEach(async () => {
        await ThreadsTableTestHelper.cleanTable();
    });

    afterAll(async () => {
        await UsersTableTestHelper.cleanTable(); // Clean up the test user
        await pool.end();
    });

    describe('addThread function', () => {
        it('should persist new thread and return added thread correctly', async () => {
            // Arrange
            const addThreadPayload = {
                title: 'Test Title',
                body: 'Test Body',
                owner: 'user-test-owner', // Ensure this user exists
            };
            const fakeIdGenerator = () => '123';
            const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

            // Action
            const addedThread = await threadRepositoryPostgres.addThread(addThreadPayload);
            const threads = await ThreadsTableTestHelper.findThreadById('thread-123');

            // Assert
            expect(threads).toHaveLength(1);
            expect(threads[0].title).toEqual(addThreadPayload.title);
            expect(threads[0].body).toEqual(addThreadPayload.body);
            expect(threads[0].owner).toEqual(addThreadPayload.owner);
            expect(addedThread).toBeInstanceOf(AddedThread);
            expect(addedThread.id).toEqual('thread-123');
            expect(addedThread.title).toEqual(addThreadPayload.title);
            expect(addedThread.owner).toEqual(addThreadPayload.owner);
        });
    });

    describe('getThreadById function', () => {
        it('should throw NotFoundError when thread not found', async () => {
            const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});
            await expect(threadRepositoryPostgres.getThreadById('thread-nonexistent'))
                .rejects.toThrowError(NotFoundError);
        });

        it('should return thread data including username when thread is found', async () => {
            // Arrange
            const ownerId = 'user-owner-for-get';
            const ownerUsername = 'threadgetowner'; // Define username for clarity

            // Ensure owner exists in users table
            const users = await UsersTableTestHelper.findUsersById(ownerId);
            if (users.length === 0) {
                await UsersTableTestHelper.addUser({ id: ownerId, username: ownerUsername });
            }

            const threadId = 'thread-gettest-detail';
            await ThreadsTableTestHelper.addThread({
                id: threadId, title: 'Get Test Detail', body: 'Body Get Test Detail', owner: ownerId,
            });
            const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

            // Action
            const thread = await threadRepositoryPostgres.getThreadById(threadId);

            // Assert
            expect(thread).toBeDefined();
            expect(thread.id).toEqual(threadId);
            expect(thread.title).toEqual('Get Test Detail');
            expect(thread.body).toEqual('Body Get Test Detail');
            expect(thread.username).toEqual(ownerUsername); // Check against the defined username
            expect(thread.date).toBeDefined();
        });
    });

    describe('verifyThreadExists function', () => {
        it('should throw NotFoundError when thread not found', async () => {
            // Arrange
            const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});
            // Action & Assert
            await expect(threadRepositoryPostgres.verifyThreadExists('thread-nonexistent'))
                .rejects.toThrowError(NotFoundError);
        });

        it('should not throw NotFoundError when thread exists', async () => {
            // Arrange
            const threadId = 'thread-verify';
            await ThreadsTableTestHelper.addThread({ id: threadId, owner: 'user-test-owner' });
            const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});
            // Action & Assert
            await expect(threadRepositoryPostgres.verifyThreadExists(threadId))
                .resolves.not.toThrowError(NotFoundError);
        });
    });
});