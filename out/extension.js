"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = exports.NoteComment = void 0;
const vscode = require("vscode");
let commentId = 1;
let commentController;
class NoteComment {
    constructor(body, mode, author, parent, contextValue) {
        this.body = body;
        this.mode = mode;
        this.author = author;
        this.parent = parent;
        this.contextValue = contextValue;
        this.id = ++commentId;
        this.savedBody = this.body;
    }
}
exports.NoteComment = NoteComment;
function activate(context) {
    // A `CommentController` is able to provide comments for documents.
    commentController = vscode.comments.createCommentController("comment-sample", "Comment API Sample");
    // const commentController = new GraddingCommentController('comment-sample', 'Comment API Sample');
    context.subscriptions.push(commentController);
    // A `CommentingRangeProvider` controls where gutter decorations that allow adding comments are shown
    commentController.commentingRangeProvider = {
        provideCommentingRanges: (document, token) => {
            const lineCount = document.lineCount;
            return [new vscode.Range(0, 0, lineCount - 1, 0)];
        },
    };
    context.subscriptions.push(vscode.commands.registerCommand("mywiki.createNote", (reply) => {
        replyNote(reply);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("mywiki.createGHComment", 
    // (reply: vscode.CommentReply) => {
    () => {
        /* __GDPR__
            "pr.createComment" : {}
        */
        const newComment = new NoteComment("Hello Test", vscode.CommentMode.Preview, { name: "vscode" }, undefined, undefined);
        console.log("Running create GH comment");
        // console.log("Reply text: " + reply);
        vscode.commands.executeCommand("pr.createSingleComment", {
            thread: undefined,
            text: "HelloThere",
        });
        // const handler = resolveCommentHandler(reply.thread);
        // console.log(reply.text);
        // if (handler) {
        // 	handler.createOrReplyComment(reply.thread, reply.text, false);
        // }
    }));
    context.subscriptions.push(vscode.commands.registerCommand("mywiki.createGradingComment", async () => {
        console.log("Executing command");
        const preFilledComment = "Dummy annotation";
        const annotationText = await getGraddingComment(preFilledComment);
        makeGraddingComment(annotationText);
        // vscode.commands.executeCommand("workbench.action.addComment");
    }));
    async function getGraddingComment(preFilledText) {
        const editor = vscode.window.activeTextEditor;
        if (editor == undefined)
            throw new Error("Editor is undefined");
        const annotationText = await vscode.window.showInputBox({
            placeHolder: "Give the annotation some text...",
            value: preFilledText,
        });
        return annotationText ? annotationText : "";
    }
    function makeGraddingComment(commentText) {
        let codeSnippet = "";
        const editor = vscode.window.activeTextEditor;
        if (editor == undefined)
            throw new Error("Editor is undefined");
        const selection = editor.selection;
        codeSnippet = editor.document.getText(selection);
        const positionStart = new vscode.Position(selection.start.line, selection.start.character);
        const positionEnd = new vscode.Position(selection.end.line, selection.end.character);
        const selectionRange = new vscode.Range(positionStart, positionEnd);
        const fileUri = editor.document.uri;
        const newComment = new NoteComment(commentText, vscode.CommentMode.Preview, { name: "vscode" }, undefined, undefined);
        const newThread = commentController.createCommentThread(fileUri, selectionRange, [newComment]);
        newThread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;
        // Add a parent to the comment we just created so that we can edit it.
        const parentLessThread = newThread.comments[0];
        parentLessThread.parent = newThread;
    }
    context.subscriptions.push(vscode.commands.registerCommand("mywiki.replyNote", (reply) => {
        replyNote(reply);
    }));
    // context.subscriptions.push(vscode.commands.registerCommand('mywiki.startDraft', (reply: vscode.CommentReply) => {
    // 	const thread = reply.thread;
    // 	thread.contextValue = 'draft';
    // 	const newComment = new NoteComment(reply.text, vscode.CommentMode.Preview, { name: 'vscode' }, thread);
    // 	newComment.label = 'pending';
    // 	thread.comments = [...thread.comments, newComment];
    // }));
    // context.subscriptions.push(vscode.commands.registerCommand('mywiki.finishDraft', (reply: vscode.CommentReply) => {
    // 	const thread = reply.thread;
    // 	if (!thread) {
    // 		return;
    // 	}
    // 	thread.contextValue = undefined;
    // 	thread.collapsibleState = vscode.CommentThreadCollapsibleState.Collapsed;
    // 	if (reply.text) {
    // 		const newComment = new NoteComment(reply.text, vscode.CommentMode.Preview, { name: 'vscode' }, thread);
    // 		thread.comments = [...thread.comments, newComment].map(comment => {
    // 			comment.label = undefined;
    // 			return comment;
    // 		});
    // 	}
    // }));
    context.subscriptions.push(vscode.commands.registerCommand("mywiki.deleteNoteComment", (comment) => {
        const thread = comment.parent;
        if (!thread) {
            return;
        }
        thread.comments = thread.comments.filter((cmt) => cmt.id !== comment.id);
        if (thread.comments.length === 0) {
            thread.dispose();
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand("mywiki.deleteNote", (thread) => {
        thread.dispose();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("mywiki.cancelsaveNote", (comment) => {
        if (!comment.parent) {
            return;
        }
        comment.parent.comments = comment.parent.comments.map((cmt) => {
            if (cmt.id === comment.id) {
                cmt.body = cmt.savedBody;
                cmt.mode = vscode.CommentMode.Preview;
            }
            return cmt;
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand("mywiki.saveNote", (comment) => {
        if (!comment.parent) {
            return;
        }
        comment.parent.comments = comment.parent.comments.map((cmt) => {
            if (cmt.id === comment.id) {
                cmt.savedBody = cmt.body;
                cmt.mode = vscode.CommentMode.Preview;
            }
            return cmt;
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand("mywiki.editNote", (comment) => {
        if (!comment.parent) {
            return;
        }
        comment.parent.comments = comment.parent.comments.map((cmt) => {
            if (cmt.id === comment.id) {
                cmt.mode = vscode.CommentMode.Editing;
            }
            return cmt;
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand("mywiki.dispose", () => {
        commentController.dispose();
    }));
    function replyNote(reply) {
        const thread = reply.thread;
        const newComment = new NoteComment(reply.text, vscode.CommentMode.Preview, { name: "vscode" }, thread, thread.comments.length ? "canDelete" : undefined);
        if (thread.contextValue === "draft") {
            newComment.label = "pending";
        }
        thread.comments = [...thread.comments, newComment];
    }
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map