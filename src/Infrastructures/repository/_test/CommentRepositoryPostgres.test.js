const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const pool = require('../../database/postgres/pool');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');

describe('CommentRepositoryPostgres', () => {
    const testUserId = 'user-comment-owner';
    const testThreadId = 'thread-comment-test';

    beforeAll(async () => {
        await UsersTableTestHelper.cleanTable(); // Clean users first due to FK
        await ThreadsTableTestHelper.cleanTable(); // Then threads
        await UsersTableTestHelper.addUser({ id: testUserId, username: 'commentowner' });
        await ThreadsTableTestHelper.addThread({ id: testThreadId, owner: testUserId, title: 'Test Thread for Comments' });
    });

    afterEach(async () => {
        await CommentsTableTestHelper.cleanTable();
    });

    afterAll(async () => {
        await CommentsTableTestHelper.cleanTable(); // Clean comments
        await ThreadsTableTestHelper.cleanTable(); // Then threads
        await UsersTableTestHelper.cleanTable(); // Finally users
        await pool.end();
    });

    describe('addComment function', () => {
        it('should persist new comment and return added comment correctly', async () => {
            // Arrange
            const addCommentPayload = {
                content: 'This is a test comment.',
                threadId: testThreadId,
                owner: testUserId,
            };
            const fakeIdGenerator = () => 'comment123';
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

            // Action
            const addedComment = await commentRepositoryPostgres.addComment(addCommentPayload);
            const comments = await CommentsTableTestHelper.findCommentById('comment-comment123');

            // Assert
            expect(comments).toHaveLength(1);
            expect(comments[0].content).toEqual(addCommentPayload.content);
            expect(comments[0].owner).toEqual(addCommentPayload.owner);
            expect(comments[0].thread_id).toEqual(addCommentPayload.threadId);
            expect(addedComment).toBeInstanceOf(AddedComment);
            expect(addedComment.id).toEqual('comment-comment123');
            expect(addedComment.content).toEqual(addCommentPayload.content);
            expect(addedComment.owner).toEqual(addCommentPayload.owner);
        });
    });

    // Add tests for other CommentRepositoryPostgres methods when implemented
});