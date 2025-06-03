const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
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
    let accessTokenUser2;

    beforeAll(async () => {
        server = await createServer(container);
        tokenManager = container.getInstance(AuthenticationTokenManager.name);

        await UsersTableTestHelper.cleanTable();
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
        // This is your existing passing test
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

        // --- Missing tests you can add ---
        it('should response 401 when no access token is provided', async () => {
            const requestPayload = { title: 'Another Thread Title', body: 'Some body.' };
            const response = await server.inject({
                method: 'POST',
                url: '/threads',
                payload: requestPayload,
                // No Authorization header
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(401);
            expect(responseJson.message).toBeDefined();
        });

        it('should response 400 when request payload does not contain title property', async () => {
            const requestPayload = { body: 'A body without a title.' };
            const response = await server.inject({
                method: 'POST',
                url: '/threads',
                payload: requestPayload,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(400);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('tidak dapat membuat thread baru karena properti title atau body tidak ada');
        });

        it('should response 400 when request payload title is not a string', async () => {
            const requestPayload = { title: 12345, body: 'A body with a non-string title.' };
            const response = await server.inject({
                method: 'POST',
                url: '/threads',
                payload: requestPayload,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(400);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('tidak dapat membuat thread baru karena tipe data title atau body tidak sesuai');
        });
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
        const user1 = testUserId; // e.g., 'user-threadtest-suite', username 'threaduser1'
        const user2 = anotherTestUserId; // e.g., 'user-anothertest-suite', username 'threaduser2'
        let commentIdForReplies;

        beforeEach(async () => {
            // Clean relevant tables
            await RepliesTableTestHelper.cleanTable();
            await CommentsTableTestHelper.cleanTable();
            await ThreadsTableTestHelper.cleanTable();
            // Users are created in beforeAll for the suite

            threadIdForGet = 'thread-detail-replies';
            await ThreadsTableTestHelper.addThread({
                id: threadIdForGet, title: 'Thread with Replies', body: 'Body here',
                owner: user1, date: new Date('2024-01-20T10:00:00.000Z'),
            });

            commentIdForReplies = 'comment-with-replies';
            await CommentsTableTestHelper.addComment({
                id: commentIdForReplies, content: 'Comment to reply to', owner: user2,
                threadId: threadIdForGet, date: new Date('2024-01-20T10:05:00.000Z'),
            });
            await CommentsTableTestHelper.addComment({
                id: 'comment-no-replies', content: 'Comment with no replies', owner: user1,
                threadId: threadIdForGet, date: new Date('2024-01-20T10:03:00.000Z'),
            });


            await RepliesTableTestHelper.addReply({
                id: 'reply-1-on-c1', owner: user1, commentId: commentIdForReplies,
                content: 'First reply', date: new Date('2024-01-20T10:10:00.000Z'),
            });
            await RepliesTableTestHelper.addReply({
                id: 'reply-2-on-c1', owner: user2, commentId: commentIdForReplies,
                content: 'Deleted reply', date: new Date('2024-01-20T10:15:00.000Z'), isDeleted: true,
            });
        });

        it('should response 200 and return thread details with comments and their replies', async () => {
            // Action
            const response = await server.inject({
                method: 'GET', url: `/threads/${threadIdForGet}`,
            });

            // Assert
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(200);
            expect(responseJson.status).toEqual('success');
            const { thread } = responseJson.data;
            expect(thread.id).toEqual(threadIdForGet);
            expect(thread.username).toEqual('threaduser1'); // Thread owner username

            expect(thread.comments).toHaveLength(2); // Ordered by date asc

            // First comment in order (comment-no-replies)
            const commentNoReplies = thread.comments.find(c => c.id === 'comment-no-replies');
            expect(commentNoReplies.username).toEqual('threaduser1');
            expect(commentNoReplies.content).toEqual('Comment with no replies');
            expect(commentNoReplies.replies).toEqual([]);

            // Second comment in order (comment-with-replies)
            const commentWithReplies = thread.comments.find(c => c.id === commentIdForReplies);
            expect(commentWithReplies.username).toEqual('threaduser2');
            expect(commentWithReplies.content).toEqual('Comment to reply to');
            expect(commentWithReplies.replies).toHaveLength(2);

            // Check replies for commentWithReplies (ordered by date asc)
            expect(commentWithReplies.replies[0].id).toEqual('reply-1-on-c1');
            expect(commentWithReplies.replies[0].username).toEqual('threaduser1');
            expect(commentWithReplies.replies[0].content).toEqual('First reply');
            expect(new Date(commentWithReplies.replies[0].date).toISOString()).toEqual('2024-01-20T10:10:00.000Z');

            expect(commentWithReplies.replies[1].id).toEqual('reply-2-on-c1');
            expect(commentWithReplies.replies[1].username).toEqual('threaduser2');
            expect(commentWithReplies.replies[1].content).toEqual('**balasan telah dihapus**');
            expect(new Date(commentWithReplies.replies[1].date).toISOString()).toEqual('2024-01-20T10:15:00.000Z');
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

    describe('when DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}', () => {
        let threadIdForDeleteReply;
        let commentIdForDeleteReply;
        let replyIdUser1;
        // user1 = testUserId, user2 = anotherTestUserId
        // accessTokenUser1, accessTokenUser2 are available

        beforeEach(async () => {
            threadIdForDeleteReply = 'del-rep-thread-1';
            await ThreadsTableTestHelper.addThread({ id: threadIdForDeleteReply, owner: testUserId });

            commentIdForDeleteReply = 'del-rep-comment-1';
            await CommentsTableTestHelper.addComment({ id: commentIdForDeleteReply, owner: testUserId, threadId: threadIdForDeleteReply });

            replyIdUser1 = 'del-rep-reply-1';
            await RepliesTableTestHelper.addReply({ id: replyIdUser1, owner: testUserId, commentId: commentIdForDeleteReply, content: 'User1 reply for deletion' });
        });

        it('should response 200 and soft delete the reply when user is the owner', async () => {
            const response = await server.inject({
                method: 'DELETE',
                url: `/threads/${threadIdForDeleteReply}/comments/${commentIdForDeleteReply}/replies/${replyIdUser1}`,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });

            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(200);
            expect(responseJson.status).toEqual('success');

            const [reply] = await RepliesTableTestHelper.findReplyById(replyIdUser1);
            expect(reply).toBeDefined();
            expect(reply.is_deleted).toEqual(true);
        });

        it('should response 403 when user is not the reply owner', async () => {
            const response = await server.inject({
                method: 'DELETE',
                url: `/threads/${threadIdForDeleteReply}/comments/${commentIdForDeleteReply}/replies/${replyIdUser1}`,
                headers: { Authorization: `Bearer ${accessTokenUser2}` }, // User2 trying to delete User1's reply
            });

            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(403);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('anda tidak berhak mengakses resource ini');
        });

        it('should response 401 when no access token is provided', async () => {
            const response = await server.inject({
                method: 'DELETE',
                url: `/threads/${threadIdForDeleteReply}/comments/${commentIdForDeleteReply}/replies/${replyIdUser1}`,
            });
            expect(response.statusCode).toEqual(401);
        });

        it('should response 404 when threadId does not exist', async () => {
            const response = await server.inject({
                method: 'DELETE',
                url: `/threads/nonexistent-thread/comments/${commentIdForDeleteReply}/replies/${replyIdUser1}`,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(404);
            expect(responseJson.message).toEqual('thread tidak ditemukan');
        });

        it('should response 404 when commentId does not exist', async () => {
            const response = await server.inject({
                method: 'DELETE',
                url: `/threads/${threadIdForDeleteReply}/comments/nonexistent-comment/replies/${replyIdUser1}`,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(404);
            expect(responseJson.message).toEqual('komentar tidak ditemukan atau sudah dihapus');
        });

        it('should response 404 when replyId does not exist', async () => {
            const response = await server.inject({
                method: 'DELETE',
                url: `/threads/${threadIdForDeleteReply}/comments/${commentIdForDeleteReply}/replies/nonexistent-reply`,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(404);
            expect(responseJson.message).toEqual('balasan tidak ditemukan atau sudah dihapus');
        });

        it('should response 404 when trying to delete an already soft-deleted reply', async () => {
            await pool.query('UPDATE replies SET is_deleted = TRUE WHERE id = $1', [replyIdUser1]);

            const response = await server.inject({
                method: 'DELETE',
                url: `/threads/${threadIdForDeleteReply}/comments/${commentIdForDeleteReply}/replies/${replyIdUser1}`,
                headers: { Authorization: `Bearer ${accessTokenUser1}` },
            });
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(404);
            expect(responseJson.message).toEqual('balasan tidak ditemukan atau sudah dihapus');
        });
    });
});