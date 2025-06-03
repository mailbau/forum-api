const AddThreadUseCase = require('../../../../Applications/use_case/AddThreadUseCase');
const GetThreadDetailUseCase = require('../../../../Applications/use_case/GetThreadDetailUseCase');

class ThreadsHandler {
    constructor(container) {
        this._container = container;
        this.postThreadHandler = this.postThreadHandler.bind(this);
        this.getThreadDetailHandler = this.getThreadDetailHandler.bind(this);
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

    async getThreadDetailHandler(request, h) {
        const getThreadDetailUseCase = this._container.getInstance(GetThreadDetailUseCase.name);
        const { threadId } = request.params;
        const thread = await getThreadDetailUseCase.execute(threadId);

        return h.response({
            status: 'success',
            data: {
                thread,
            },
        }).code(200);
    }
}

module.exports = ThreadsHandler;