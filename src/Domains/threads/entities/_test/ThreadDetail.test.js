// src/Domains/threads/entities/_test/ThreadDetail.test.js
const ThreadDetail = require('../ThreadDetail');
const CommentDetail = require('../../../comments/entities/CommentDetail');

describe('ThreadDetail entity', () => {
    it('should create ThreadDetail object correctly', () => {
        const commentPayload = {
            id: 'comment-123',
            username: 'johndoe',
            date: new Date().toISOString(),
            content: 'sebuah comment',
            isDeleted: false,
            replies: [],
        };
        const commentDetail = new CommentDetail(commentPayload);

        const payload = {
            id: 'thread-123',
            title: 'sebuah thread',
            body: 'sebuah body thread',
            date: new Date().toISOString(),
            username: 'dicoding',
            comments: [commentDetail],
        };
        const threadDetail = new ThreadDetail(payload);

        expect(threadDetail.id).toEqual(payload.id);
        expect(threadDetail.title).toEqual(payload.title);
        expect(threadDetail.body).toEqual(payload.body);
        expect(threadDetail.date).toEqual(payload.date);
        expect(threadDetail.username).toEqual(payload.username);
        expect(threadDetail.comments).toEqual([commentDetail]);
        expect(threadDetail.comments[0]).toBeInstanceOf(CommentDetail);
    });

    it('should throw error if payload does not contain needed property', () => {
        const payload = {
            id: 'thread-123',
            title: 'sebuah thread',
            // body is missing
            date: new Date().toISOString(),
            username: 'dicoding',
            comments: [],
        };
        expect(() => new ThreadDetail(payload)).toThrowError('THREAD_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error if payload does not meet data type specification (comments not array)', () => {
        const payload = {
            id: 'thread-123',
            title: 'sebuah thread',
            body: 'sebuah body thread',
            date: new Date().toISOString(),
            username: 'dicoding',
            comments: 'not-an-array',
        };
        expect(() => new ThreadDetail(payload)).toThrowError('THREAD_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });
});