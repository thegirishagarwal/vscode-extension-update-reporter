import * as assert from 'assert';

import ExtensionChangeDataBuilder from '../../lib/extension-change-data-builder';
import { Extension } from '../../lib/entities/extension';
import ChangelogParser from '../../lib/changelog-parser';
import * as vscode from 'vscode';
import {Version} from '../../lib/entities/version';

const multiline = require('multiline-string')();

describe('ExtensionChangeDataBuilder', () => {
  const changelogParser = new ChangelogParser();
  const builder = new ExtensionChangeDataBuilder();

  it('creates an updates summary', () => {
    const extension1 = createExtension({
      id: 'EXT1',
      displayName: 'EXT_NAME_1',
      changelogText: multiline(`
        The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)

        ## [1.0.0] - 2018-04-21
        ### Added
        - foo2
        - bar

        ## [0.9.0] - 2018-04-20
        ### Added
        - foo

        ## [0.8.0] - 2018-04-19
        ### Added
        - baz
        `)
    });
    const extension2 = createExtension({
      id: 'EXT2',
      displayName: 'EXT_NAME_2',
      changelogText: multiline(`
        The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)

        ## [0.1.0] - 2018-04-22
        ### Removed
        - baz

        ## [0.0.9] - 2018-04-21
        ### Removed
        - foo
        `)
    });
    const extensionVersions = {
      EXT1: new Version(0, 8, 0),
      EXT2: new Version(0, 0, 9)
    };

    assert.deepEqual(
      builder.build([extension1, extension2], extensionVersions),
      multiline(`
      # Extension Updates

      ## EXT_NAME_1
      ### [1.0.0]
      #### Added
      - foo2
      - bar

      ### [0.9.0]
      #### Added
      - foo

      ## EXT_NAME_2
      ### [0.1.0]
      #### Removed
      - baz
      `)
    );
  });

  it('shows a message that changelog is not available', () => {
    const extension = createExtension({
      id: 'EXT3',
      displayName: 'EXT_NAME_3',
      knownVerion: new Version(1, 3, 0),
      changelogText: multiline(`
        ### 26 Jan 2018 - 1.3.0
        * Update to work with new Code version
        `)
    });
    const extensionVersions = { EXT3: new Version(0, 0, 1) };

    assert.deepEqual(
      builder.build([extension], extensionVersions),
      multiline(`
      # Extension Updates

      ## EXT_NAME_3
      Changelog not found or cannot be parsed.
      `)
    );
  });

  function createExtension ({ id, displayName, changelogText, knownVerion }: any) {
    const extensionRaw = { id, packageJSON: { displayName } } as vscode.Extension<any>;
    const changelog = changelogParser.parse(changelogText, knownVerion);
    return new Extension(extensionRaw, changelog);
  }
});
