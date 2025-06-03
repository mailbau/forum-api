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
    describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
        let existingThreadId;
        let existingCommentIdUser1;
        // const testUserId is user1, anotherTestUserId is user2
        // accessTokenUser1 and accessTokenUser2 are defined in beforeAll

        beforeEach(async () => {
            existingThreadId = 'thread-delete-comments';
            await ThreadsTableTestHelper.addThread({
                id: existingThreadId,
                title: 'Thread for Deleting Comments',
                body: 'Body for delete',
                owner: testUserId, // Owned by user1
            });
            existingCommentIdUser1 = await CommentsTableTestHelper.addComment({
                id: 'comment-to-delete-user1',
                content: 'User1 comment',
                owner: testUserId, // Comment owned by user1
                threadId: existingThreadId,
            });
        });

        it('should response 200 and soft delete the comment when user is the owner', async () => {
            // Action
            const response = await server.inject({
                method: 'DELETE',
                url: `/threads/${existingThreadId}/comments/${existingCommentIdUser1}`,
                headers: {
                    Authorization: `Bearer ${accessTokenUser1}`, // User1 (owner) deleting
                },
            });

            // Assert
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(200);
            expect(responseJson.status).toEqual('success');

            // Verify soft delete in DB
            const [comment] = await CommentsTableTestHelper.findCommentById(existingCommentIdUser1);
            expect(comment).toBeDefined();
            expect(comment.is_deleted).toEqual(true);
        });

        it('should response 403 when user is not the comment owner', async () => {
            // Action
            const response = await server.inject({
                method: 'DELETE',
                url: `/threads/${existingThreadId}/comments/${existingCommentIdUser1}`,
                headers: {
                    Authorization: `Bearer ${accessTokenUser2}`, // User2 trying to delete User1's comment
                },
            });

            // Assert
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(403);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('anda tidak berhak mengakses resource ini');
        });

        it('should response 401 when no access token is provided', async () => {
            const response = await server.inject({
                method: 'DELETE',
                url: `/threads/${existingThreadId}/comments/${existingCommentIdUser1}`,
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(401);
        });

        it('should response 404 when threadId does not exist', async () => {
            const response = await server.inject({
                method: 'DELETE',
                url: `/threads/nonexistent-thread/comments/${existingCommentIdUser1}`,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(404);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('thread tidak ditemukan');
        });

        it('should response 404 when commentId does not exist', async () => {
            const response = await server.inject({
                method: 'DELETE',
                url: `/threads/${existingThreadId}/comments/nonexistent-comment`,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(404);
            expect(responseJson.status).toEqual('fail');
            // This message comes from verifyCommentOwner if comment not found
            expect(responseJson.message).toEqual('komentar tidak ditemukan atau sudah dihapus');
        });

        it('should response 404 when commentId exists but is already soft-deleted', async () => {
            // Soft delete the comment first via DB for test setup
            await pool.query({
                text: 'UPDATE comments SET is_deleted = TRUE WHERE id = $1',
                values: [existingCommentIdUser1],
            });

            const response = await server.inject({
                method: 'DELETE',
                url: `/threads/${existingThreadId}/comments/${existingCommentIdUser1}`,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(404);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('komentar tidak ditemukan atau sudah dihapus');
        });
    });

    describe('when GET /threads/{threadId}', () => {
        let threadIdForGet;
        const user1 = testUserId; // 'user-threadtest-suite', username 'threaduser1'
        const user2 = anotherTestUserId; // 'user-anothertest-suite', username 'threaduser2'

        beforeEach(async () => {
            // Create a thread
            threadIdForGet = 'thread-detail-test';
            await ThreadsTableTestHelper.addThread({
                id: threadIdForGet,
                title: 'Detail Thread Title',
                body: 'Detail thread body.',
                owner: user1, // Owned by threaduser1
                date: new Date('2024-01-15T10:00:00.000Z'),
            });

            // Add some comments
            await CommentsTableTestHelper.addComment({
                id: 'comment-get-1',
                content: 'First comment for detail',
                owner: user2, // Comment by threaduser2
                threadId: threadIdForGet,
                date: new Date('2024-01-15T10:05:00.000Z'),
            });
            await CommentsTableTestHelper.addComment({
                id: 'comment-get-2',
                content: 'Second comment, deleted',
                owner: user1, // Comment by threaduser1
                threadId: threadIdForGet,
                date: new Date('2024-01-15T10:10:00.000Z'),
                isDeleted: true,
            });
            await CommentsTableTestHelper.addComment({
                id: 'comment-get-3',
                content: 'Third comment',
                owner: user2, // Comment by threaduser2
                threadId: threadIdForGet,
                date: new Date('2024-01-15T10:02:00.000Z'), // Earlier than first to test sorting
            });
        });

        it('should response 200 and return thread details with comments', async () => {
            // Action
            const response = await server.inject({
                method: 'GET',
                url: `/threads/${threadIdForGet}`,
            });

            // Assert
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(200);
            expect(responseJson.status).toEqual('success');
            expect(responseJson.data.thread).toBeDefined();

            const { thread } = responseJson.data;
            expect(thread.id).toEqual(threadIdForGet);
            expect(thread.title).toEqual('Detail Thread Title');
            expect(thread.body).toEqual('Detail thread body.');
            expect(new Date(thread.date).toISOString()).toEqual('2024-01-15T10:00:00.000Z');
            expect(thread.username).toEqual('threaduser1'); // Username of thread owner

            expect(thread.comments).toBeInstanceOf(Array);
            expect(thread.comments).toHaveLength(3);

            // Check sorting (by date ascending) and content transformation
            // comment-get-3 (10:02)
            // comment-get-1 (10:05)
            // comment-get-2 (10:10) - deleted
            expect(thread.comments[0].id).toEqual('comment-get-3');
            expect(thread.comments[0].username).toEqual('threaduser2');
            expect(new Date(thread.comments[0].date).toISOString()).toEqual('2024-01-15T10:02:00.000Z');
            expect(thread.comments[0].content).toEqual('Third comment');

            expect(thread.comments[1].id).toEqual('comment-get-1');
            expect(thread.comments[1].username).toEqual('threaduser2');
            expect(new Date(thread.comments[1].date).toISOString()).toEqual('2024-01-15T10:05:00.000Z');
            expect(thread.comments[1].content).toEqual('First comment for detail');

            expect(thread.comments[2].id).toEqual('comment-get-2');
            expect(thread.comments[2].username).toEqual('threaduser1');
            expect(new Date(thread.comments[2].date).toISOString()).toEqual('2024-01-15T10:10:00.000Z');
            expect(thread.comments[2].content).toEqual('**komentar telah dihapus**');
        });

        it('should response 404 when threadId does not exist', async () => {
            // Action
            const response = await server.inject({
                method: 'GET',
                url: '/threads/nonexistent-thread-id-for-get',
            });

            // Assert
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(404);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('thread tidak ditemukan');
        });
    });
});