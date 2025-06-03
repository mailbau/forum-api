const AddedComment = require('../AddedComment');

describe('AddedComment entities', () => {
    it('should throw error when payload did not contain needed property (id)', () => {
        const payload = { content: 'comment content', owner: 'user-123' };
        expect(() => new AddedComment(payload)).toThrowError('ADDED_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error when payload did not contain needed property (content)', () => {
        const payload = { id: 'comment-123', owner: 'user-123' };
        expect(() => new AddedComment(payload)).toThrowError('ADDED_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error when payload did not contain needed property (owner)', () => {
        const payload = { id: 'comment-123', content: 'comment content' };
        expect(() => new AddedComment(payload)).toThrowError('ADDED_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error when payload did not meet data type specification (id not string)', () => {
        const payload = { id: 123, content: 'comment content', owner: 'user-123' };
        expect(() => new AddedComment(payload)).toThrowError('ADDED_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });

    it('should throw error when payload did not meet data type specification (content not string)', () => {
        const payload = { id: 'comment-123', content: true, owner: 'user-123' };
        expect(() => new AddedComment(payload)).toThrowError('ADDED_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });

    it('should throw error when payload did not meet data type specification (owner not string)', () => {
        const payload = { id: 'comment-123', content: 'comment content', owner: 123 };
        expect(() => new AddedComment(payload)).toThrowError('ADDED_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });

    it('should create AddedComment object correctly', () => {
        const payload = {
            id: 'comment-123',
            content: 'This is a comment.',
            owner: 'user-123',
        };
        const addedComment = new AddedComment(payload);
        expect(addedComment.id).toEqual(payload.id);
        expect(addedComment.content).toEqual(payload.content);
        expect(addedComment.owner).toEqual(payload.owner);
    });
});