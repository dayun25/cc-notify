param([string]$TestTitle, [string]$TestMessage)

$promptFile = "$env:TEMP\cc-notify-last-prompt.json"
$promptText = ""
$projectDir = ""

if ($TestTitle -and $TestMessage) {
  $promptText = $TestMessage
  $projectDir = ""
  $termName = "cc-notify"
}
else {
  if (Test-Path $promptFile) {
    $data = Get-Content $promptFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $promptText = $data.prompt
    $projectDir = $data.cwd
  }
}

if ($promptText.Length -gt 60) {
  $promptText = $promptText.Substring(0, 57) + "..."
}

$folderName = ""
if ($projectDir) {
  $folderName = Split-Path $projectDir -Leaf
}

function Get-TerminalName {
  param($startPid)
  $currentId = $startPid
  $shellFound = ""
  for ($i = 0; $i -lt 10; $i++) {
    $proc = Get-Process -Id $currentId -ErrorAction SilentlyContinue
    if (-not $proc) { break }
    $n = $proc.ProcessName
    if ($n -eq "WindowsTerminal") { return "Windows Terminal" }
    if ($n -eq "WindowsTerminalPreview") { return "Terminal Preview" }
    if ($n -eq "Code") { return "VS Code" }
    if ($n -eq "idea64" -or $n -eq "idea") { return "IntelliJ IDEA" }
    if ($n -eq "ConEmu64" -or $n -eq "ConEmu") { return "ConEmu" }
    if ($n -eq "pwsh" -or $n -eq "powershell") { $shellFound = "PowerShell" }
    if ($n -eq "cmd") { $shellFound = "CMD" }
    if ($n -eq "bash") { $shellFound = "Git Bash" }
    if ($n -eq "wsl" -or $n -eq "wslhost") { $shellFound = "WSL" }
    $parent = Get-CimInstance Win32_Process -Filter "ProcessId = $currentId" -ErrorAction SilentlyContinue
    if (-not $parent) { break }
    $currentId = $parent.ParentProcessId
    if (-not $currentId -or $currentId -eq 0) { break }
  }
  return $shellFound
}

if (-not $termName) {
  $termName = Get-TerminalName $PID
}

$title = $TestTitle
if (-not $title) {
  $title = "Claude Code"
  $parts = @()
  if ($termName) { $parts += $termName }
  if ($folderName) { $parts += $folderName }
  if ($parts.Count -gt 0) {
    $title = $title + " [" + ($parts -join "|") + "]"
  }
}

$body = $promptText
if (-not $body) {
  $body = "Response complete"
}

$styleFile = "$env:USERPROFILE\.config\cc-notify\style.json"
$style = @{}
if (Test-Path $styleFile) {
  try {
    $style = Get-Content $styleFile -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch {}
}

$fontSize   = if ($style.fontSize)   { $style.fontSize }   else { 9 }
$fontFamily = if ($style.fontFamily) { $style.fontFamily } else { "Microsoft YaHei" }
$bgColor    = if ($style.bgColor)    { $style.bgColor }    else { "#323232" }
$textColor  = if ($style.textColor)  { $style.textColor }  else { "#ffffff" }
$opacity    = if ($style.opacity)    { $style.opacity }    else { 0.95 }
$duration   = if ($style.duration)   { $style.duration }   else { 4 }
$position   = if ($style.position)   { $style.position }   else { "bottom-right" }
$winWidth   = if ($style.width)      { $style.width }      else { 340 }
$winHeight  = if ($style.height)     { $style.height }     else { [Math]::Max(44, $fontSize * 5.5) }

$form = New-Object System.Windows.Forms.Form
$form.Text = ""
$form.Width = $winWidth
$form.Height = $winHeight
$form.ControlBox = $false
$form.ShowInTaskbar = $false
$form.TopMost = $true
$form.FormBorderStyle = "None"
$form.BackColor = [System.Drawing.ColorTranslator]::FromHtml($bgColor)
$form.Opacity = $opacity
$form.StartPosition = "Manual"

$screenW = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Width
$screenH = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Height
$h = $form.Height

if ($position -eq "bottom-left") {
  $form.Location = New-Object System.Drawing.Point(10, ($screenH - $h - 10))
} elseif ($position -eq "top-right") {
  $form.Location = New-Object System.Drawing.Point(($screenW - $winWidth - 10), 10)
} elseif ($position -eq "top-left") {
  $form.Location = New-Object System.Drawing.Point(10, 10)
} else {
  $form.Location = New-Object System.Drawing.Point(($screenW - $winWidth - 10), ($screenH - $h - 10))
}

$label = New-Object System.Windows.Forms.Label
$label.Text = $title + "`n" + $body
$label.Font = New-Object System.Drawing.Font($fontFamily, $fontSize)
$label.ForeColor = [System.Drawing.ColorTranslator]::FromHtml($textColor)
$label.AutoSize = $false
$label.Width = $winWidth - 20
$label.Height = $h - 12
$label.Location = New-Object System.Drawing.Point(10, 6)
$form.Controls.Add($label)

# === 飞书通知（如已启用）===
$larkEnabled = if ($style.lark -and $style.lark.enabled) { $true } else { $false }
$larkOpenId  = if ($style.lark -and $style.lark.openId)  { $style.lark.openId } else { "" }

if ($larkEnabled -and $larkOpenId) {
  $larkMsg = $title + ": " + $body
  $larkMsg = $larkMsg -replace "'", "'\''"
  $null = & bash -c "lark-cli im +messages-send --as bot --user-id $larkOpenId --text '$larkMsg' 2>/dev/null" 2>$null
}

$form.Show()
$until = [DateTime]::Now.AddSeconds($duration)
while ([DateTime]::Now -lt $until -and $form.Visible) {
  [System.Windows.Forms.Application]::DoEvents()
  Start-Sleep -Milliseconds 100
}
$form.Close()
