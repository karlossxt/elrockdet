#!/usr/bin/env pwsh
# Actualiza la seccion ULTIMO RUIDO de index.html con las 9 notas mas recientes.
#
# Meta opcionales dentro del <head> de cada nota:
#   <meta name="index-order" content="1">     desempate para notas de la misma fecha
#   <meta name="index-tag" content="...">     etiqueta personalizada de la tarjeta
#   <meta name="index-title" content="...">   titulo personalizado de la tarjeta
#   <meta name="index-excerpt" content="..."> resumen personalizado de la tarjeta

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
$indexPath = Join-Path $root 'index.html'

function Read-Utf8([string]$path) {
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}

function Get-Meta([string]$html, [string]$name) {
    $n = [regex]::Escape($name)
    $patterns = @(
        ('property="' + $n + '"\s+content="([^"]*)"'),
        ('content="([^"]*)"\s+property="' + $n + '"'),
        ('name="' + $n + '"\s+content="([^"]*)"'),
        ('content="([^"]*)"\s+name="' + $n + '"')
    )
    foreach ($p in $patterns) {
        $m = [regex]::Match($html, $p, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if ($m.Success) {
            return [System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value).Trim()
        }
    }
    return ''
}

function Get-Metas([string]$html, [string]$name) {
    $n = [regex]::Escape($name)
    $patterns = @(
        ('property="' + $n + '"\s+content="([^"]*)"'),
        ('content="([^"]*)"\s+property="' + $n + '"')
    )
    foreach ($p in $patterns) {
        $found = [regex]::Matches($html, $p, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if ($found.Count -gt 0) {
            $values = @()
            foreach ($m in $found) {
                $values += [System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value).Trim()
            }
            return $values
        }
    }
    return @()
}

function Escape-Html([string]$value) {
    if ($null -eq $value) { return '' }
    return $value.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;').Replace('"', '&quot;')
}

function Shorten([string]$value, [int]$max) {
    if ($null -eq $value) { return '' }
    $value = $value.Trim()
    if ($value.Length -le $max) { return $value }
    $cut = $value.Substring(0, $max)
    $space = $cut.LastIndexOf(' ')
    if ($space -gt [int]($max * 0.6)) { $cut = $cut.Substring(0, $space) }
    $cut = $cut.TrimEnd(',', ';', ':', '.', ' ')
    return $cut + [char]0x2026
}

# --- Leer el index actual ---
$indexHtml = Read-Utf8 $indexPath
$markerIndex = $indexHtml.IndexOf('RUIDO</h3>')
if ($markerIndex -lt 0) { throw 'No se encontro la seccion ULTIMO RUIDO en index.html' }

$sectionStart = $indexHtml.IndexOf('<section class="news-grid">', $markerIndex)
$sectionEnd = $indexHtml.IndexOf('</section>', $sectionStart)
if ($sectionStart -lt 0 -or $sectionEnd -lt 0) { throw 'No se encontro el grid de ULTIMO RUIDO en index.html' }
$lineStart = $indexHtml.LastIndexOf("`n", $sectionStart) + 1

# --- Recopilar notas ---
$posts = @()
$postDirs = Get-ChildItem -Path $root -Directory | Where-Object { $_.Name -like 'notas*' }
foreach ($dir in $postDirs) {
    foreach ($file in Get-ChildItem -Path $dir.FullName -File -Filter '*.html') {
        if ($file.Name -eq 'index.html') { continue }

        $html = Read-Utf8 $file.FullName
        $published = Get-Meta $html 'article:published_time'
        if (-not $published) { continue }

        try {
            $date = [datetime]::Parse($published, [System.Globalization.CultureInfo]::InvariantCulture)
        } catch {
            continue
        }

        $title = Get-Meta $html 'og:title'
        if (-not $title) { $title = Get-Meta $html 'twitter:title' }
        $title = [regex]::Replace($title, '^\s*(ELROCK|BYTEMOS)\s*\|\s*', '', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase).Trim()
        if (-not $title) { continue }

        $description = Get-Meta $html 'og:description'
        if (-not $description) { $description = Get-Meta $html 'twitter:description' }

        $image = Get-Meta $html 'og:image'
        if (-not $image) { $image = Get-Meta $html 'twitter:image' }
        $image = [regex]::Replace($image, '^https?://(www\.)?elrockdetodoslosdias\.com\.mx/', '')
        if (-not $image) { $image = 'logo-rock.webp' }

        $cardTitle = Get-Meta $html 'index-title'
        if (-not $cardTitle) { $cardTitle = $title }

        $cardExcerpt = Get-Meta $html 'index-excerpt'
        if (-not $cardExcerpt) { $cardExcerpt = Shorten $description 150 }

        $tag = Get-Meta $html 'index-tag'
        if (-not $tag) {
            $section = Get-Meta $html 'article:section'
            $tags = @(Get-Metas $html 'article:tag')
            $genre = ''
            if ($tags.Count -ge 2) { $genre = $tags[1] }

            $label = 'NOTA'
            if ($section -match '^Escena$') { $label = 'ESCENA NACIONAL' }
            elseif ($section -match '^M.?sica$') { $label = 'ESTRENO' }
            elseif ($section -match '^Efem.?rides$') { $label = 'EFEM' + [char]0x00C9 + 'RIDES' }
            elseif ($section -match '^Cr.?nica$') { $label = 'CR' + [char]0x00D3 + 'NICA' }
            elseif ($section) { $label = $section.ToUpper() }

            if ($genre) {
                $genre = $genre.ToUpper()
                if ($genre.Length -gt 20) { $genre = ($genre -split '\s+')[0] }
                $tag = $label + ' // ' + $genre
            } else {
                $tag = $label
            }
        }

        $orderText = Get-Meta $html 'index-order'
        $order = 999
        if ($orderText -match '^\d+$') { $order = [int]$orderText }

        $relPath = $file.FullName.Substring($root.Length + 1).Replace('\', '/')

        $posts += [pscustomobject]@{
            Path        = $relPath
            Date        = $date
            Title       = $title
            CardTitle   = $cardTitle
            CardExcerpt = $cardExcerpt
            Image       = $image
            Tag         = $tag
            Order       = $order
        }
    }
}

if ($posts.Count -eq 0) { throw 'No se encontraron notas con article:published_time' }

# --- Elegir las 9 mas recientes ---
$selected = $posts | Sort-Object `
    @{ Expression = { $_.Date }; Descending = $true }, `
    @{ Expression = { $_.Order }; Ascending = $true }, `
    @{ Expression = { $_.Path }; Ascending = $true } |
    Select-Object -First 9

# --- Generar el HTML ---
$newline = "`n"
if ($indexHtml.Contains("`r`n")) { $newline = "`r`n" }

$lines = @()
$lines += '        <section class="news-grid">'
foreach ($post in $selected) {
    $lines += '            <a href="' + (Escape-Html $post.Path) + '" class="card">'
    $lines += '                <div class="card-img"><img src="' + (Escape-Html $post.Image) + '" alt="' + (Escape-Html $post.CardTitle) + '" loading="lazy"></div>'
    $lines += '                <span class="card-tag">' + (Escape-Html $post.Tag) + '</span>'
    $lines += '                <h4 class="card-title">' + (Escape-Html $post.CardTitle) + '</h4>'
    $lines += '                <p class="card-excerpt">' + (Escape-Html $post.CardExcerpt) + '</p>'
    $lines += '            </a>'
}
$lines += '        </section>'

$newSection = $lines -join $newline
$newHtml = $indexHtml.Substring(0, $lineStart) + $newSection + $indexHtml.Substring($sectionEnd + '</section>'.Length)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($indexPath, $newHtml, $utf8NoBom)

Write-Host ("ULTIMO RUIDO actualizado con {0} notas." -f @($selected).Count)
foreach ($post in $selected) {
    Write-Host ("  - {0} | {1}" -f $post.Date.ToString('yyyy-MM-dd'), $post.Path)
}
