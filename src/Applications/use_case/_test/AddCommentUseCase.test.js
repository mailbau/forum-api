const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const NewComment = require('../../../Domains/comments/entities/NewComment');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddCommentUseCase = require('../AddCommentUseCase');

describe('AddCommentUseCase', () => {
    it('should orchestrate the add comment action correctly', async () => {
        // Arrange
        const useCasePayload = {
            content: 'This is a valid comment.',
        };
        const threadId = 'thread-123';
        const ownerId = 'user-123';

        const mockAddedComment = new AddedComment({
            id: 'comment-123',
            content: useCasePayload.content,
            owner: ownerId,
        });

        /** creating dependency of use case */
        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();

        /** mocking needed function */
        mockThreadRepository.verifyThreadExists = jest.fn()
            .mockImplementation(() => Promise.resolve());
        mockCommentRepository.addComment = jest.fn()
            .mockImplementation(() => Promise.resolve(mockAddedComment));

        /** creating use case instance */
        const addCommentUseCase = new AddCommentUseCase({
            commentRepository: mockCommentRepository,
            threadRepository: mockThreadRepository,
        });

        // Action
        const addedComment = await addCommentUseCase.execute(useCasePayload, threadId, ownerId);

        // Assert
        expect(addedComment).toStrictEqual(mockAddedComment);
        expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(threadId);
        // Verify that NewComment was implicitly created and validated (content)
        // and correct payload was passed to comment repository
        expect(mockCommentRepository.addComment).toBeCalledWith({
            content: useCasePayload.content,
            threadId,
            owner: ownerId,
        });
    });

    it('should throw error if thread does not exist', async () => {
        // Arrange
        const useCasePayload = { content: 'Valid comment' };
        const threadId = 'nonexistent-thread-123';
        const ownerId = 'user-123';

        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();

        // Explicitly mock addComment even if you don't expect it to be called
        mockCommentRepository.addComment = jest.fn();

        mockThreadRepository.verifyThreadExists = jest.fn()
            .mockImplementation(() => Promise.reject(new Error('THREAD_REPOSITORY.THREAD_NOT_FOUND')));

        const addCommentUseCase = new AddCommentUseCase({
            commentRepository: mockCommentRepository,
            threadRepository: mockThreadRepository,
        });

        // Action & Assert
        await expect(addCommentUseCase.execute(useCasePayload, threadId, ownerId))
            .rejects.toThrowError('THREAD_REPOSITORY.THREAD_NOT_FOUND');
        expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(threadId);
        expect(mockCommentRepository.addComment).not.toBeCalled();
    });
});