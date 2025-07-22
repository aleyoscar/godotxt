param (
    [Parameter(Mandatory = $true)]
    [string]$Tag
)

$logFile = "CHANGELOG.md"
$tagConfig = ".chglog/config-tag.yml"
$tagFile = ".chglog/current-tag.md"
$indexFile = "pb_public/index.html"
$readmeFile = "README.md"

Write-Host "Updating version info in README.md and index.html to $Tag"

# Read and update index.html
$content = Get-Content $indexFile
$content = $content | ForEach-Object {
    $_ -replace '(href=".*?/styles/style\.css\?v=)[^"]*', "`$1$Tag" `
       -replace '(src=".*?/scripts/todotxt\.js\?v=)[^"]*', "`$1$Tag" `
       -replace '(src=".*?/scripts/modal\.js\?v=)[^"]*', "`$1$Tag" `
       -replace '(src=".*?/scripts/main\.js\?v=)[^"]*', "`$1$Tag"
}
$content | Set-Content $indexFile

# Update line 3 in README.md
$readmeLines = Get-Content $readmeFile
if ($readmeLines.Count -ge 3) {
    $readmeLines[2] = "> $Tag"
    $readmeLines | Set-Content $readmeFile
}

Write-Host "Generating CHANGELOG file"
git-chglog --next-tag $Tag -o $logFile

Write-Host "Generating Tag Message File for $Tag"
git-chglog --config $tagConfig --next-tag $Tag -o $tagFile $Tag

Write-Host "Committing $logFile and $tagFile"
git commit -am "release $Tag"

Write-Host "Creating Tag $Tag"
git tag $Tag -F $tagFile

Write-Host "Remember to use 'git push && git push origin --tags'"
