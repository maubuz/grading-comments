"use strict";

import * as vscode from "vscode";

let commentId = 1;
let commentController: vscode.CommentController;

export class NoteComment implements vscode.Comment {
  id: number;
  label: string | undefined;
  savedBody: string | vscode.MarkdownString; // for the Cancel button
  constructor(
    public body: string | vscode.MarkdownString,
    public mode: vscode.CommentMode,
    public author: vscode.CommentAuthorInformation,
    public parent?: vscode.CommentThread,
    public contextValue?: string,
  ) {
    this.id = ++commentId;
    this.savedBody = this.body;
  }
}

export function activate(context: vscode.ExtensionContext) {
  // A `CommentController` is able to provide comments for documents.
  commentController = vscode.comments.createCommentController(
    "comment-sample",
    "Comment API Sample",
  );

  // const commentController = new GraddingCommentController('comment-sample', 'Comment API Sample');
  context.subscriptions.push(commentController);

  // A `CommentingRangeProvider` controls where gutter decorations that allow adding comments are shown
  commentController.commentingRangeProvider = {
    provideCommentingRanges: (
      document: vscode.TextDocument,
      token: vscode.CancellationToken,
    ) => {
      const lineCount = document.lineCount;
      return [new vscode.Range(0, 0, lineCount - 1, 0)];
    },
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mywiki.createNote",
      (reply: vscode.CommentReply) => {
        replyNote(reply);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mywiki.createGradingComment",
      async () => {
        console.log("Executing command");

        const preFilledComment = "Dummy annotation";
        const annotationText = await getGraddingComment(preFilledComment);
        makeGraddingComment(annotationText);

        // vscode.commands.executeCommand("workbench.action.addComment");
      },
    ),
  );

  async function getGraddingComment(preFilledText:string): Promise<string> {
    const editor = vscode.window.activeTextEditor;
    if (editor == undefined) throw new Error("Editor is undefined");

    const annotationText = await vscode.window.showInputBox({
      placeHolder: "Give the annotation some text...",
      value: preFilledText,
    });
    return annotationText ? annotationText : "";
  }

  function makeGraddingComment(commentText: string) {
    let codeSnippet = "";
    const editor = vscode.window.activeTextEditor;

    if (editor == undefined) throw new Error("Editor is undefined");

    const selection: vscode.Selection = editor.selection;
    codeSnippet = editor.document.getText(selection);

    const positionStart = new vscode.Position(
      selection.start.line,
      selection.start.character,
    );
    const positionEnd = new vscode.Position(
      selection.end.line,
      selection.end.character,
    );

    const selectionRange = new vscode.Range(positionStart, positionEnd);
    const fileUri = editor.document.uri;

    const newComment = new NoteComment(
      commentText,
      vscode.CommentMode.Preview,
      { name: "vscode" },
      undefined,
      undefined,
    );
    const newThread = commentController.createCommentThread(
      fileUri,
      selectionRange,
      [newComment],
    );
    newThread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;

    // Add a parent to the comment we just created so that we can edit it.
    const parentLessThread = newThread.comments[0] as NoteComment;
    parentLessThread.parent = newThread;
  }

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mywiki.replyNote",
      (reply: vscode.CommentReply) => {
        replyNote(reply);
      },
    ),
  );

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

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mywiki.deleteNoteComment",
      (comment: NoteComment) => {
        const thread = comment.parent;
        if (!thread) {
          return;
        }

        thread.comments = thread.comments.filter((cmt) =>
          (cmt as NoteComment).id !== comment.id
        );

        if (thread.comments.length === 0) {
          thread.dispose();
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mywiki.deleteNote",
      (thread: vscode.CommentThread) => {
        thread.dispose();
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mywiki.cancelsaveNote",
      (comment: NoteComment) => {
        if (!comment.parent) {
          return;
        }

        comment.parent.comments = comment.parent.comments.map((cmt) => {
          if ((cmt as NoteComment).id === comment.id) {
            cmt.body = (cmt as NoteComment).savedBody;
            cmt.mode = vscode.CommentMode.Preview;
          }

          return cmt;
        });
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mywiki.saveNote",
      (comment: NoteComment) => {
        if (!comment.parent) {
          return;
        }

        comment.parent.comments = comment.parent.comments.map((cmt) => {
          if ((cmt as NoteComment).id === comment.id) {
            (cmt as NoteComment).savedBody = cmt.body;
            cmt.mode = vscode.CommentMode.Preview;
          }

          return cmt;
        });
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mywiki.editNote",
      (comment: NoteComment) => {
        if (!comment.parent) {
          return;
        }

        comment.parent.comments = comment.parent.comments.map((cmt) => {
          if ((cmt as NoteComment).id === comment.id) {
            cmt.mode = vscode.CommentMode.Editing;
          }

          return cmt;
        });
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mywiki.dispose", () => {
      commentController.dispose();
    }),
  );

  function replyNote(reply: vscode.CommentReply) {
    const thread = reply.thread;
    const newComment = new NoteComment(
      reply.text,
      vscode.CommentMode.Preview,
      { name: "vscode" },
      thread,
      thread.comments.length ? "canDelete" : undefined,
    );
    if (thread.contextValue === "draft") {
      newComment.label = "pending";
    }

    thread.comments = [...thread.comments, newComment];
  }
}
