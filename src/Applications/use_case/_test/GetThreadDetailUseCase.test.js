const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository'); // Added
const ThreadDetail = require('../../../Domains/threads/entities/ThreadDetail');
const CommentDetail = require('../../../Domains/comments/entities/CommentDetail');
const ReplyDetail = require('../../../Domains/replies/entities/ReplyDetail'); // Added
const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('GetThreadDetailUseCase', () => {
    it('should orchestrate the get thread detail action correctly with comments and replies', async () => {
        // Arrange
        const threadId = 'thread-123';
        const mockThreadData = {
            id: threadId, title: 'Test Thread', body: 'Thread body',
            date: new Date('2023-01-01T00:00:00.000Z'), username: 'user1',
        };
        const mockRawCommentsData = [
            {
                id: 'comment-1', username: 'user2', date: new Date('2023-01-01T00:05:00.000Z'),
                content: 'First comment', is_deleted: false,
            },
            {
                id: 'comment-2', username: 'user1', date: new Date('2023-01-01T00:10:00.000Z'),
                content: 'This was deleted', is_deleted: true,
            },
        ];
        const mockRawRepliesDataForComment1 = [
            {
                id: 'reply-c1-1', username: 'user1', date: new Date('2023-01-01T00:06:00.000Z'),
                content: 'Reply to first comment', is_deleted: false,
            },
            {
                id: 'reply-c1-2', username: 'user2', date: new Date('2023-01-01T00:07:00.000Z'),
                content: 'Deleted reply to first comment', is_deleted: true,
            },
        ];

        const mockThreadRepository = new ThreadRepository();
        const mockCommentRepository = new CommentRepository();
        const mockReplyRepository = new ReplyRepository(); // Added

        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.resolve());
        mockThreadRepository.getThreadById = jest.fn(() => Promise.resolve(mockThreadData));
        mockCommentRepository.getCommentsByThreadId = jest.fn(() => Promise.resolve(mockRawCommentsData));
        // Mock getRepliesByCommentId
        mockReplyRepository.getRepliesByCommentId = jest.fn((commentId) => {
            if (commentId === 'comment-1') {
                return Promise.resolve(mockRawRepliesDataForComment1);
            }
            return Promise.resolve([]); // No replies for other comments in this test
        });

        const getThreadDetailUseCase = new GetThreadDetailUseCase({
            threadRepository: mockThreadRepository,
            commentRepository: mockCommentRepository,
            replyRepository: mockReplyRepository, // Added
        });

        // Action
        const threadDetail = await getThreadDetailUseCase.execute(threadId);

        // Assert
        expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(threadId);
        expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
        expect(mockCommentRepository.getCommentsByThreadId).toHaveBeenCalledWith(threadId);
        expect(mockReplyRepository.getRepliesByCommentId).toHaveBeenCalledWith('comment-1');
        expect(mockReplyRepository.getRepliesByCommentId).toHaveBeenCalledWith('comment-2'); // Called for each comment

        expect(threadDetail).toBeInstanceOf(ThreadDetail);
        expect(threadDetail.comments).toHaveLength(2);

        // Check comment 1 and its replies
        expect(threadDetail.comments[0]).toBeInstanceOf(CommentDetail);
        expect(threadDetail.comments[0].id).toEqual('comment-1');
        expect(threadDetail.comments[0].content).toEqual('First comment');
        expect(threadDetail.comments[0].replies).toHaveLength(2);
        expect(threadDetail.comments[0].replies[0]).toBeInstanceOf(ReplyDetail);
        expect(threadDetail.comments[0].replies[0].id).toEqual('reply-c1-1');
        expect(threadDetail.comments[0].replies[0].content).toEqual('Reply to first comment');
        expect(threadDetail.comments[0].replies[1].id).toEqual('reply-c1-2');
        expect(threadDetail.comments[0].replies[1].content).toEqual('**balasan telah dihapus**');

        // Check comment 2 (deleted, no replies mocked for it here)
        expect(threadDetail.comments[1].id).toEqual('comment-2');
        expect(threadDetail.comments[1].content).toEqual('**komentar telah dihapus**');
        expect(threadDetail.comments[1].replies).toEqual([]);
    });

    it('should throw NotFoundError if thread does not exist', async () => {
        const threadId = 'nonexistent-thread';
        const mockThreadRepository = new ThreadRepository();
        const mockCommentRepository = new CommentRepository();

        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.reject(new NotFoundError('thread tidak ditemukan')));
        mockThreadRepository.getThreadById = jest.fn(); // Won't be called
        mockCommentRepository.getCommentsByThreadId = jest.fn(); // Won't be called

        const getThreadDetailUseCase = new GetThreadDetailUseCase({
            threadRepository: mockThreadRepository,
            commentRepository: mockCommentRepository,
        });

        await expect(getThreadDetailUseCase.execute(threadId))
            .rejects.toThrowError(NotFoundError);
        expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(threadId);
        expect(mockThreadRepository.getThreadById).not.toHaveBeenCalled();
    });
});