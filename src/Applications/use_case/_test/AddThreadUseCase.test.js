const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const NewThread = require('../../../Domains/threads/entities/NewThread');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddThreadUseCase = require('../AddThreadUseCase');

describe('AddThreadUseCase', () => {
    it('should orchestrating the add thread action correctly', async () => {
        // Arrange
        const useCasePayload = {
            title: 'A Valid Thread Title',
            body: 'A valid thread body.',
        };
        const ownerId = 'user-123';

        const mockAddedThread = new AddedThread({
            id: 'thread-123',
            title: useCasePayload.title,
            owner: ownerId,
        });

        /** creating dependency of use case */
        const mockThreadRepository = new ThreadRepository();

        /** mocking needed function */
        mockThreadRepository.addThread = jest.fn()
            .mockImplementation(() => Promise.resolve(mockAddedThread));

        /** creating use case instance */
        const addThreadUseCase = new AddThreadUseCase({
            threadRepository: mockThreadRepository,
        });

        // Action
        const addedThread = await addThreadUseCase.execute(useCasePayload, ownerId);

        // Assert
        expect(addedThread).toStrictEqual(new AddedThread({
            id: 'thread-123',
            title: useCasePayload.title,
            owner: ownerId,
        }));

        // Verify that NewThread was implicitly created and validated
        // and the correct payload was passed to the repository
        expect(mockThreadRepository.addThread).toBeCalledWith({
            title: useCasePayload.title,
            body: useCasePayload.body,
            owner: ownerId,
        });
    });
});