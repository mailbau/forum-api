const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const DeleteReplyUseCase = require('../DeleteReplyUseCase');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('DeleteReplyUseCase', () => {
    it('should orchestrate the delete reply action correctly', async () => {
        // Arrange
        const threadId = 'thread-123';
        const commentId = 'comment-123';
        const replyId = 'reply-123';
        const ownerId = 'user-123';

        const mockReplyRepository = new ReplyRepository();
        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();

        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.resolve());
        mockCommentRepository.verifyCommentExists = jest.fn(() => Promise.resolve());
        mockReplyRepository.verifyReplyOwner = jest.fn(() => Promise.resolve());
        mockReplyRepository.deleteReplyById = jest.fn(() => Promise.resolve());

        const deleteReplyUseCase = new DeleteReplyUseCase({
            replyRepository: mockReplyRepository,
            commentRepository: mockCommentRepository,
            threadRepository: mockThreadRepository,
        });

        // Action
        await deleteReplyUseCase.execute(threadId, commentId, replyId, ownerId);

        // Assert
        expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(threadId);
        expect(mockCommentRepository.verifyCommentExists).toHaveBeenCalledWith(commentId);
        expect(mockReplyRepository.verifyReplyOwner).toHaveBeenCalledWith(replyId, ownerId);
        expect(mockReplyRepository.deleteReplyById).toHaveBeenCalledWith(replyId);
    });

    it('should throw NotFoundError if thread does not exist', async () => {
        const useCasePayload = {
            threadId: 'nonexistent-thread', commentId: 'comment-123', replyId: 'reply-123', ownerId: 'user-123',
        };
        const mockReplyRepository = new ReplyRepository();
        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();
        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.reject(new NotFoundError('thread not found')));

        const deleteReplyUseCase = new DeleteReplyUseCase({
            replyRepository: mockReplyRepository, commentRepository: mockCommentRepository, threadRepository: mockThreadRepository,
        });

        await expect(deleteReplyUseCase.execute(useCasePayload.threadId, useCasePayload.commentId, useCasePayload.replyId, useCasePayload.ownerId))
            .rejects.toThrowError(NotFoundError);
        expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(useCasePayload.threadId);
    });

    it('should throw NotFoundError if comment does not exist', async () => {
        const useCasePayload = {
            threadId: 'thread-123', commentId: 'nonexistent-comment', replyId: 'reply-123', ownerId: 'user-123',
        };
        const mockReplyRepository = new ReplyRepository();
        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();
        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.resolve());
        mockCommentRepository.verifyCommentExists = jest.fn(() => Promise.reject(new NotFoundError('comment not found')));

        const deleteReplyUseCase = new DeleteReplyUseCase({
            replyRepository: mockReplyRepository, commentRepository: mockCommentRepository, threadRepository: mockThreadRepository,
        });

        await expect(deleteReplyUseCase.execute(useCasePayload.threadId, useCasePayload.commentId, useCasePayload.replyId, useCasePayload.ownerId))
            .rejects.toThrowError(NotFoundError);
        expect(mockCommentRepository.verifyCommentExists).toHaveBeenCalledWith(useCasePayload.commentId);
    });

    it('should throw AuthorizationError if user is not the reply owner', async () => {
        const useCasePayload = {
            threadId: 'thread-123', commentId: 'comment-123', replyId: 'reply-123', ownerId: 'user-not-owner',
        };
        const mockReplyRepository = new ReplyRepository();
        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();
        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.resolve());
        mockCommentRepository.verifyCommentExists = jest.fn(() => Promise.resolve());
        mockReplyRepository.verifyReplyOwner = jest.fn(() => Promise.reject(new AuthorizationError('not owner')));

        const deleteReplyUseCase = new DeleteReplyUseCase({
            replyRepository: mockReplyRepository, commentRepository: mockCommentRepository, threadRepository: mockThreadRepository,
        });

        await expect(deleteReplyUseCase.execute(useCasePayload.threadId, useCasePayload.commentId, useCasePayload.replyId, useCasePayload.ownerId))
            .rejects.toThrowError(AuthorizationError);
        expect(mockReplyRepository.verifyReplyOwner).toHaveBeenCalledWith(useCasePayload.replyId, useCasePayload.ownerId);
    });

    it('should throw NotFoundError if reply does not exist (checked by verifyReplyOwner)', async () => {
        const useCasePayload = {
            threadId: 'thread-123', commentId: 'comment-123', replyId: 'nonexistent-reply', ownerId: 'user-123',
        };
        const mockReplyRepository = new ReplyRepository();
        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();
        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.resolve());
        mockCommentRepository.verifyCommentExists = jest.fn(() => Promise.resolve());
        mockReplyRepository.verifyReplyOwner = jest.fn(() => Promise.reject(new NotFoundError('reply not found')));

        const deleteReplyUseCase = new DeleteReplyUseCase({
            replyRepository: mockReplyRepository, commentRepository: mockCommentRepository, threadRepository: mockThreadRepository,
        });

        await expect(deleteReplyUseCase.execute(useCasePayload.threadId, useCasePayload.commentId, useCasePayload.replyId, useCasePayload.ownerId))
            .rejects.toThrowError(NotFoundError);
        expect(mockReplyRepository.verifyReplyOwner).toHaveBeenCalledWith(useCasePayload.replyId, useCasePayload.ownerId);
    });
});