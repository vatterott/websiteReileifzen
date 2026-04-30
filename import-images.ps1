$archiveDir   = Join-Path $PSScriptRoot "feuerwehr\ImageArchive"
$newDir       = Join-Path $archiveDir "new"
$mediaJson    = Join-Path $archiveDir "media.json"
$imageExts    = @('.jpg', '.jpeg', '.png')

$entries = Get-Content -Path $mediaJson -Raw -Encoding UTF8 | ConvertFrom-Json

$newEntries = [System.Collections.Generic.List[object]]::new()
$copiedCount = 0
$skippedCount = 0

foreach ($subDir in Get-ChildItem -Path $newDir -Directory) {
    $folderName = $subDir.Name
    $year = $folderName.Substring(0, 4)
    $event = ($folderName -replace '^\d{4}[-\d\s]*', '').Trim()
    if ($event -eq '') { $title = $year } else { $title = "$year - $event" }
    $yearInt = [int]$year
    if ($yearInt -ge 2020) { $category = "2020s" } else { $category = "2010s" }

    Write-Host "Ordner: $folderName  (Jahr=$year, Titel=$title)"

    foreach ($file in Get-ChildItem -Path $subDir.FullName -File) {
        $ext = $file.Extension.ToLower()
        if ($ext -notin $imageExts) { continue }

        $newName  = "${year}_$($file.Name)"
        $destPath = Join-Path $archiveDir $newName

        if (Test-Path $destPath) {
            Write-Warning "Ueberspringe Duplikat: $newName"
            $skippedCount++
            continue
        }

        Copy-Item -Path $file.FullName -Destination $destPath
        Write-Host "  Kopiert: $($file.Name) -> $newName"
        $copiedCount++

        $entry = [PSCustomObject]@{
            filename = $newName
            title    = $title
            year     = $year
            type     = "image"
            category = $category
        }
        $newEntries.Add($entry)
    }
}

Write-Host "Kopiert: $copiedCount | Uebersprungen: $skippedCount"

if ($newEntries.Count -gt 0) {
    Write-Host "Trage $($newEntries.Count) Eintraege in media.json ein..."
    $combined = @($entries) + @($newEntries)
    $json = $combined | ConvertTo-Json -Depth 5
    Set-Content -Path $mediaJson -Value $json -Encoding UTF8
    Write-Host "media.json aktualisiert."
}