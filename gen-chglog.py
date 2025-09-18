import sys
import re
import argparse
from pathlib import Path

semver_pattern = r"^v(?P<major>0|[1-9]\d*)\.(?P<minor>0|[1-9]\d*)\.(?P<patch>0|[1-9]\d*)(?:-(?P<prerelease>alpha|beta|rc)(?:\.(?P<version>0|[1-9]\d*))?)?$"

def installed(process):
    import os
    for path in os.environ["PATH"].split(os.pathsep):
        if os.path.exists(os.path.join(path, process)) or os.path.exists(os.path.join(path, process + '.exe')):
            print(f"{process} is installed.")
            return True
    print(f"ERROR: {process} is not installed")
    return False

def run(command, message=''):
    import subprocess
    try:
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        output = result.stdout.strip()
        # If command is git for-each-ref for tags, take the first line
        if command[0] == 'git' and 'for-each-ref' in command:
            output = output.split('\n')[0] if output else ''
        if message:
            print(message)
        else:
            print(f"{' '.join(command)} ... DONE")
        return output
    except subprocess.CalledProcessError as e:
        error_quit(f"{' '.join(command)} ... ERROR: {e}")
        return None

def update_version(file_path, old_version, new_version):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    updated_content = content.replace(old_version[1:], new_version[1:])
    with open(file_path, 'w', encoding='utf-8', newline='\n') as file:
        file.write(updated_content)
    print(f"Updated version info: {file_path}")

def error_quit(message):
    print(f"<<ERROR>> {message}")
    sys.exit(1)

def validate_version(ver_str):
    if not re.fullmatch(semver_pattern, ver_str):
        error_quit("Please enter a valid semantic version pattern (e.g., v1.0.1)")
    return ver_str

def main():
    parser = argparse.ArgumentParser(
        description="Create CHANGELOG using git-chglog and update version info",
        epilog="Optionally specify a file to --replace the previous version string with new version\n"
               "Optionally specify a --dry run without committing or writing to files\n"
               "Optionally specify the --output CHANGELOG path. Default is 'CHANGELOG.md'\n"
               "Optionally specify the git-chglog --config path. Default is '.chglog/config-tag.yml'\n"
               "Optionally specify the --temp file path. Default is '.chglog/current-tag.md'"
    )
    parser.add_argument("version", help="New version string (e.g., v1.0.1)")
    parser.add_argument("--replace", "-r", action="append", type=Path, default=[],
                        help="A file to search and replace previous version with new version")
    parser.add_argument("--dry", "-d", action="store_true", help="Dry run, do not commit")
    parser.add_argument("--output", "-o", type=Path, default=Path("CHANGELOG.md"),
                        help="Specify output changelog file, default is 'CHANGELOG.md'")
    parser.add_argument("--config", "-c", type=Path, default=Path(".chglog/config-tag.yml"),
                        help="Specify the config file path, default is '.chglog/config-tag.yml'")
    parser.add_argument("--temp", "-t", type=Path, default=Path(".chglog/current-tag.md"),
                        help="Specify the temp file path, default is '.chglog/current-tag.md'")

    args = parser.parse_args()

    # Validate version
    validate_version(args.version)

    # Check for required tools
    if not installed('git'):
        error_quit("Please install git")
    if not installed('git-chglog'):
        error_quit("Please install git-chglog")

    # Handle version replacement
    if args.replace:
        # Get the latest tag by committer date
        prev_version_hash = run(['git', 'rev-list', '--tags', '--max-count=1'], "Getting previous version hash")
        prev_version = run(['git', 'describe', '--tags', prev_version_hash], "Getting previous version")
        if not prev_version:
            error_quit("No tags found in the repository")
        if not re.fullmatch(semver_pattern, prev_version):
            error_quit(f"Invalid previous version {prev_version}")
        else:
            print(f"Previous version: {prev_version}")
        for path in args.replace:
            if not path.is_file():
                error_quit(f"File {path} does not exist or is not a file")
            if not args.dry:
                update_version(path, prev_version, args.version)
            else:
                print(f"Will update version info in {path}")

    # Handle changelog and tag operations
    if args.dry:
        run(['git-chglog', '--next-tag', args.version])
        run(['git-chglog', '--config', str(args.config), '--next-tag', args.version, args.version])
    else:
        run(['git-chglog', '--next-tag', args.version, '-o', str(args.output)], f"Writing changelog to {args.output}")
        run(['git-chglog', '--config', str(args.config), '--next-tag', args.version, '-o', str(args.temp), args.version],
            f"Writing tag annotation to {args.temp}")
        run(['git', 'commit', '-am', f"release {args.version}"], "Committing release")
        run(['git', 'tag', args.version, '-F', str(args.temp)], f"Creating git tag {args.version}")

    print("DONE")
    if not args.dry:
        print("Remember to run 'git push && git push origin --tags'")

if __name__ == "__main__":
    main()
