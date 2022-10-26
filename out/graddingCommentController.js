"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraddingCommentController = void 0;
const vscode = require("vscode");
const extension_1 = require("./extension");
class GraddingCommentController {
    constructor(id, label) {
        this.id = id;
        this.label = label;
        const vsCodeCommentController = vscode.comments.createCommentController("vscode-comment-controller", "Built-in Comment API");
        this.vsCodeCommentConstroller = vsCodeCommentController;
    }
    /**
     * Create a {@link CommentThread comment thread}. The comment thread will be displayed in visible text editors (if the resource matches)
     * and Comments Panel once created.
     *
     * @param uri The uri of the document the thread has been created on.
     * @param range The range the comment thread is located within the document.
     * @param comments The ordered comments of the thread.
     */
    createCommentThread(uri, range, comments) {
        let codeSnippet = "";
        const annotationText = "Dummy annotation";
        // let positionStart: Position = { line: 0, character: 0 };
        // let positionEnd: Position = { line: 0, character: 0 };
        const editor = vscode.window.activeTextEditor;
        if (editor == undefined)
            throw new Error("Editor is undefined");
        const selection = editor.selection;
        // let selectionRange: vscode.Range;
        // let fileUri: vscode.Uri;
        // let newComment: NoteComment;
        codeSnippet = editor.document.getText(selection);
        const positionStart = new vscode.Position(selection.start.line, selection.start.character);
        const positionEnd = new vscode.Position(selection.end.line, selection.end.character);
        const selectionRange = new vscode.Range(positionStart, positionEnd);
        const fileUri = editor.document.uri;
        const newComment = new extension_1.NoteComment(annotationText, vscode.CommentMode.Preview, { name: "vscode" }, undefined, undefined);
        return this.vsCodeCommentConstroller.createCommentThread(fileUri, selectionRange, [newComment]);
    }
    dispose() {
        return this.vsCodeCommentConstroller.dispose();
    }
}
exports.GraddingCommentController = GraddingCommentController;
//# sourceMappingURL=graddingCommentController.js.map