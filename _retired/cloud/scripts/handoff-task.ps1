# Runs `cloud.mjs handoff` every 10 minutes on my laptop, so device-hub checks the cloud threads ask for start
# here without me pasting anything. `conhost --headless` runs node without a window; wscript and `cmd /c` both
# hung under Task Scheduler, so node writes its own log.
# Safe to rerun. Log: ~/.t3/cloud-handoff.log. Remove: Unregister-ScheduledTask "Cloud handoff" -Confirm:$false
$node = (Get-Command node).Source
$script = Join-Path $PSScriptRoot "cloud.mjs"
$log = Join-Path $HOME ".t3\cloud-handoff.log"
Remove-Item (Join-Path $HOME ".t3\cloud-handoff.vbs") -ErrorAction SilentlyContinue

$q = '"'
$action = New-ScheduledTaskAction -Execute "conhost.exe" -Argument "--headless $q$node$q $q$script$q handoff --log $q$log$q"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 10)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
  -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 9)
Register-ScheduledTask -TaskName "Cloud handoff" -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Output "Cloud handoff runs every 10 minutes; log: $log"
