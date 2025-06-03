// src/Domains/comments/entities/_test/NewComment.test.js
const NewComment = require('../NewComment');

describe('NewComment entities', () => {
    it('should throw error when payload does not contain content property', () => {
        const payload = {};
        expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error when content is null', () => {
        const payload = { content: null };
        expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error when content is not a string', () => {
        const payload = { content: 123 };
        expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });

    it('should throw error when content is an empty string', () => {
        const payload = { content: '' };
        expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.CANNOT_BE_EMPTY_STRING');
    });

    it('should throw error when content is a string with only spaces', () => {
        const payload = { content: '   ' };
        expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.CANNOT_BE_EMPTY_STRING');
    });

    it('should create NewComment object correctly', () => {
        const payload = { content: 'This is a comment.' };
        const newComment = new NewComment(payload);
        expect(newComment.content).toEqual(payload.content);
    });
});