// src/Applications/use_case/_test/GetThreadDetailUseCase.test.js
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadDetail = require('../../../Domains/threads/entities/ThreadDetail');
const CommentDetail = require('../../../Domains/comments/entities/CommentDetail');
const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('GetThreadDetailUseCase', () => {
    it('should orchestrate the get thread detail action correctly', async () => {
        // Arrange
        const threadId = 'thread-123';
        const mockThreadData = {
            id: threadId,
            title: 'Test Thread',
            body: 'Thread body',
            date: new Date('2023-01-01T00:00:00.000Z'),
            username: 'user1',
        };
        const mockRawCommentsData = [
            {
                id: 'comment-1',
                username: 'user2',
                date: new Date('2023-01-01T00:05:00.000Z'),
                content: 'First comment',
                is_deleted: false,
            },
            {
                id: 'comment-2',
                username: 'user1',
                date: new Date('2023-01-01T00:10:00.000Z'),
                content: 'This was deleted',
                is_deleted: true,
            },
        ];

        const mockThreadRepository = new ThreadRepository();
        const mockCommentRepository = new CommentRepository();

        mockThreadRepository.verifyThreadExists = jest.fn(() => Promise.resolve());
        mockThreadRepository.getThreadById = jest.fn(() => Promise.resolve(mockThreadData));
        mockCommentRepository.getCommentsByThreadId = jest.fn(() => Promise.resolve(mockRawCommentsData));

        const getThreadDetailUseCase = new GetThreadDetailUseCase({
            threadRepository: mockThreadRepository,
            commentRepository: mockCommentRepository,
        });

        // Action
        const threadDetail = await getThreadDetailUseCase.execute(threadId);

        // Assert
        expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(threadId);
        expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
        expect(mockCommentRepository.getCommentsByThreadId).toHaveBeenCalledWith(threadId);

        expect(threadDetail).toBeInstanceOf(ThreadDetail);
        expect(threadDetail.id).toEqual(mockThreadData.id);
        expect(threadDetail.title).toEqual(mockThreadData.title);
        expect(threadDetail.body).toEqual(mockThreadData.body);
        expect(threadDetail.date).toEqual(mockThreadData.date);
        expect(threadDetail.username).toEqual(mockThreadData.username);

        expect(threadDetail.comments).toHaveLength(2);
        expect(threadDetail.comments[0]).toBeInstanceOf(CommentDetail);
        expect(threadDetail.comments[0].id).toEqual('comment-1');
        expect(threadDetail.comments[0].username).toEqual('user2');
        expect(threadDetail.comments[0].content).toEqual('First comment');
        expect(threadDetail.comments[0].date).toEqual(mockRawCommentsData[0].date);

        expect(threadDetail.comments[1]).toBeInstanceOf(CommentDetail);
        expect(threadDetail.comments[1].id).toEqual('comment-2');
        expect(threadDetail.comments[1].username).toEqual('user1');
        expect(threadDetail.comments[1].content).toEqual('**komentar telah dihapus**');
        expect(threadDetail.comments[1].date).toEqual(mockRawCommentsData[1].date);
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