param([Parameter(Mandatory = $true)][string]$Out)
# One wav per script line, in the Windows Zira voice. "Afya" gets a Swahili pronunciation hint (AH-fya).
Add-Type -AssemblyName System.Speech
New-Item -ItemType Directory -Force $Out | Out-Null
$script = Get-Content (Join-Path $PSScriptRoot "script.json") -Raw | ConvertFrom-Json
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice($script.voice)
$s.Rate = 1
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(24000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$ph = [string][char]0x02C8 + [char]0x0251 + "fj" + [char]0x0251
$afya = "<phoneme alphabet=""ipa"" ph=""$ph"">Afya</phoneme>"
foreach ($l in $script.lines) {
  $text = [System.Security.SecurityElement]::Escape($l.text).Replace("Afya", $afya)
  $ssml = "<speak version=""1.0"" xmlns=""http://www.w3.org/2001/10/synthesis"" xml:lang=""en-US"">$text</speak>"
  $s.SetOutputToWaveFile((Join-Path $Out "$($l.id).wav"), $fmt)
  $s.SpeakSsml($ssml)
  $s.SetOutputToNull()
}
$s.Dispose()
