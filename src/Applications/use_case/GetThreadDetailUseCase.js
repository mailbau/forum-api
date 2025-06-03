// src/Applications/use_case/GetThreadDetailUseCase.js
const ThreadDetail = require('../../Domains/threads/entities/ThreadDetail');
const CommentDetail = require('../../Domains/comments/entities/CommentDetail');

class GetThreadDetailUseCase {
    constructor({ threadRepository, commentRepository }) {
        this._threadRepository = threadRepository;
        this._commentRepository = commentRepository;
        // UserRepository might not be needed if repositories handle username fetching
    }

    async execute(threadId) {
        // 1. Get thread details (repo should include username)
        // Ensure verifyThreadExists is called by getThreadById internally or call it explicitly
        await this._threadRepository.verifyThreadExists(threadId);
        const threadData = await this._threadRepository.getThreadById(threadId);

        // 2. Get comments for the thread (repo should include username and is_deleted)
        const rawComments = await this._commentRepository.getCommentsByThreadId(threadId);

        // 3. Process comments into CommentDetail entities
        const comments = rawComments.map((comment) => new CommentDetail({
            id: comment.id,
            username: comment.username, // Assuming repo returns this
            date: comment.date,
            content: comment.content,
            isDeleted: comment.is_deleted, // Assuming repo returns this
        }));

        // 4. Construct and return ThreadDetail
        return new ThreadDetail({
            id: threadData.id,
            title: threadData.title,
            body: threadData.body,
            date: threadData.date,
            username: threadData.username, // Assuming repo returns this
            comments,
        });
    }
}

module.exports = GetThreadDetailUseCase;