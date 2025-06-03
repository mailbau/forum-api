const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const pool = require('../../database/postgres/pool');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('CommentRepositoryPostgres', () => {
    const testUserId = 'user-delete-owner';
    const anotherUserId = 'user-another';
    const testThreadId = 'thread-delete-test';

    beforeAll(async () => {
        // Clear tables in order of dependencies (comments -> threads -> users)
        await CommentsTableTestHelper.cleanTable();
        await ThreadsTableTestHelper.cleanTable();
        await UsersTableTestHelper.cleanTable();

        // Add users first
        await UsersTableTestHelper.addUser({ id: testUserId, username: 'deletecommentowner' });
        await UsersTableTestHelper.addUser({ id: anotherUserId, username: 'anotheruserfordelete' });
        // Then add thread
        await ThreadsTableTestHelper.addThread({ id: testThreadId, owner: testUserId, title: 'Test Thread for Deleting Comments' });
    });

    afterEach(async () => {
        await CommentsTableTestHelper.cleanTable(); // Clean comments after each test
    });

    afterAll(async () => {
        // Clear tables in reverse order of dependencies for final cleanup
        await CommentsTableTestHelper.cleanTable();
        await ThreadsTableTestHelper.cleanTable();
        await UsersTableTestHelper.cleanTable();
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

    describe('verifyCommentOwner function', () => {
        const commentId = 'comment-verify-owner';
        beforeEach(async () => {
            await CommentsTableTestHelper.addComment({
                id: commentId, owner: testUserId, threadId: testThreadId, content: 'verify owner content',
            });
        });

        it('should not throw AuthorizationError nor NotFoundError when user is the owner and comment exists', async () => {
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
            await expect(commentRepositoryPostgres.verifyCommentOwner(commentId, testUserId))
                .resolves.not.toThrowError(AuthorizationError);
            await expect(commentRepositoryPostgres.verifyCommentOwner(commentId, testUserId))
                .resolves.not.toThrowError(NotFoundError);
        });

        it('should throw AuthorizationError when user is not the owner', async () => {
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
            await expect(commentRepositoryPostgres.verifyCommentOwner(commentId, anotherUserId))
                .rejects.toThrowError(AuthorizationError);
        });

        it('should throw NotFoundError if comment does not exist', async () => {
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
            await expect(commentRepositoryPostgres.verifyCommentOwner('nonexistent-comment', testUserId))
                .rejects.toThrowError(NotFoundError);
        });

        it('should throw NotFoundError if comment is already soft-deleted', async () => {
            // Soft delete the comment first
            await pool.query({ text: 'UPDATE comments SET is_deleted = TRUE WHERE id = $1', values: [commentId] });
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
            await expect(commentRepositoryPostgres.verifyCommentOwner(commentId, testUserId))
                .rejects.toThrowError(NotFoundError);
        });
    });

    describe('deleteCommentById function (soft delete)', () => {
        const commentId = 'comment-to-delete';
        beforeEach(async () => {
            await CommentsTableTestHelper.addComment({
                id: commentId, owner: testUserId, threadId: testThreadId, content: 'delete me',
            });
        });

        it('should soft delete the comment (set is_deleted to true)', async () => {
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
            await commentRepositoryPostgres.deleteCommentById(commentId);

            const [deletedComment] = await CommentsTableTestHelper.findCommentById(commentId);
            expect(deletedComment).toBeDefined();
            expect(deletedComment.is_deleted).toEqual(true);
        });

        it('should throw NotFoundError if comment to delete does not exist', async () => {
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
            await expect(commentRepositoryPostgres.deleteCommentById('nonexistent-comment-delete'))
                .rejects.toThrowError(NotFoundError);
        });
    });

    describe('getCommentsByThreadId function', () => {
        const user1 = testUserId; // 'user-delete-owner' (username: 'deletecommentowner')
        const user2 = anotherUserId; // 'user-another' (username: 'anotheruserfordelete')
        const currentTestThreadId = testThreadId; // 'thread-delete-test'

        it('should return empty array if thread has no comments', async () => {
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
            const comments = await commentRepositoryPostgres.getCommentsByThreadId(currentTestThreadId);
            expect(comments).toEqual([]);
        });

        it('should return comments for a thread ordered by date ascending', async () => {
            // Arrange: Add comments with different dates
            await CommentsTableTestHelper.addComment({
                id: 'comment-c1', owner: user1, threadId: currentTestThreadId, content: 'First comment', date: new Date('2023-01-01T10:00:00.000Z'),
            });
            await CommentsTableTestHelper.addComment({
                id: 'comment-c3', owner: user2, threadId: currentTestThreadId, content: 'Third comment', date: new Date('2023-01-01T12:00:00.000Z'), isDeleted: true,
            });
            await CommentsTableTestHelper.addComment({
                id: 'comment-c2', owner: user1, threadId: currentTestThreadId, content: 'Second comment', date: new Date('2023-01-01T11:00:00.000Z'),
            });

            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

            // Action
            const comments = await commentRepositoryPostgres.getCommentsByThreadId(currentTestThreadId);

            // Assert
            expect(comments).toHaveLength(3);
            expect(comments[0].id).toEqual('comment-c1');
            expect(comments[0].username).toEqual('deletecommentowner');
            expect(comments[0].content).toEqual('First comment');
            expect(comments[0].is_deleted).toEqual(false);

            expect(comments[1].id).toEqual('comment-c2');
            expect(comments[1].username).toEqual('deletecommentowner');
            expect(comments[1].content).toEqual('Second comment');
            expect(comments[1].is_deleted).toEqual(false);

            expect(comments[2].id).toEqual('comment-c3');
            expect(comments[2].username).toEqual('anotheruserfordelete');
            expect(comments[2].content).toEqual('Third comment'); // Raw content from DB
            expect(comments[2].is_deleted).toEqual(true);
        });
    });

    describe('verifyCommentExists function', () => { // Added
        const commentId = 'comment-to-verify';

        beforeEach(async () => {
            // Ensure the comment exists for positive test cases
            await CommentsTableTestHelper.addComment({
                id: commentId,
                owner: testUserId,
                threadId: testThreadId,
                content: 'A comment to verify existence',
            });
        });

        it('should not throw NotFoundError if comment exists and is not deleted', async () => {
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
            await expect(commentRepositoryPostgres.verifyCommentExists(commentId))
                .resolves.not.toThrowError(NotFoundError);
        });

        it('should throw NotFoundError if comment does not exist', async () => {
            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
            await expect(commentRepositoryPostgres.verifyCommentExists('nonexistent-comment-id'))
                .rejects.toThrowError(NotFoundError);
        });

        it('should throw NotFoundError if comment exists but is soft-deleted', async () => {
            // Soft-delete the comment
            await pool.query('UPDATE comments SET is_deleted = TRUE WHERE id = $1', [commentId]);

            const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
            await expect(commentRepositoryPostgres.verifyCommentExists(commentId))
                .rejects.toThrowError(NotFoundError);
        });
    });
});