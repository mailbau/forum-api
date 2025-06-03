const NewThread = require('../../Domains/threads/entities/NewThread');

class AddThreadUseCase {
    constructor({ threadRepository }) {
        this._threadRepository = threadRepository;
    }

    async execute(useCasePayload, ownerId) {
        const newThread = new NewThread(useCasePayload); // Validates title and body
        return this._threadRepository.addThread({
            title: newThread.title,
            body: newThread.body,
            owner: ownerId,
        });
    }
}

module.exports = AddThreadUseCase;