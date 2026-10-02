function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvField).join(','));
  // 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM을 붙인다.
  return '﻿' + lines.join('\r\n');
}
