// src/Domains/replies/entities/_test/ReplyDetail.test.js
const ReplyDetail = require('../ReplyDetail');

describe('ReplyDetail entity', () => {
    it('should create ReplyDetail object correctly for non-deleted reply', () => {
        const payload = {
            id: 'reply-123',
            username: 'johndoe',
            date: '2021-08-08T07:59:48.766Z',
            content: 'sebuah balasan',
            isDeleted: false,
        };
        const replyDetail = new ReplyDetail(payload);

        expect(replyDetail.id).toEqual(payload.id);
        expect(replyDetail.username).toEqual(payload.username);
        expect(replyDetail.date).toEqual(payload.date);
        expect(replyDetail.content).toEqual(payload.content);
    });

    it('should create ReplyDetail object with transformed content for deleted reply', () => {
        const payload = {
            id: 'reply-456',
            username: 'dicoding',
            date: '2021-08-08T08:07:01.522Z',
            content: 'original reply content',
            isDeleted: true,
        };
        const replyDetail = new ReplyDetail(payload);

        expect(replyDetail.id).toEqual(payload.id);
        expect(replyDetail.username).toEqual(payload.username);
        expect(replyDetail.date).toEqual(payload.date);
        expect(replyDetail.content).toEqual('**balasan telah dihapus**');
    });

    it('should throw error if payload does not contain needed property (e.g., username)', () => {
        const payload = {
            id: 'reply-123',
            // username is missing
            date: '2021-08-08T07:59:48.766Z',
            content: 'sebuah balasan',
            isDeleted: false,
        };
        expect(() => new ReplyDetail(payload)).toThrowError('REPLY_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error if payload does not meet data type specification (e.g., id not string)', () => {
        const payload = {
            id: 123,
            username: 'johndoe',
            date: '2021-08-08T07:59:48.766Z',
            content: 'sebuah balasan',
            isDeleted: false,
        };
        expect(() => new ReplyDetail(payload)).toThrowError('REPLY_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });

    it('should throw error if date is not a string or Date object', () => {
        const payload = {
            id: 'reply-123',
            username: 'johndoe',
            date: 123456789, // not a string or Date
            content: 'sebuah balasan',
            isDeleted: false,
        };
        expect(() => new ReplyDetail(payload)).toThrowError('REPLY_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });
});