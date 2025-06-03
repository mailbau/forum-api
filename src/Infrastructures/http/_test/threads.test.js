const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper'); // Added
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');
const AuthenticationTokenManager = require('../../../Applications/security/AuthenticationTokenManager');

describe('/threads endpoint', () => {
    let server;
    let tokenManager;
    const testUserId = 'user-threadtest-suite';
    const anotherTestUserId = 'user-anothertest-suite';
    let accessTokenUser1;
    let accessTokenUser2; // For different owner tests if needed later

    beforeAll(async () => {
        server = await createServer(container);
        tokenManager = container.getInstance(AuthenticationTokenManager.name);

        await UsersTableTestHelper.cleanTable(); // Clean before all tests in this suite
        await UsersTableTestHelper.addUser({
            id: testUserId,
            username: 'threaduser1',
            password: 'secretpassword1',
            fullname: 'Thread User One',
        });
        await UsersTableTestHelper.addUser({
            id: anotherTestUserId,
            username: 'threaduser2',
            password: 'secretpassword2',
            fullname: 'Thread User Two',
        });

        accessTokenUser1 = await tokenManager.createAccessToken({ id: testUserId, username: 'threaduser1' });
        accessTokenUser2 = await tokenManager.createAccessToken({ id: anotherTestUserId, username: 'threaduser2' });
    });

    afterAll(async () => {
        await UsersTableTestHelper.cleanTable();
        await pool.end();
    });

    afterEach(async () => {
        await CommentsTableTestHelper.cleanTable();
        await ThreadsTableTestHelper.cleanTable();
    });

    describe('when POST /threads', () => {
        // ... existing tests for POST /threads ...
        // (ensure accessTokenUser1 is used for these tests)
        it('should response 201 and persisted thread when payload valid and authenticated', async () => {
            const requestPayload = { title: 'Test Thread Title', body: 'This is the body.' };
            const response = await server.inject({
                method: 'POST', url: '/threads', payload: requestPayload,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(201);
            expect(responseJson.status).toEqual('success');
            expect(responseJson.data.addedThread.owner).toEqual(testUserId);
        });
        // ... other POST /threads tests (401, 400)
    });

    describe('when POST /threads/{threadId}/comments', () => {
        let existingThreadId;

        beforeEach(async () => {
            // Add a thread for comments to be posted on
            existingThreadId = await ThreadsTableTestHelper.addThread({
                id: 'thread-for-comments',
                title: 'Thread for Comments',
                body: 'Some body',
                owner: testUserId, // Owned by user1
            });
        });

        it('should response 201 and persisted comment when payload valid and authenticated', async () => {
            // Arrange
            const requestPayload = {
                content: 'This is a test comment.',
            };

            // Action
            const response = await server.inject({
                method: 'POST',
                url: `/threads/${existingThreadId}/comments`,
                payload: requestPayload,
                headers: {
                    Authorization: `Bearer ${accessTokenUser2}`, // Comment by user2
                },
            });

            // Assert
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(201);
            expect(responseJson.status).toEqual('success');
            expect(responseJson.data.addedComment).toBeDefined();
            expect(responseJson.data.addedComment.id).toBeDefined();
            expect(responseJson.data.addedComment.content).toEqual(requestPayload.content);
            expect(responseJson.data.addedComment.owner).toEqual(anotherTestUserId);

            // Verify in DB
            const comments = await CommentsTableTestHelper.findCommentById(responseJson.data.addedComment.id);
            expect(comments).toHaveLength(1);
            expect(comments[0].content).toEqual(requestPayload.content);
            expect(comments[0].owner).toEqual(anotherTestUserId);
            expect(comments[0].thread_id).toEqual(existingThreadId);
        });

        it('should response 401 when no access token is provided for adding a comment', async () => {
            const requestPayload = { content: 'A comment.' };
            const response = await server.inject({
                method: 'POST',
                url: `/threads/${existingThreadId}/comments`,
                payload: requestPayload,
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(401);
            expect(responseJson.message).toBeDefined(); // e.g., "Missing authentication"
        });

        it('should response 401 when access token is invalid for adding a comment', async () => {
            const requestPayload = { content: 'A comment.' };
            const response = await server.inject({
                method: 'POST',
                url: `/threads/${existingThreadId}/comments`,
                payload: requestPayload,
                headers: { Authorization: 'Bearer invalid.token' },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(401);
            expect(responseJson.message).toEqual('Invalid token structure');
        });

        it('should response 404 when threadId does not exist', async () => {
            const requestPayload = { content: 'A comment for a non-existent thread.' };
            const response = await server.inject({
                method: 'POST',
                url: '/threads/nonexistent-thread-id/comments',
                payload: requestPayload,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(404);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('thread tidak ditemukan'); // From NotFoundError in verifyThreadExists
        });

        it('should response 400 when request payload does not contain content property', async () => {
            const requestPayload = {}; // Missing content
            const response = await server.inject({
                method: 'POST',
                url: `/threads/${existingThreadId}/comments`,
                payload: requestPayload,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(400);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('tidak dapat membuat komentar baru karena properti content tidak ada');
        });

        it('should response 400 when request payload content is not a string', async () => {
            const requestPayload = { content: 12345 };
            const response = await server.inject({
                method: 'POST',
                url: `/threads/${existingThreadId}/comments`,
                payload: requestPayload,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(400);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('tidak dapat membuat komentar baru karena tipe data content tidak sesuai');
        });
        it('should response 400 when request payload content is an empty string', async () => {
            const requestPayload = { content: '' };
            const response = await server.inject({
                method: 'POST',
                url: `/threads/${existingThreadId}/comments`,
                payload: requestPayload,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(400);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('content komentar tidak boleh kosong');
        });
    });
});