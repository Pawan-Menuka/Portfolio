# Database backup and restore runbook

Recorded: 2026-09-12 (Asia/Colombo)

No database content was changed and no migration was run during Phase 0. A backup was therefore not taken from the currently configured database. The current workstation also does not have `mongodump` or `mongorestore` installed. This documented restore path is the Phase 0 baseline; installing the MongoDB Database Tools and successfully testing a staging restore is a hard gate before any message deletion, production content mutation, or migration.

## Backup location

Store encrypted backups outside the Git repository under:

```text
D:\Backups\Portfolio\MongoDB\<environment>\<YYYY-MM-DDTHH-mm-ssZ>\
```

The backup folder must contain the `mongodump` output plus a small text manifest recording the environment, UTC timestamp, source database name, Git commit, tool version, and operator. Never place the URI, credentials, visitor message contents, or decrypted backup files in Git.

## Backup procedure

1. Confirm the target environment and database name from the host secret manager. Never copy the URI into a tracked file or terminal transcript.
2. Install the official MongoDB Database Tools and record `mongodump --version`.
3. Create the timestamped folder above with access limited to the operator.
4. Supply `MONGODB_URI` through the process environment, then run:

   ```powershell
   mongodump --uri $env:MONGODB_URI --out 'D:\Backups\Portfolio\MongoDB\<environment>\<timestamp>'
   ```

5. Verify that the command succeeds, the expected collections exist, and the files are non-empty. Encrypt the backup at rest and record its retention period.
6. Only after that verification may a migration, production content change, or message deletion begin.

## Restore verification

Restore into a disposable, isolated database—never over staging or production for a test:

```powershell
mongorestore --uri $env:RESTORE_TEST_MONGODB_URI --drop 'D:\Backups\Portfolio\MongoDB\<environment>\<timestamp>\<database-name>'
```

Then start the backend against that disposable database and verify `/ready`, profile, project, skill, certification, and message record counts. Record the restore date and result in the launch log, then securely remove the disposable database according to the provider's retention policy.

## Required evidence before data mutation

- Backup path and manifest
- Successful `mongodump` exit status
- Successful restore into an isolated database
- Basic record-count and API checks
- Named operator and rollback decision owner

## 2026-09-16 verification attempt

- MongoDB Database Tools 100.18.0 were downloaded to the operating-system temporary directory and `mongodump --version` succeeded.
- EFS is unsupported on the selected `D:` backup volume. Future runs must use the documented fallback: a 7-Zip AES-256 archive with encrypted filenames, an integrity test before plaintext removal, and the archive password stored outside the repository in Windows Credential Manager.
- The dump failed during the Atlas connection handshake before any BSON file was written. The exact empty attempt directory was removed, and no restore or database mutation occurred.
- The failure diagnostic exposed the connection URI in the local tool transcript. Rotate the Atlas database-user password and update the ignored environment configuration before retrying.
