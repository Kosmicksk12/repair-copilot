Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Xml.Linq

$ErrorActionPreference = "Stop"

$sourcePath = "data\oliphone-repairs-dataset.xlsx.xlsx"
$outputPath = "data\repair-knowledge.json"

$zip = [IO.Compression.ZipFile]::OpenRead($sourcePath)
$ns = [System.Xml.Linq.XNamespace]"http://schemas.openxmlformats.org/spreadsheetml/2006/main"

function Read-Xml($entryName) {
  $entry = $zip.GetEntry($entryName)
  $stream = $entry.Open()
  try {
    return [System.Xml.Linq.XDocument]::Load($stream)
  }
  finally {
    $stream.Dispose()
  }
}

function Get-ColIndex($ref) {
  $letters = ([regex]::Match($ref, "^[A-Z]+")).Value
  $index = 0
  foreach ($char in $letters.ToCharArray()) {
    $index = $index * 26 + ([int][char]$char - [int][char]"A" + 1)
  }
  return $index - 1
}

$sharedStrings = New-Object System.Collections.Generic.List[string]
$sharedStringsDoc = Read-Xml "xl/sharedStrings.xml"
foreach ($si in $sharedStringsDoc.Root.Elements($ns + "si")) {
  $parts = New-Object System.Collections.Generic.List[string]
  foreach ($textNode in $si.Descendants($ns + "t")) {
    [void]$parts.Add($textNode.Value)
  }
  [void]$sharedStrings.Add(($parts -join ""))
}

function Get-CellValue($cell) {
  $value = $cell.Element($ns + "v")
  if ($null -eq $value) {
    return ""
  }

  if (($cell.Attribute("t") | ForEach-Object Value) -eq "s") {
    return $sharedStrings[[int]$value.Value]
  }

  return $value.Value
}

function Get-RowValue($map, $headers, $name) {
  if (-not $headers.ContainsKey($name)) {
    return ""
  }

  $index = $headers[$name]
  if ($map.ContainsKey($index)) {
    return (($map[$index] -replace "\s+", " ").Trim())
  }

  return ""
}

function Sanitize-CompanyReferences($value) {
  if ($null -eq $value) {
    return $value
  }

  return (($value -replace "(?i)AppleFix\s*Telefonos", "Historial de reparaciones") `
    -replace "(?i)Apple\s+Fix", "Centro de servicio") `
    -replace "(?i)AppleFix", "Taller"
}

function Parse-Decimal($value) {
  $clean = (($value -replace "[^0-9\.-]", "").Trim())
  if ([string]::IsNullOrWhiteSpace($clean)) {
    return 0
  }

  return [decimal]$clean
}

function Parse-Integer($value) {
  $clean = (($value -replace "[^0-9-]", "").Trim())
  if ([string]::IsNullOrWhiteSpace($clean)) {
    return 0
  }

  return [int]$clean
}

$sheet = Read-Xml "xl/worksheets/sheet1.xml"
$rows = @($sheet.Descendants($ns + "row"))
$headers = @{}

foreach ($cell in $rows[0].Elements($ns + "c")) {
  $headers[(Get-CellValue $cell)] = Get-ColIndex (($cell.Attribute("r")).Value)
}

$repairs = New-Object System.Collections.Generic.List[object]

foreach ($row in $rows | Select-Object -Skip 1) {
  $map = @{}
  foreach ($cell in $row.Elements($ns + "c")) {
    $map[(Get-ColIndex (($cell.Attribute("r")).Value))] = Get-CellValue $cell
  }

  $orderId = Get-RowValue $map $headers "Order ID"
  if ([string]::IsNullOrWhiteSpace($orderId)) {
    continue
  }

  $repair = [ordered]@{
    id = $orderId
    marca = Sanitize-CompanyReferences (Get-RowValue $map $headers "Brand")
    modelo = Sanitize-CompanyReferences (Get-RowValue $map $headers "Model")
    tipoDanio = Sanitize-CompanyReferences (Get-RowValue $map $headers "Damage Type")
    descripcion = Sanitize-CompanyReferences (Get-RowValue $map $headers "Description")
    estado = Sanitize-CompanyReferences (Get-RowValue $map $headers "Status")
    garantia = Sanitize-CompanyReferences (Get-RowValue $map $headers "Warranty Date")
    tecnico = Sanitize-CompanyReferences (Get-RowValue $map $headers "Technician")
    fechaCreacion = Get-RowValue $map $headers "Created Date"
    fechaEntrega = Get-RowValue $map $headers "Delivery Date"
    fuenteTrafico = Sanitize-CompanyReferences (Get-RowValue $map $headers "Traffic Source")
    valorVenta = Parse-Decimal (Get-RowValue $map $headers "Sale Value")
    saldoPendiente = Parse-Decimal (Get-RowValue $map $headers "Outstanding Balance")
    estadoPago = Sanitize-CompanyReferences (Get-RowValue $map $headers "Payment Status")
    diasEnProceso = Parse-Integer (Get-RowValue $map $headers "Days in Process")
  }

  [void]$repairs.Add($repair)
}

$payload = [ordered]@{
  generatedAt = (Get-Date).ToString("s")
  source = $sourcePath
  totalRepairs = $repairs.Count
  repairs = $repairs
}

$json = $payload | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText((Resolve-Path $outputPath).Path, $json, [System.Text.UTF8Encoding]::new($false))

$zip.Dispose()

Write-Output "Generated $($repairs.Count) sanitized repairs in $outputPath"
