// src/Domains/comments/entities/_test/CommentDetail.test.js
const CommentDetail = require('../CommentDetail');

describe('CommentDetail entity', () => {
    it('should create CommentDetail object correctly for non-deleted comment', () => {
        const payload = {
            id: 'comment-123',
            username: 'johndoe',
            date: new Date().toISOString(),
            content: 'sebuah comment',
            isDeleted: false,
        };
        const commentDetail = new CommentDetail(payload);

        expect(commentDetail.id).toEqual(payload.id);
        expect(commentDetail.username).toEqual(payload.username);
        expect(commentDetail.date).toEqual(payload.date);
        expect(commentDetail.content).toEqual(payload.content);
    });

    it('should create CommentDetail object correctly for deleted comment', () => {
        const payload = {
            id: 'comment-456',
            username: 'dicoding',
            date: new Date().toISOString(),
            content: 'original content, should be replaced',
            isDeleted: true,
        };
        const commentDetail = new CommentDetail(payload);

        expect(commentDetail.id).toEqual(payload.id);
        expect(commentDetail.username).toEqual(payload.username);
        expect(commentDetail.date).toEqual(payload.date);
        expect(commentDetail.content).toEqual('**komentar telah dihapus**');
    });

    it('should throw error if payload does not contain needed property', () => {
        const payload = {
            id: 'comment-123',
            username: 'johndoe',
            // date is missing
            content: 'sebuah comment',
            isDeleted: false,
        };
        expect(() => new CommentDetail(payload)).toThrowError('COMMENT_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error if payload does not meet data type specification', () => {
        const payload = {
            id: 123, // not a string
            username: 'johndoe',
            date: '2021-08-08T07:22:33.555Z',
            content: 'sebuah comment',
            isDeleted: false,
        };
        expect(() => new CommentDetail(payload)).toThrowError('COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });
});