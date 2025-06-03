const AddThreadUseCase = require('../../../../Applications/use_case/AddThreadUseCase');

class ThreadsHandler {
    constructor(container) {
        this._container = container;
        this.postThreadHandler = this.postThreadHandler.bind(this);
    }

    async postThreadHandler(request, h) {
        const addThreadUseCase = this._container.getInstance(AddThreadUseCase.name);
        const { id: ownerId } = request.auth.credentials; // Get owner from authenticated user
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