const NewThread = require('../NewThread');

describe('NewThread entities', () => {
    it('should throw error when payload did not contain needed property (title)', () => {
        // Arrange
        const payload = {
            body: 'thread body',
        };

        // Action and Assert
        expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error when payload did not contain needed property (body)', () => {
        // Arrange
        const payload = {
            title: 'thread title',
        };

        // Action and Assert
        expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error when payload did not meet data type specification (title not string)', () => {
        // Arrange
        const payload = {
            title: 123,
            body: 'thread body',
        };

        // Action and Assert
        expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });

    it('should throw error when payload did not meet data type specification (body not string)', () => {
        // Arrange
        const payload = {
            title: 'thread title',
            body: true,
        };

        // Action and Assert
        expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });

    it('should create NewThread object correctly', () => {
        // Arrange
        const payload = {
            title: 'A Thread Title',
            body: 'The body of the thread.',
        };

        // Action
        const newThread = new NewThread(payload);

        // Assert
        expect(newThread.title).toEqual(payload.title);
        expect(newThread.body).toEqual(payload.body);
    });
});