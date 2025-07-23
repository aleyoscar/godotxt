import os
import re
import argparse
import subprocess
import shutil

semver_pattern = r"^v(?P<major>0|[1-9]\d*)\.(?P<minor>0|[1-9]\d*)\.(?P<patch>0|[1-9]\d*)(?:-(?P<prerelease>alpha|beta|rc)(?:\.(?P<version>0|[1-9]\d*))?)?$"
log_path = "CHANGELOG.md"
tag_config_path = ".chglog/config-tag.yml"
tag_file_path = ".chglog/current-tag.md"

def installed(process):
	if shutil.which(process):
		print(f"  >> {process} is installed.")
		return True
	else:
		print(f"  >> {process} is not installed")
		return False

def run(command):
	try:
		result = subprocess.run(
			command,
			stdout=subprocess.PIPE,
			stderr=subprocess.PIPE,
			check=True,
			text=True
		)
		print(f"  >> ({' '.join(command)}) completed successfully")
		return result.stdout.strip()
	except subprocess.CalledProcessError as e:
		print(f"  >> <<ERROR>> ({' '.join(command)}) failed: {e}")
		return None

def update_version(file_path, old_version, new_version):
	with open(file_path, 'r', encoding='utf-8', newline='\n') as file:
		content = file.read()

	updated_content = content.replace(old_version, new_version)

	with open(file_path, 'w', encoding='utf-8', newline='\n') as file:
		file.write(updated_content)

	print(f"  >> Updated version info: {file_path}")

def error_quit(message):
	print(f"  >> <<ERROR>> {message}")
	exit()

def main():
	parser = argparse.ArgumentParser(description='Update version query parameters in project files.')
	parser.add_argument('version', help='New version string (e.g., v1.0.1)')
	args = parser.parse_args()
	if not re.fullmatch(semver_pattern, args.version):
		error_quit(f"Please provide a valid semantic version pattern (e.g., v1.0.1)")
	if not installed('git'):
		error_quit(f"Please install git")
	if not installed('git-chglog'):
		error_quit(f"Please install git-chglog")
	prev_version = run(['git', 'describe', '--tags', '--abbrev=0'])
	if not re.fullmatch(semver_pattern, prev_version):
		error_quit(f"Invalid previous version {prev_version}")
	else:
		print(f"  >> Previous version: {prev_version}")
	update_version("pb_public/index.html", prev_version, args.version)
	update_version("pb_public/sw.js", prev_version, args.version)
	update_version("pb_public/site.webmanifest", prev_version, args.version)
	update_version("README.md", prev_version, args.version)
	run(['git-chglog', '--next-tag', args.version, '-o', log_path])
	run(['git-chglog', '--config', tag_config_path, '--next-tag', args.version, '-o', tag_file_path, args.version])
	run(['git', 'commit', '-am', f"'release {args.version}'"])
	run(['git', 'tag', args.version, '-F', tag_file_path])
	print(f"  >> <<SUCCESS>> Created new tag {args.version}")
	print(f"  >> Remember to use 'git push && git push origin --tags'")

if __name__ == '__main__':
	main()
