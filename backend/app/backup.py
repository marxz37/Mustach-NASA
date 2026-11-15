"""SQLite backup/restore. Stop the API before restoring a database."""
import argparse
from contextlib import closing
import os
from pathlib import Path
import sqlite3

from .db import database_path


def backup_database(destination: Path) -> Path:
    source = database_path()
    if not source.exists():
        raise FileNotFoundError(source)
    destination = destination.resolve()
    if destination == source.resolve():
        raise ValueError('Backup destination must differ from live database')
    destination.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(source)) as live, closing(sqlite3.connect(destination)) as copy:
        live.backup(copy)
    return destination


def restore_database(source: Path, *, force: bool = False) -> Path:
    source = source.resolve()
    if not source.is_file():
        raise FileNotFoundError(source)
    target = database_path().resolve()
    if source == target:
        raise ValueError('Source and target are identical')
    with closing(sqlite3.connect(f'file:{source.as_posix()}?mode=ro', uri=True)) as conn:
        if conn.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('Backup failed SQLite integrity check')
    if target.exists():
        if not force:
            raise FileExistsError('Live database exists; use --force after stopping the API')
        backup_database(target.with_name(target.name + '.pre-restore'))
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(target.name + '.restoring')
    with closing(sqlite3.connect(f'file:{source.as_posix()}?mode=ro', uri=True)) as original, closing(sqlite3.connect(temporary)) as restored:
        original.backup(restored)
    os.replace(temporary, target)
    return target


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['backup', 'restore'])
    parser.add_argument('path', type=Path)
    parser.add_argument('--force', action='store_true', help='Allow replacing the live DB after stopping the API')
    args = parser.parse_args()
    print(backup_database(args.path) if args.action == 'backup' else restore_database(args.path, force=args.force))
