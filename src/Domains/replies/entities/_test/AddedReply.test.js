const AddedReply = require('../AddedReply');

describe('AddedReply entity', () => {
    it('should throw error when payload does not contain id property', () => {
        const payload = { content: 'a reply', owner: 'user-123' };
        expect(() => new AddedReply(payload)).toThrowError('ADDED_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error when payload does not contain content property', () => {
        const payload = { id: 'reply-123', owner: 'user-123' };
        expect(() => new AddedReply(payload)).toThrowError('ADDED_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error when payload does not contain owner property', () => {
        const payload = { id: 'reply-123', content: 'a reply' };
        expect(() => new AddedReply(payload)).toThrowError('ADDED_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error when id is not a string', () => {
        const payload = { id: 123, content: 'a reply', owner: 'user-123' };
        expect(() => new AddedReply(payload)).toThrowError('ADDED_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });

    it('should throw error when content is not a string', () => {
        const payload = { id: 'reply-123', content: true, owner: 'user-123' };
        expect(() => new AddedReply(payload)).toThrowError('ADDED_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });

    it('should throw error when owner is not a string', () => {
        const payload = { id: 'reply-123', content: 'a reply', owner: 123 };
        expect(() => new AddedReply(payload)).toThrowError('ADDED_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });

    it('should create AddedReply object correctly', () => {
        const payload = {
            id: 'reply-123',
            content: 'This is a reply.',
            owner: 'user-123',
        };
        const addedReply = new AddedReply(payload);
        expect(addedReply.id).toEqual(payload.id);
        expect(addedReply.content).toEqual(payload.content);
        expect(addedReply.owner).toEqual(payload.owner);
    });
});