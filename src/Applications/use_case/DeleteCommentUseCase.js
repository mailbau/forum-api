// src/Applications/use_case/DeleteCommentUseCase.js
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');

class DeleteCommentUseCase {
    constructor({ commentRepository, threadRepository }) {
        this._commentRepository = commentRepository;
        this._threadRepository = threadRepository;
    }

    async execute(threadId, commentId, ownerId) {
        await this._threadRepository.verifyThreadExists(threadId);

        await this._commentRepository.verifyCommentOwner(commentId, ownerId);

        await this._commentRepository.deleteCommentById(commentId);
    }
}

module.exports = DeleteCommentUseCase;