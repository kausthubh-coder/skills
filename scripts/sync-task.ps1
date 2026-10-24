# Runs scripts/sync.mjs every 5 minutes on my laptop, so skill edits pushed from the Mac mini (or
# anywhere) are live here without a manual pull. `conhost --headless` runs node without a window;
# wscript and `cmd /c` both hung under Task Scheduler, so node writes its own log.
# Safe to rerun. Log: ~/.t3/skills-sync.log. Remove: Unregister-ScheduledTask "Skills sync" -Confirm:$false
$node = (Get-Command node).Source
$script = Join-Path $PSScriptRoot "sync.mjs"
$log = Join-Path $HOME ".t3\skills-sync.log"

$q = '"'
$action = New-ScheduledTaskAction -Execute "conhost.exe" -Argument "--headless $q$node$q $q$script$q --log $q$log$q"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
  -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 4)
Register-ScheduledTask -TaskName "Skills sync" -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Output "Skills sync runs every 5 minutes; log: $log"
