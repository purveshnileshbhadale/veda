$log = Join-Path $PSScriptRoot "frontend-dev.log"
$p = Start-Process -PassThru -NoNewWindow -FilePath "npx.cmd" -ArgumentList "next dev --port 3000" -WorkingDirectory $PSScriptRoot -RedirectStandardOutput $log -RedirectStandardError $log
Write-Output $p.Id
$p.WaitForExit()
