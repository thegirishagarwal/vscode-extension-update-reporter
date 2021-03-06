import * as vscode from 'vscode';
import {Changelog} from './changelog';
import {parseVersion, Version} from './version';
import {Option} from 'fp-ts/lib/Option';

abstract class Extension {
  protected readonly raw: vscode.Extension<any>;

  constructor(raw: vscode.Extension<any>) {
    this.raw = raw;
  }

  get id() {
    return this.raw.id;
  }

  get displayName() {
    const packageJson = this.raw.packageJSON;
    return packageJson.displayName || packageJson.name;
  }

  get version(): Version {
    return parseVersion(this.raw.packageJSON.version);
  }

  get isVscodeBundled() {
    return (
      this.id.startsWith('vscode.') ||
      this.id.startsWith('ms-vscode.')
    );
  }

  get extensionPath() {
    return this.raw.extensionPath;
  }
}

export class RawExtension extends Extension {
  withPrevInstalledVersion(prevInstalled: Version) {
    return new PreloadedExtension(this.raw, prevInstalled);
  }
}

export class PreloadedExtension extends Extension {
  private readonly prevInstalled: Version;

  constructor(raw: vscode.Extension<any>, prevInstalled: Version) {
    super(raw);
    this.prevInstalled = prevInstalled;
  }

  hasBeenUpdated() {
    return this.version.isHigherThan(this.prevInstalled);
  }

  withHistory(changelog: Option<Changelog>): LoadedExtension {
    return new LoadedExtension(this.raw, this.prevInstalled, changelog);
  }
}

export class LoadedExtension extends Extension {
  private readonly _changelog: Option<Changelog>;
  private readonly prevInstalled: Version;

  constructor(raw: vscode.Extension<any>, prevInstalled: Version, changelog: Option<Changelog>) {
    super(raw);
    this._changelog = changelog;
    this.prevInstalled = prevInstalled;
  }

  get changelog(): Option<Changelog> {
    return this._changelog;
  }

  get previousVersion() {
    return this.prevInstalled;
  }
}
