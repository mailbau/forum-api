// src/Interfaces/http/api/threads/handler.js
const AddThreadUseCase = require('../../../../Applications/use_case/AddThreadUseCase');
// Remove: const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');

class ThreadsHandler {
    constructor(container) {
        this._container = container;
        this.postThreadHandler = this.postThreadHandler.bind(this);
        // Remove: this.postCommentHandler = this.postCommentHandler.bind(this);
    }

    async postThreadHandler(request, h) {
        const addThreadUseCase = this._container.getInstance(AddThreadUseCase.name);
        const { id: ownerId } = request.auth.credentials;
        const addedThread = await addThreadUseCase.execute(request.payload, ownerId);

        const response = h.response({
            status: 'success',
            data: {
                addedThread,
            },
        });
        response.code(201);
        return response;
    }

}

module.exports = ThreadsHandler;