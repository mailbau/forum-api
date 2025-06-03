// src/Applications/use_case/GetThreadDetailUseCase.js
const ThreadDetail = require('../../Domains/threads/entities/ThreadDetail');
const CommentDetail = require('../../Domains/comments/entities/CommentDetail');
const ReplyDetail = require('../../Domains/replies/entities/ReplyDetail');

class GetThreadDetailUseCase {
    constructor({ threadRepository, commentRepository, replyRepository }) {
        this._threadRepository = threadRepository;
        this._commentRepository = commentRepository;
        this._replyRepository = replyRepository;
    }

    async execute(threadId) {
        await this._threadRepository.verifyThreadExists(threadId);
        const threadData = await this._threadRepository.getThreadById(threadId);
        const rawComments = await this._commentRepository.getCommentsByThreadId(threadId);

        const comments = await Promise.all(rawComments.map(async (comment) => {
            const rawReplies = await this._replyRepository.getRepliesByCommentId(comment.id);
            const processedReplies = rawReplies.map((reply) => new ReplyDetail({
                id: reply.id,
                username: reply.username,
                date: reply.date,
                content: reply.content,
                isDeleted: reply.is_deleted,
            }));

            return new CommentDetail({
                id: comment.id,
                username: comment.username,
                date: comment.date,
                content: comment.content,
                isDeleted: comment.is_deleted,
                replies: processedReplies,
            });
        }));

        return new ThreadDetail({
            id: threadData.id,
            title: threadData.title,
            body: threadData.body,
            date: threadData.date,
            username: threadData.username,
            comments,
        });
    }
}

module.exports = GetThreadDetailUseCase;