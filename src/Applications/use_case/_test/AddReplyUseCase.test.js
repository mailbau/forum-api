// src/Applications/use_case/_test/AddReplyUseCase.test.js
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const NewReply = require('../../../Domains/replies/entities/NewReply');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddReplyUseCase = require('../AddReplyUseCase');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('AddReplyUseCase', () => {
    it('should orchestrate the add reply action correctly', async () => {
        // Arrange
        const useCasePayload = {
            content: 'This is a valid reply.',
        };
        const threadId = 'thread-123';
        const commentId = 'comment-123';
        const ownerId = 'user-123';

        const mockAddedReply = new AddedReply({
            id: 'reply-123',
            content: useCasePayload.content,
            owner: ownerId,
        });

        const mockReplyRepository = new ReplyRepository();
        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();

        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.resolve());
        mockCommentRepository.verifyCommentExists = jest.fn(() => Promise.resolve());
        mockReplyRepository.addReply = jest.fn(() => Promise.resolve(mockAddedReply));

        const addReplyUseCase = new AddReplyUseCase({
            replyRepository: mockReplyRepository,
            commentRepository: mockCommentRepository,
            threadRepository: mockThreadRepository,
        });

        // Action
        const addedReply = await addReplyUseCase.execute(useCasePayload, threadId, commentId, ownerId);

        // Assert
        expect(addedReply).toStrictEqual(mockAddedReply);
        expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(threadId);
        expect(mockCommentRepository.verifyCommentExists).toHaveBeenCalledWith(commentId);
        expect(mockReplyRepository.addReply).toHaveBeenCalledWith({
            content: useCasePayload.content,
            commentId,
            owner: ownerId,
        });
    });

    it('should throw NotFoundError if thread does not exist', async () => {
        const useCasePayload = { content: 'A reply' };
        const threadId = 'nonexistent-thread';
        const commentId = 'comment-123';
        const ownerId = 'user-123';

        const mockReplyRepository = new ReplyRepository();
        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();

        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.reject(new NotFoundError('thread not found')));
        mockCommentRepository.verifyCommentExists = jest.fn(); // Should not be called
        mockReplyRepository.addReply = jest.fn(); // Should not be called

        const addReplyUseCase = new AddReplyUseCase({
            replyRepository: mockReplyRepository,
            commentRepository: mockCommentRepository,
            threadRepository: mockThreadRepository,
        });

        await expect(addReplyUseCase.execute(useCasePayload, threadId, commentId, ownerId))
            .rejects.toThrowError(NotFoundError);
        expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(threadId);
        expect(mockCommentRepository.verifyCommentExists).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if comment does not exist', async () => {
        const useCasePayload = { content: 'A reply' };
        const threadId = 'thread-123';
        const commentId = 'nonexistent-comment';
        const ownerId = 'user-123';

        const mockReplyRepository = new ReplyRepository();
        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();

        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.resolve());
        mockCommentRepository.verifyCommentExists = jest.fn(() => Promise.reject(new NotFoundError('comment not found')));
        mockReplyRepository.addReply = jest.fn(); // Should not be called

        const addReplyUseCase = new AddReplyUseCase({
            replyRepository: mockReplyRepository,
            commentRepository: mockCommentRepository,
            threadRepository: mockThreadRepository,
        });

        await expect(addReplyUseCase.execute(useCasePayload, threadId, commentId, ownerId))
            .rejects.toThrowError(NotFoundError);
        expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(threadId);
        expect(mockCommentRepository.verifyCommentExists).toHaveBeenCalledWith(commentId);
    });
});