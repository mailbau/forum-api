const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const pool = require('../../database/postgres/pool');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('ReplyRepositoryPostgres', () => {
    const userId = 'user-reply-test';
    const threadId = 'thread-reply-test';
    const commentId = 'comment-reply-test';

    beforeAll(async () => {
        await UsersTableTestHelper.cleanTable();
        await ThreadsTableTestHelper.cleanTable();
        await CommentsTableTestHelper.cleanTable();
        await RepliesTableTestHelper.cleanTable(); // Clean replies table too

        await UsersTableTestHelper.addUser({ id: userId, username: 'replyuser' });
        await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId, title: 'Thread for Replies' });
        await CommentsTableTestHelper.addComment({ id: commentId, owner: userId, threadId, content: 'Comment for Replies' });
    });

    afterEach(async () => {
        await RepliesTableTestHelper.cleanTable();
    });

    afterAll(async () => {
        await RepliesTableTestHelper.cleanTable();
        await CommentsTableTestHelper.cleanTable();
        await ThreadsTableTestHelper.cleanTable();
        await UsersTableTestHelper.cleanTable();
        await pool.end();
    });

    describe('addReply function', () => {
        it('should persist new reply and return added reply correctly', async () => {
            // Arrange
            const addReplyPayload = {
                content: 'This is a test reply.',
                commentId,
                owner: userId,
            };
            const fakeIdGenerator = () => 'reply123';
            const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

            // Action
            const addedReply = await replyRepositoryPostgres.addReply(addReplyPayload);
            const replies = await RepliesTableTestHelper.findReplyById('reply-reply123');

            // Assert
            expect(replies).toHaveLength(1);
            expect(replies[0].content).toEqual(addReplyPayload.content);
            expect(replies[0].owner).toEqual(addReplyPayload.owner);
            expect(replies[0].comment_id).toEqual(addReplyPayload.commentId);
            expect(addedReply).toBeInstanceOf(AddedReply);
            expect(addedReply.id).toEqual('reply-reply123');
            expect(addedReply.content).toEqual(addReplyPayload.content);
            expect(addedReply.owner).toEqual(addReplyPayload.owner);
        });
    });

    describe('getRepliesByCommentId function', () => {
        // Use userId, anotherUserId, threadId, commentId from beforeAll
        const user1 = userId; // 'user-reply-test', username 'replyuser'
        // const user2 = anotherUserId; 

        it('should return empty array if comment has no replies', async () => {
            const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});
            const replies = await replyRepositoryPostgres.getRepliesByCommentId(commentId);
            expect(replies).toEqual([]);
        });

        it('should return replies for a comment ordered by date ascending', async () => {
            // Arrange: Add replies
            await RepliesTableTestHelper.addReply({
                id: 'reply-r1', owner: user1, commentId, content: 'First reply', date: new Date('2023-02-01T10:00:00.000Z'),
            });
            await RepliesTableTestHelper.addReply({
                id: 'reply-r3', owner: user1, commentId, content: 'Third reply (deleted)', date: new Date('2023-02-01T12:00:00.000Z'), isDeleted: true,
            });
            await RepliesTableTestHelper.addReply({
                id: 'reply-r2', owner: user1, commentId, content: 'Second reply', date: new Date('2023-02-01T11:00:00.000Z'),
            });

            const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

            // Action
            const replies = await replyRepositoryPostgres.getRepliesByCommentId(commentId);

            // Assert
            expect(replies).toHaveLength(3);
            expect(replies[0].id).toEqual('reply-r1');
            expect(replies[0].username).toEqual('replyuser');
            expect(replies[0].content).toEqual('First reply');
            expect(replies[0].is_deleted).toEqual(false);

            expect(replies[1].id).toEqual('reply-r2');
            expect(replies[1].content).toEqual('Second reply');
            expect(replies[1].is_deleted).toEqual(false);

            expect(replies[2].id).toEqual('reply-r3');
            expect(replies[2].content).toEqual('Third reply (deleted)'); // Raw content
            expect(replies[2].is_deleted).toEqual(true);
        });
    });

    describe('verifyReplyOwner function', () => {
        const replyId = 'reply-verify-owner';
        beforeEach(async () => {
            await RepliesTableTestHelper.addReply({
                id: replyId, owner: userId, commentId, content: 'verify owner reply content',
            });
        });

        it('should not throw error when user is the owner and reply exists and not deleted', async () => {
            const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});
            await expect(replyRepositoryPostgres.verifyReplyOwner(replyId, userId))
                .resolves.not.toThrowError();
        });

        it('should throw AuthorizationError when user is not the owner', async () => {
            const anotherOwnerId = 'user-another-for-reply';
            await UsersTableTestHelper.addUser({ id: anotherOwnerId, username: 'anotherreplyowner' });

            const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});
            await expect(replyRepositoryPostgres.verifyReplyOwner(replyId, anotherOwnerId))
                .rejects.toThrowError(AuthorizationError);
        });

        it('should throw NotFoundError if reply does not exist', async () => {
            const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});
            await expect(replyRepositoryPostgres.verifyReplyOwner('nonexistent-reply', userId))
                .rejects.toThrowError(NotFoundError);
        });

        it('should throw NotFoundError if reply is already soft-deleted', async () => {
            await pool.query('UPDATE replies SET is_deleted = TRUE WHERE id = $1', [replyId]);
            const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});
            await expect(replyRepositoryPostgres.verifyReplyOwner(replyId, userId))
                .rejects.toThrowError(NotFoundError);
        });
    });

    describe('deleteReplyById function (soft delete)', () => {
        const replyIdToDelete = 'reply-to-be-deleted';
        beforeEach(async () => {
            await RepliesTableTestHelper.addReply({
                id: replyIdToDelete, owner: userId, commentId, content: 'this will be deleted',
            });
        });

        it('should soft delete the reply by setting is_deleted to true', async () => {
            const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});
            await replyRepositoryPostgres.deleteReplyById(replyIdToDelete);

            const [deletedReply] = await RepliesTableTestHelper.findReplyById(replyIdToDelete);
            expect(deletedReply).toBeDefined();
            expect(deletedReply.is_deleted).toEqual(true);
        });

        it('should throw NotFoundError if reply to delete does not exist', async () => {
            const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});
            await expect(replyRepositoryPostgres.deleteReplyById('nonexistent-reply-for-delete'))
                .rejects.toThrowError(NotFoundError);
        });
    });
});