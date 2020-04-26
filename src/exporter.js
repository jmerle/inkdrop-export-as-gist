'use babel';

import { Octokit } from '@octokit/rest';
import filenamify from 'filenamify';

function throwTokenError() {
  const message =
    "Make sure the API token in the plugin's settings is valid and has the 'gist' scope.";
  throw new Error(message);
}

function createOctokit() {
  const token = inkdrop.config.get('export-as-gist.token');

  if (token === undefined) {
    throwTokenError();
  }

  return new Octokit({
    auth: token,
  });
}

function getFilename(noteTitle, currentFiles) {
  const strippedTitle = filenamify(noteTitle);

  for (let i = 1; ; i++) {
    const filename = `${strippedTitle}${i == 1 ? '' : i}.md`;

    if (currentFiles[filename] === undefined) {
      return filename;
    }
  }
}

export async function exportAsGist(isPublic) {
  const { noteListBar, notes } = inkdrop.store.getState();
  const noteIds = noteListBar.actionTargetNoteIds;

  if (noteIds.length === 0 || Object.keys(notes.hashedItems).length === 0) {
    throw new Error('No note(s) selected.');
  }

  const files = {};

  for (const noteId of noteIds) {
    const note = notes.hashedItems[noteId];
    files[getFilename(note.title, files)] = { content: note.body };
  }

  try {
    const octokit = createOctokit();
    const response = await octokit.gists.create({
      files,
      public: isPublic,
    });

    return `https://gist.github.com/${response.data.id}`;
  } catch (err) {
    if (err.status === 401) {
      throwTokenError();
    }

    throw err;
  }
}
