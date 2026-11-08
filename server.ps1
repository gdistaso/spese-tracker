param(
    [int]$Port = 8080,
    [string]$Root = "C:\Users\Pino\.gemini\antigravity\scratch\spese-tracker"
)

$endpoint = New-Object System.Net.IPEndPoint ([System.Net.IPAddress]::Any, $Port)
$listener = New-Object System.Net.Sockets.TcpListener $endpoint

try {
    $listener.Start()
} catch {
    Write-Error "Impossibile avviare il server sulla porta $Port : $($_.Exception.Message)"
    exit 1
}

Write-Host "Server HTTP avviato con successo su http://0.0.0.0:$Port"
Write-Host "Cartella servita: $Root"

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 5000
            $client.SendTimeout = 5000
            $stream = $client.GetStream()
            $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII)
            $writer = New-Object System.IO.BinaryWriter($stream)

            $requestLine = $reader.ReadLine()
            if ($requestLine) {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Richiesta: $requestLine"
                $tokens = $requestLine.Split(' ')
                if ($tokens.Length -ge 2) {
                    $rawPath = $tokens[1]
                    $cleanPath = $rawPath.Split('?')[0].TrimStart('/')
                    if ([string]::IsNullOrWhiteSpace($cleanPath)) {
                        $cleanPath = "index.html"
                    }

                    $cleanPath = [System.Uri]::UnescapeDataString($cleanPath).Replace('/', '\')
                    $targetFile = [System.IO.Path]::GetFullPath((Join-Path $Root $cleanPath))

                    # Protezione: assicurati che il file sia dentro $Root
                    if ($targetFile.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path $targetFile -PathType Leaf)) {
                        $bytes = [System.IO.File]::ReadAllBytes($targetFile)
                        $ext = [System.IO.Path]::GetExtension($targetFile).ToLower()
                        $mime = switch ($ext) {
                            ".html" { "text/html; charset=utf-8" }
                            ".css"  { "text/css; charset=utf-8" }
                            ".js"   { "application/javascript; charset=utf-8" }
                            ".json" { "application/json; charset=utf-8" }
                            ".svg"  { "image/svg+xml" }
                            ".png"  { "image/png" }
                            ".jpg"  { "image/jpeg" }
                            default { "application/octet-stream" }
                        }

                        $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
                        $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                        $writer.Write($headerBytes)
                        $writer.Write($bytes)
                        $writer.Flush()
                    } else {
                        $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 File Not Found")
                        $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($notFound.Length)`r`nConnection: close`r`n`r`n"
                        $writer.Write([System.Text.Encoding]::ASCII.GetBytes($header))
                        $writer.Write($notFound)
                        $writer.Flush()
                    }
                }
            }
        } catch {
            # Errore di lettura o disconnessione rapida del client
        } finally {
            $client.Close()
        }
    }
} finally {
    $listener.Stop()
}
