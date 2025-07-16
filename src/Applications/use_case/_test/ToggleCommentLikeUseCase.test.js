const LikeRepository = require('../../../Domains/likes/LikeRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const ToggleCommentLikeUseCase = require('../ToggleCommentLikeUseCase');

describe('ToggleCommentLikeUseCase', () => {
    it('should orchestrate the add like action correctly when comment is not liked yet', async () => {
        // Arrange
        const threadId = 'thread-123';
        const commentId = 'comment-123';
        const owner = 'user-123';

        const mockLikeRepository = new LikeRepository();
        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();

        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.resolve());
        mockCommentRepository.verifyCommentExists = jest.fn(() => Promise.resolve());
        mockLikeRepository.verifyLikeExists = jest.fn(() => Promise.resolve(false)); // Not liked yet
        mockLikeRepository.addLike = jest.fn(() => Promise.resolve());
        mockLikeRepository.removeLike = jest.fn(() => Promise.resolve());

        const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
            likeRepository: mockLikeRepository,
            commentRepository: mockCommentRepository,
            threadRepository: mockThreadRepository,
        });

        // Action
        await toggleCommentLikeUseCase.execute(threadId, commentId, owner);

        // Assert
        expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(threadId);
        expect(mockCommentRepository.verifyCommentExists).toHaveBeenCalledWith(commentId);
        expect(mockLikeRepository.verifyLikeExists).toHaveBeenCalledWith(commentId, owner);
        expect(mockLikeRepository.addLike).toHaveBeenCalledWith(commentId, owner);
        expect(mockLikeRepository.removeLike).not.toHaveBeenCalled();
    });

    it('should orchestrate the remove like action correctly when comment is already liked', async () => {
        // Arrange
        const threadId = 'thread-123';
        const commentId = 'comment-123';
        const owner = 'user-123';

        const mockLikeRepository = new LikeRepository();
        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();

        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.resolve());
        mockCommentRepository.verifyCommentExists = jest.fn(() => Promise.resolve());
        mockLikeRepository.verifyLikeExists = jest.fn(() => Promise.resolve(true)); // Already liked
        mockLikeRepository.addLike = jest.fn(() => Promise.resolve());
        mockLikeRepository.removeLike = jest.fn(() => Promise.resolve());

        const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
            likeRepository: mockLikeRepository,
            commentRepository: mockCommentRepository,
            threadRepository: mockThreadRepository,
        });

        // Action
        await toggleCommentLikeUseCase.execute(threadId, commentId, owner);

        // Assert
        expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(threadId);
        expect(mockCommentRepository.verifyCommentExists).toHaveBeenCalledWith(commentId);
        expect(mockLikeRepository.verifyLikeExists).toHaveBeenCalledWith(commentId, owner);
        expect(mockLikeRepository.removeLike).toHaveBeenCalledWith(commentId, owner);
        expect(mockLikeRepository.addLike).not.toHaveBeenCalled();
    });
});