'use babel';

import { clipboard } from 'electron';
import { exportAsGist } from './exporter';

let commandListener = null;

function notify(level, message, details) {
  const options = {
    dismissable: true,
  };

  if (typeof details === 'string') {
    options.detail = details;
  }

  inkdrop.notifications[`add${level}`](message, options);
}

async function doExport(isPublic) {
  try {
    const gistUrl = await exportAsGist(isPublic);

    console.log(`Gist url: ${gistUrl}`);

    clipboard.writeText(gistUrl);
    notify(
      'Success',
      'Successfully exported to gist',
      `The gist link has been copied to your clipboard.`,
    );
  } catch (err) {
    console.error(err);
    notify('Error', 'Something went wrong while exporting', err.message);
  }
}

export const config = {
  token: {
    title: 'Personal Access Token',
    description:
      "The token that is used to authenticate with when exporting note(s) as a gist. This token needs the 'gist' scope. You can generate one at https://github.com/settings/tokens/new.",
    type: 'string',
  },
};

export function activate() {
  commandListener = inkdrop.commands.add(document.body, {
    'export-as-gist:public': () => doExport(true),
    'export-as-gist:private': () => doExport(false),
  });
}

export function deactivate() {
  commandListener.dispose();
}
