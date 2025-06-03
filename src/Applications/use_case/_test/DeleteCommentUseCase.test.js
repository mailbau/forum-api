// src/Applications/use_case/_test/DeleteCommentUseCase.test.js
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const DeleteCommentUseCase = require('../DeleteCommentUseCase');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('DeleteCommentUseCase', () => {
    it('should orchestrate the delete comment action correctly', async () => {
        // Arrange
        const threadId = 'thread-123';
        const commentId = 'comment-123';
        const ownerId = 'user-123';

        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();

        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.resolve());
        mockCommentRepository.verifyCommentOwner = jest.fn(() => Promise.resolve());
        mockCommentRepository.deleteCommentById = jest.fn(() => Promise.resolve());

        const deleteCommentUseCase = new DeleteCommentUseCase({
            commentRepository: mockCommentRepository,
            threadRepository: mockThreadRepository,
        });

        // Action
        await deleteCommentUseCase.execute(threadId, commentId, ownerId);

        // Assert
        expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(threadId);
        expect(mockCommentRepository.verifyCommentOwner).toHaveBeenCalledWith(commentId, ownerId);
        expect(mockCommentRepository.deleteCommentById).toHaveBeenCalledWith(commentId);
    });

    it('should throw NotFoundError if thread does not exist', async () => {
        // Arrange
        const threadId = 'nonexistent-thread';
        const commentId = 'comment-123';
        const ownerId = 'user-123';

        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();

        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.reject(new NotFoundError('thread tidak ditemukan')));
        mockCommentRepository.verifyCommentOwner = jest.fn(); // Won't be called
        mockCommentRepository.deleteCommentById = jest.fn(); // Won't be called

        const deleteCommentUseCase = new DeleteCommentUseCase({
            commentRepository: mockCommentRepository,
            threadRepository: mockThreadRepository,
        });

        // Action & Assert
        await expect(deleteCommentUseCase.execute(threadId, commentId, ownerId))
            .rejects.toThrowError(NotFoundError);
        expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(threadId);
        expect(mockCommentRepository.verifyCommentOwner).not.toHaveBeenCalled();
        expect(mockCommentRepository.deleteCommentById).not.toHaveBeenCalled();
    });

    it('should throw AuthorizationError if user is not the comment owner', async () => {
        // Arrange
        const threadId = 'thread-123';
        const commentId = 'comment-123';
        const ownerId = 'user-not-owner';

        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();

        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.resolve());
        mockCommentRepository.verifyCommentOwner = jest.fn(() => Promise.reject(new AuthorizationError('anda tidak berhak mengakses resource ini')));
        mockCommentRepository.deleteCommentById = jest.fn(); // Won't be called

        const deleteCommentUseCase = new DeleteCommentUseCase({
            commentRepository: mockCommentRepository,
            threadRepository: mockThreadRepository,
        });

        // Action & Assert
        await expect(deleteCommentUseCase.execute(threadId, commentId, ownerId))
            .rejects.toThrowError(AuthorizationError);
        expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(threadId);
        expect(mockCommentRepository.verifyCommentOwner).toHaveBeenCalledWith(commentId, ownerId);
        expect(mockCommentRepository.deleteCommentById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if comment does not exist (as part of verifyCommentOwner)', async () => {
        // Arrange
        const threadId = 'thread-123';
        const commentId = 'nonexistent-comment';
        const ownerId = 'user-123';

        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();

        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.resolve());
        // Simulate comment not found during ownership check
        mockCommentRepository.verifyCommentOwner = jest.fn(() => Promise.reject(new NotFoundError('komentar tidak ditemukan')));
        mockCommentRepository.deleteCommentById = jest.fn();

        const deleteCommentUseCase = new DeleteCommentUseCase({
            commentRepository: mockCommentRepository,
            threadRepository: mockThreadRepository,
        });

        // Action & Assert
        await expect(deleteCommentUseCase.execute(threadId, commentId, ownerId))
            .rejects.toThrowError(NotFoundError);
        expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(threadId);
        expect(mockCommentRepository.verifyCommentOwner).toHaveBeenCalledWith(commentId, ownerId);
        expect(mockCommentRepository.deleteCommentById).not.toHaveBeenCalled();
    });
});