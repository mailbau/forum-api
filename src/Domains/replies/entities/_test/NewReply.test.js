// src/Domains/replies/entities/_test/NewReply.test.js
const NewReply = require('../NewReply');

describe('NewReply entity', () => {
    it('should throw error when payload does not contain content property', () => {
        const payload = {};
        expect(() => new NewReply(payload)).toThrowError('NEW_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error when content is null', () => {
        const payload = { content: null };
        expect(() => new NewReply(payload)).toThrowError('NEW_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error when content is not a string', () => {
        const payload = { content: 123 };
        expect(() => new NewReply(payload)).toThrowError('NEW_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });

    it('should throw error when content is an empty string', () => {
        const payload = { content: '' };
        expect(() => new NewReply(payload)).toThrowError('NEW_REPLY.CANNOT_BE_EMPTY_STRING');
    });

    it('should throw error when content is a string with only spaces', () => {
        const payload = { content: '   ' };
        expect(() => new NewReply(payload)).toThrowError('NEW_REPLY.CANNOT_BE_EMPTY_STRING');
    });

    it('should create NewReply object correctly', () => {
        const payload = { content: 'This is a valid reply.' };
        const newReply = new NewReply(payload);
        expect(newReply.content).toEqual(payload.content);
    });
});