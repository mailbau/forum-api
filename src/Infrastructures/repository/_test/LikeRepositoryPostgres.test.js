const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const LikesTableTestHelper = require('../../../../tests/LikesTableTestHelper');
const pool = require('../../../database/postgres/pool');
const LikeRepositoryPostgres = require('../LikeRepositoryPostgres');

describe('LikeRepositoryPostgres', () => {
    const testUserId = 'user-like-test';
    const anotherUserId = 'user-another-like';
    const testThreadId = 'thread-like-test';
    const testCommentId = 'comment-like-test';

    beforeAll(async () => {
        // Setup dependencies
        await UsersTableTestHelper.addUser({ id: testUserId, username: 'liker' });
        await UsersTableTestHelper.addUser({ id: anotherUserId, username: 'anotherliker' });
        await ThreadsTableTestHelper.addThread({ id: testThreadId, owner: testUserId });
        await CommentsTableTestHelper.addComment({ id: testCommentId, owner: testUserId, threadId: testThreadId });
    });

    afterEach(async () => {
        await LikesTableTestHelper.cleanTable();
    });

    afterAll(async () => {
        await UsersTableTestHelper.cleanTable();
        await ThreadsTableTestHelper.cleanTable();
        await CommentsTableTestHelper.cleanTable();
        await pool.end();
    });

    describe('addLike function', () => {
        it('should persist a new like', async () => {
            // Arrange
            const fakeIdGenerator = () => 'like123';
            const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, fakeIdGenerator);

            // Action
            await likeRepositoryPostgres.addLike(testCommentId, testUserId);

            // Assert
            const likes = await LikesTableTestHelper.findLikeById('like-like123');
            expect(likes).toHaveLength(1);
            expect(likes[0].comment_id).toEqual(testCommentId);
            expect(likes[0].owner).toEqual(testUserId);
        });
    });

    describe('removeLike function', () => {
        it('should remove a like from the database', async () => {
            // Arrange
            await LikesTableTestHelper.addLike({ id: 'like-to-remove', commentId: testCommentId, owner: testUserId });
            const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

            // Action
            await likeRepositoryPostgres.removeLike(testCommentId, testUserId);

            // Assert
            const likes = await LikesTableTestHelper.findLikeById('like-to-remove');
            expect(likes).toHaveLength(0);
        });
    });

    describe('verifyLikeExists function', () => {
        it('should return true if like exists', async () => {
            // Arrange
            await LikesTableTestHelper.addLike({ commentId: testCommentId, owner: testUserId });
            const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

            // Action & Assert
            await expect(likeRepositoryPostgres.verifyLikeExists(testCommentId, testUserId)).resolves.toBe(true);
        });

        it('should return false if like does not exist', async () => {
            // Arrange
            const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

            // Action & Assert
            await expect(likeRepositoryPostgres.verifyLikeExists(testCommentId, testUserId)).resolves.toBe(false);
        });
    });
});