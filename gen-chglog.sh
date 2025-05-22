#!/bin/bash

if [ -z "$1" ]; then
	echo "You must supply a tag to use"
else
	LOG_FILE=CHANGELOG.md
	TAG_CONFIG=.chglog/config-tag.yml
	TAG_FILE=.chglog/current-tag.md

	echo "Generating CHANGELOG file"
	git-chglog --next-tag $1 -o $LOG_FILE

	echo "Generating Tag Message File for $1"
	git-chglog --config $TAG_CONFIG --next-tag $1 -o $TAG_FILE $1

	echo "Commiting $LOG_FILE and $TAG_FILE"
	git commit -am "release $1"

	echo "Creating Tag $1"
	git tag $1 -F $TAG_FILE

	echo "Remember to use 'git push && git push origin --tags'"
fi
