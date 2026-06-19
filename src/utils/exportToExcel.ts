import ExcelJS from 'exceljs';

/** Format tanggal untuk nama file: YYYY-MM-DD → DD-MM-YYYY */
function formatDateForFilename(isoDate: string): string {
    if (!isoDate || !isoDate.trim()) return '';
    const d = new Date(isoDate.trim());
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

/** Resolves display title to card name format: e.g. "Production Line 6" -> "Line 6" */
function getLineLabelFromDisplayTitle(displayTitle?: string, lineId?: string): string {
    if (!displayTitle || !displayTitle.trim()) return `Line ${lineId || ''}`;
    
    const title = displayTitle.trim();
    // Check if it matches "Production Line X" or "Sewing Line X"
    const match = title.match(/(?:Production|Sewing)?\s*Line\s*(\w+)/i);
    if (match) {
        return `Line ${match[1]}`;
    }
    
    // Check if it matches "Line X" or "LINE X"
    const matchLine = title.match(/Line\s*(\w+)/i);
    if (matchLine) {
        return `Line ${matchLine[1]}`;
    }
    
    // If it's just a number
    if (/^\d+$/.test(title)) {
        return `Line ${title}`;
    }
    
    return title;
}

/**
 * Nama file export: {jenis_dashboard}{line_x}{date_from}to{date_to}.extension
 */
function buildExportFilename(
    jenisDashboard: string,
    lineX: string,
    extension: 'xlsx' | 'csv',
    dateFrom?: string,
    dateTo?: string
): string {
    const today = new Date();
    const todayStr = formatDateForFilename(today.toISOString().split('T')[0]);
    const fromStr = (dateFrom && formatDateForFilename(dateFrom)) || todayStr;
    const toStr = (dateTo && formatDateForFilename(dateTo)) || fromStr;
    const ext = extension;
    const base = `${jenisDashboard}${lineX}${fromStr}to${toStr}`;
    return `${base}.${ext}`;
}

export interface ExportData {
    tanggal: string;
    line: string;
    wo: string;
    style: string;
    item: string;
    buyer: string;
    color?: string;
    size?: string;
    outputSewing: number;
    qcRework: number;
    qcWira: number;
    qcReject: number;
    qcGood: number;
    pqcRework: number;
    pqcWira: number;
    pqcReject: number;
    pqcGood: number;
    goodSewing: number;
    balance: number;
    qcChartImage?: string; // Base64 PNG
    pqcChartImage?: string; // Base64 PNG
}

export type ExportType = 'all' | 'daily' | 'summary' | 'detail';

/** Format timestamp: YYYY-MM-DDTHH:mm:ss -> DD MMM YYYY, HH.mm.ss */
function formatTimestamp(timestamp: string): string {
    if (!timestamp) return '-';
    try {
        let date: Date;
        const hasTimezone = timestamp.includes('Z') || timestamp.match(/[+-]\d{2}:\d{2}$/);
        if (!hasTimezone) {
            const parts = timestamp.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
            if (parts) {
                const [, year, month, day, hour, minute, second] = parts;
                date = new Date(
                    parseInt(year),
                    parseInt(month) - 1,
                    parseInt(day),
                    parseInt(hour),
                    parseInt(minute),
                    parseInt(second)
                );
            } else {
                date = new Date(timestamp);
            }
        } else {
            date = new Date(timestamp);
        }

        if (isNaN(date.getTime())) {
            return timestamp;
        }

        const day = String(date.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${day} ${month} ${year}, ${hours}.${minutes}.${seconds}`;
    } catch (e) {
        return timestamp;
    }
}/** Menulis worksheet detail dengan layout tabel standard */
function writeDetailSheet(
    worksheet: ExcelJS.Worksheet,
    sectionName: string,
    items: any[],
    headerStyle: any,
    dataCellStyle: any,
    dataCellStyleAlt: any,
    lineId: string,
    filterDateFrom?: string,
    filterDateTo?: string,
    supervisorName?: string,
    resolvedLineLabel?: string
) {
    let currentRow = 1;

    // 1. Get Date and Time formatting
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    // Format period dates
    let periodeStr = '';
    const formatDateToDDMMYYYY = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    if (filterDateFrom && filterDateTo) {
        const fromStr = formatDateToDDMMYYYY(filterDateFrom);
        const toStr = formatDateToDDMMYYYY(filterDateTo);
        periodeStr = fromStr === toStr ? fromStr : `${fromStr} s/d ${toStr}`;
    } else {
        const todayStr = formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]);
        periodeStr = todayStr;
    }

    // Format export time
    const now = new Date();
    const expDay = String(now.getDate()).padStart(2, '0');
    const expMonth = monthNamesShort[now.getMonth()];
    const expYear = now.getFullYear();
    const expHour = String(now.getHours()).padStart(2, '0');
    const expMin = String(now.getMinutes()).padStart(2, '0');
    const exportTimeStr = `Waktu ekspor: ${expDay} ${expMonth} ${expYear}, ${expHour}.${expMin}`;

    const bannerBorder = {
        top: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
        left: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
        bottom: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
        right: { style: 'thin' as const, color: { argb: 'FF94A3B8' } }
    };

    // --- ROW 1: Title Block ---
    const lineSuffix = supervisorName ? `LINE ${supervisorName.toUpperCase()}` : `LINE ${lineId}`;
    worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = `Daily Output Line - ${sectionName} - ${lineSuffix}`;
    titleCell.font = { bold: true, size: 17, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
    titleCell.fill = {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF0F766E' } // Dark teal like the first image
    };
    titleCell.alignment = { horizontal: 'left' as const, vertical: 'middle' as const, indent: 1 };
    titleCell.border = bannerBorder;
    worksheet.getRow(currentRow).height = 36;
    currentRow++;

    // --- ROW 2: Filter Period Block ---
    worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
    const periodCell = worksheet.getCell(`A${currentRow}`);
    periodCell.value = `Periode filter: ${periodeStr}`;
    periodCell.font = { size: 13, color: { argb: 'FF0F172A' }, name: 'Segoe UI' };
    periodCell.fill = {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FFCCFBF1' } // Light mint/teal like the first image
    };
    periodCell.alignment = { horizontal: 'left' as const, vertical: 'middle' as const, indent: 1 };
    periodCell.border = bannerBorder;
    worksheet.getRow(currentRow).height = 28;
    currentRow++;

    // --- ROW 3: Export Time Block ---
    worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
    const exportTimeCell = worksheet.getCell(`A${currentRow}`);
    exportTimeCell.value = exportTimeStr;
    exportTimeCell.font = { italic: true, size: 12, color: { argb: 'FF334155' }, name: 'Segoe UI' };
    exportTimeCell.fill = {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FFF1F5F9' } // Light slate background like the first image
    };
    exportTimeCell.alignment = { horizontal: 'left' as const, vertical: 'middle' as const, indent: 1 };
    exportTimeCell.border = bannerBorder;
    worksheet.getRow(currentRow).height = 24;
    currentRow++;

    currentRow++; // Spacing empty row

    // Headers
    const headers = ['No', 'RFID ID', 'WO', 'Style', 'Buyer', 'Item', 'Color', 'Size', 'SPV LINE', 'Timestamp'];
    const headerRowNumber = currentRow;
    
    // Set column widths
    worksheet.getColumn(1).width = 8;   // No
    worksheet.getColumn(2).width = 18;  // RFID ID
    worksheet.getColumn(3).width = 15;  // WO
    worksheet.getColumn(4).width = 15;  // Style
    worksheet.getColumn(5).width = 32;  // Buyer
    worksheet.getColumn(6).width = 35;  // Item
    worksheet.getColumn(7).width = 12;  // Color
    worksheet.getColumn(8).width = 12;  // Size
    worksheet.getColumn(9).width = 15;  // Line (changed to SPV LINE width)
    worksheet.getColumn(10).width = 25; // Timestamp

    headers.forEach((header, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = header;
        Object.assign(cell, headerStyle);
    });
    worksheet.getRow(currentRow).height = 28;

    // Enable AutoFilter pada baris header
    worksheet.autoFilter = `A${headerRowNumber}:J${headerRowNumber}`;
    
    currentRow++;

    // Sort items by WO ascending first, then by timestamp descending
    const sortedItems = [...items].sort((a, b) => {
        const woA = String(a.wo || '');
        const woB = String(b.wo || '');
        const compWo = woA.localeCompare(woB, undefined, { numeric: true, sensitivity: 'base' });
        if (compWo !== 0) return compWo;
        
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
    });

    // Data rows
    sortedItems.forEach((item, index) => {
        const rowStyle = index % 2 === 0 ? dataCellStyle : dataCellStyleAlt;
        const formattedTime = formatTimestamp(item.timestamp);
        
        const rowData = [
            index + 1, // Berurutan naik
            item.rfid_garment || '-',
            item.wo || '-',
            item.style || '-',
            item.buyer || '-',
            item.item || '-',
            item.color || '-',
            item.size || '-',
            supervisorName || resolvedLineLabel || item.line || '-',
            formattedTime
        ];

        rowData.forEach((value, colIndex) => {
            const cell = worksheet.getCell(currentRow, colIndex + 1);
            cell.value = value;
            Object.assign(cell, rowStyle);

            // Special styling for RFID ID - Light Blue
            if (colIndex === 1) {
                cell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE0F2FE' } }; // Light sky blue
                cell.font = { size: 10, bold: true, color: { argb: 'FF1D4ED8' }, name: 'Segoe UI' }; // Royal blue
            }
        });

        worksheet.getRow(currentRow).height = 22.5;
        currentRow++;
    });
}

export async function exportToExcel(
    data: any,
    lineId: string,
    format: 'excel' | 'csv' = 'excel',
    filterDateFrom?: string,
    filterDateTo?: string,
    exportType: ExportType = 'all',
    supervisorName?: string,
    lineDisplayTitle?: string
) {
    // Validasi data
    if (!data) {
        throw new Error('Data tidak boleh kosong');
    }
    if (exportType !== 'detail' && (!Array.isArray(data) || data.length === 0)) {
        throw new Error('Data tidak boleh kosong');
    }

    // Resolusi nama line
    const resolvedLineLabel = getLineLabelFromDisplayTitle(lineDisplayTitle, lineId);

    // Buat workbook baru
    const workbook = new ExcelJS.Workbook();

    if (exportType === 'detail') {
        if (format === 'excel') {
            const sheetOptions = {
                pageSetup: {
                    paperSize: 9, // A4
                    orientation: 'landscape' as const,
                    fitToPage: true,
                    fitToWidth: 1,
                    fitToHeight: 0,
                    margins: {
                        left: 0.5,
                        right: 0.5,
                        top: 0.5,
                        bottom: 0.5,
                        header: 0.3,
                        footer: 0.3
                    }
                }
            };

            const sheetOutput = workbook.addWorksheet('Output Sewing', sheetOptions);
            const sheetQcGood = workbook.addWorksheet('QC Good', sheetOptions);
            const sheetPqcGood = workbook.addWorksheet('PQC Good', sheetOptions);

            const detailHeaderStyle = {
                font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' },
                fill: {
                    type: 'pattern' as const,
                    pattern: 'solid' as const,
                    fgColor: { argb: 'FF1D4ED8' } // Royal blue header (matches user request)
                },
                alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
                border: {
                    top: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
                    bottom: { style: 'medium' as const, color: { argb: 'FF475569' } },
                    left: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
                    right: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } }
                }
            };

            const detailDataRowStyle = {
                font: { size: 10, color: { argb: 'FF334155' }, name: 'Segoe UI' },
                fill: {
                    type: 'pattern' as const,
                    pattern: 'solid' as const,
                    fgColor: { argb: 'FFFFFFFF' } // White
                },
                alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
                border: {
                    top: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } }
                }
            };

            const detailDataRowStyleAlt = {
                font: { size: 10, color: { argb: 'FF334155' }, name: 'Segoe UI' },
                fill: {
                    type: 'pattern' as const,
                    pattern: 'solid' as const,
                    fgColor: { argb: 'FFF8FAFC' } // Tailwind slate-50 (zebra striping)
                },
                alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
                border: {
                    top: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } }
                }
            };

            writeDetailSheet(
                sheetOutput,
                'OUTPUT SEWING',
                data.outputSewing || [],
                detailHeaderStyle,
                detailDataRowStyle,
                detailDataRowStyleAlt,
                lineId,
                filterDateFrom,
                filterDateTo,
                supervisorName,
                resolvedLineLabel
            );

            writeDetailSheet(
                sheetQcGood,
                'QC GOOD',
                data.qcGood || [],
                detailHeaderStyle,
                detailDataRowStyle,
                detailDataRowStyleAlt,
                lineId,
                filterDateFrom,
                filterDateTo,
                supervisorName,
                resolvedLineLabel
            );

            writeDetailSheet(
                sheetPqcGood,
                'PQC GOOD',
                data.pqcGood || [],
                detailHeaderStyle,
                detailDataRowStyle,
                detailDataRowStyleAlt,
                lineId,
                filterDateFrom,
                filterDateTo,
                supervisorName,
                resolvedLineLabel
            );

            const filename = buildExportFilename(
                'RFID_Detail_',
                `Line${lineId}`,
                'xlsx',
                filterDateFrom,
                filterDateTo
            );

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            return;
        } else {
            // CSV Format for Detail
            const csvData: string[][] = [];
            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                               'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            let tanggalStr = '';
            if (filterDateFrom && filterDateTo) {
                const fromDate = new Date(filterDateFrom);
                const toDate = new Date(filterDateTo);
                const fromStr = `${fromDate.getDate()} ${monthNames[fromDate.getMonth()]} ${fromDate.getFullYear()}`;
                const toStr = `${toDate.getDate()} ${monthNames[toDate.getMonth()]} ${toDate.getFullYear()}`;
                tanggalStr = fromStr === toStr ? fromStr : `${fromStr} - ${toStr}`;
            } else {
                const now = new Date();
                tanggalStr = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
            }

            const lineSuffix = supervisorName ? `LINE ${supervisorName.toUpperCase()}` : `LINE ${lineId}`;
            csvData.push([`Daily Output Line - RFID DETAIL REPORT - ${lineSuffix} - ${tanggalStr}`]);
            csvData.push([]);

            // Helper to add data to CSV
            const addSectionToCsv = (sectionTitle: string, items: any[]) => {
                csvData.push([sectionTitle]);
                csvData.push(['No', 'RFID ID', 'WO', 'Style', 'Buyer', 'Item', 'Color', 'Size', 'SPV LINE', 'Timestamp']);
                
                // Sort items by WO ascending first, then by timestamp descending
                const sortedItems = [...items].sort((a, b) => {
                    const woA = String(a.wo || '');
                    const woB = String(b.wo || '');
                    const compWo = woA.localeCompare(woB, undefined, { numeric: true, sensitivity: 'base' });
                    if (compWo !== 0) return compWo;
                    
                    const timeA = new Date(a.timestamp || 0).getTime();
                    const timeB = new Date(b.timestamp || 0).getTime();
                    return timeB - timeA;
                });

                sortedItems.forEach((item, index) => {
                    csvData.push([
                        (index + 1).toString(),
                        item.rfid_garment || '-',
                        item.wo || '-',
                        item.style || '-',
                        item.buyer || '-',
                        item.item || '-',
                        item.color || '-',
                        item.size || '-',
                        supervisorName || resolvedLineLabel || item.line || '-',
                        formatTimestamp(item.timestamp)
                    ]);
                });
                csvData.push([]);
            };

            addSectionToCsv('OUTPUT SEWING', data.outputSewing || []);
            addSectionToCsv('QC GOOD', data.qcGood || []);
            addSectionToCsv('PQC GOOD', data.pqcGood || []);

            const filename = buildExportFilename(
                'RFID_Detail_',
                `Line${lineId}`,
                'csv',
                filterDateFrom,
                filterDateTo
            );

            const csv = csvData.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            return;
        }
    }

    const worksheet = workbook.addWorksheet('RFID Tracking', {
        pageSetup: {
            paperSize: 9, // A4
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 1,
            margins: {
                left: 0.5,
                right: 0.5,
                top: 0.5,
                bottom: 0.5,
                header: 0.3,
                footer: 0.3
            }
        }
    });

    // Style definitions
    const headerStyle = {
        font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1D4ED8' } // Royal Blue
        },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        }
    };

    const subHeaderStyle = {
        font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563EB' } // Medium Blue
        },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        }
    };

    const dataCellStyle = {
        font: { size: 11, bold: true, color: { argb: 'FF000000' } },
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' } // White
        },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        }
    };

    let currentRow = 1;

    // Tentukan apakah ini export per hari
    const isDailyExport = exportType === 'daily';

    // ===== TITLE SECTION =====
    // Format: "RFID TRACKING REPORT DAILY - 2 Desember 2025" atau "RFID TRACKING REPORT DAILY - 2 Desember 2025 - 8 Desember 2025"
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    let tanggalStr = '';
    if (filterDateFrom && filterDateTo) {
        // Jika ada filter dari dan sampai tanggal
        const fromDate = new Date(filterDateFrom);
        const toDate = new Date(filterDateTo);
        const fromStr = `${fromDate.getDate()} ${monthNames[fromDate.getMonth()]} ${fromDate.getFullYear()}`;
        const toStr = `${toDate.getDate()} ${monthNames[toDate.getMonth()]} ${toDate.getFullYear()}`;
        tanggalStr = `${fromStr} - ${toStr}`;
    } else if (filterDateFrom) {
        // Jika hanya ada filter dari tanggal
        const fromDate = new Date(filterDateFrom);
        tanggalStr = `${fromDate.getDate()} ${monthNames[fromDate.getMonth()]} ${fromDate.getFullYear()}`;
    } else {
        // Jika tidak ada filter, gunakan tanggal hari ini
        const now = new Date();
        tanggalStr = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }
    
    // Adjust merge cells based on export type
    const ncol = isDailyExport ? 18 : 17;
    const bannerBorder = {
        top: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
        left: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
        bottom: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
        right: { style: 'thin' as const, color: { argb: 'FF94A3B8' } }
    };

    // --- ROW 1: Title Block ---
    const lineSuffix = supervisorName ? `LINE ${supervisorName.toUpperCase()}` : `LINE ${lineId}`;
    worksheet.mergeCells(currentRow, 1, currentRow, ncol);
    const titleCell = worksheet.getCell(currentRow, 1);
    titleCell.value = `Daily Output Line - RFID TRACKING REPORT - ${lineSuffix}`;
    titleCell.font = { bold: true, size: 17, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F766E' } // Dark teal like the first image
    };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    titleCell.border = bannerBorder;
    worksheet.getRow(currentRow).height = 36;
    currentRow++;

    // --- ROW 2: Filter Period Block ---
    worksheet.mergeCells(currentRow, 1, currentRow, ncol);
    const periodCell = worksheet.getCell(currentRow, 1);
    
    // Format period dates
    let formattedPeriod = '';
    const formatDateToDDMMYYYY = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };
    if (filterDateFrom && filterDateTo) {
        const fromStr = formatDateToDDMMYYYY(filterDateFrom);
        const toStr = formatDateToDDMMYYYY(filterDateTo);
        formattedPeriod = fromStr === toStr ? fromStr : `${fromStr} s/d ${toStr}`;
    } else {
        formattedPeriod = tanggalStr;
    }
    
    periodCell.value = `Periode filter: ${formattedPeriod}`;
    periodCell.font = { size: 13, color: { argb: 'FF0F172A' }, name: 'Segoe UI' };
    periodCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCFBF1' } // Light mint/teal like the first image
    };
    periodCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    periodCell.border = bannerBorder;
    worksheet.getRow(currentRow).height = 28;
    currentRow++;

    // --- ROW 3: Export Time Block ---
    worksheet.mergeCells(currentRow, 1, currentRow, ncol);
    const exportTimeCell = worksheet.getCell(currentRow, 1);
    
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const expDay = String(now.getDate()).padStart(2, '0');
    const expMonth = monthNamesShort[now.getMonth()];
    const expYear = now.getFullYear();
    const expHour = String(now.getHours()).padStart(2, '0');
    const expMin = String(now.getMinutes()).padStart(2, '0');
    
    exportTimeCell.value = `Waktu ekspor: ${expDay} ${expMonth} ${expYear}, ${expHour}.${expMin}`;
    exportTimeCell.font = { italic: true, size: 12, color: { argb: 'FF334155' }, name: 'Segoe UI' };
    exportTimeCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' } // Light slate background like the first image
    };
    exportTimeCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    exportTimeCell.border = bannerBorder;
    worksheet.getRow(currentRow).height = 24;
    currentRow++;

    currentRow++; // Spacing empty row

    // ===== TABLE HEADER SECTION =====
    // Header Row 1: Main Headers
    const headerRow1 = currentRow;
    
    // Set column widths - tambahkan kolom tanggal jika daily export
    const baseColWidths = [15, 12, 12, 30, 30, 15, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12];
    const colWidths = isDailyExport ? [15, ...baseColWidths] : baseColWidths;
    colWidths.forEach((width, idx) => {
        worksheet.getColumn(idx + 1).width = width;
    });

    // Main Headers - jika daily export, tambahkan kolom Tanggal di awal
    const mainHeaders = isDailyExport ? [
        { col: 1, text: 'Tanggal' }, // Kolom tanggal untuk daily export
        { col: 2, text: 'SPV LINE' },
        { col: 3, text: 'WO' },
        { col: 4, text: 'Style' },
        { col: 5, text: 'Item' },
        { col: 6, text: 'Buyer' },
        { col: 7, text: 'Output Sewing' },
        { col: 8, text: 'QC Endline', mergeEnd: 11 }, // Merge H1-K1
        { col: 12, text: 'PQC', mergeEnd: 15 }, // Merge L1-O1
        { col: 16, text: 'GOOD SEWING' },
        { col: 17, text: 'BALANCE' }
    ] : [
        { col: 1, text: 'SPV LINE' },
        { col: 2, text: 'WO' },
        { col: 3, text: 'Style' },
        { col: 4, text: 'Item' },
        { col: 5, text: 'Buyer' },
        { col: 6, text: 'Output Sewing' },
        { col: 7, text: 'QC Endline', mergeEnd: 10 }, // Merge G1-J1
        { col: 11, text: 'PQC', mergeEnd: 14 }, // Merge K1-N1
        { col: 15, text: 'GOOD SEWING' },
        { col: 16, text: 'BALANCE' }
    ];

    mainHeaders.forEach(({ col, text, mergeEnd }) => {
        const cell = worksheet.getCell(headerRow1, col);
        cell.value = text;
        Object.assign(cell, headerStyle);
        
        if (mergeEnd) {
            // Merge horizontal di baris 1 saja (untuk QC Endline dan PQC)
            worksheet.mergeCells(headerRow1, col, headerRow1, mergeEnd);
        }
        // Untuk merge vertikal akan dilakukan setelah headerRow2 dibuat
    });

    currentRow++;

    // Header Row 2: Sub Headers (hanya untuk QC Endline dan PQC)
    const headerRow2 = currentRow;
    const subHeaders = isDailyExport ? [
        { col: 8, text: 'REWORK' },  // QC Endline REWORK
        { col: 9, text: 'WIRA' },   // QC Endline WIRA
        { col: 10, text: 'REJECT' }, // QC Endline REJECT
        { col: 11, text: 'GOOD' },  // QC Endline GOOD
        { col: 12, text: 'REWORK' }, // PQC REWORK
        { col: 13, text: 'WIRA' },   // PQC WIRA
        { col: 14, text: 'REJECT' }, // PQC REJECT
        { col: 15, text: 'GOOD' }    // PQC GOOD
    ] : [
        { col: 7, text: 'REWORK' },  // QC Endline REWORK
        { col: 8, text: 'WIRA' },   // QC Endline WIRA
        { col: 9, text: 'REJECT' }, // QC Endline REJECT
        { col: 10, text: 'GOOD' },  // QC Endline GOOD
        { col: 11, text: 'REWORK' }, // PQC REWORK
        { col: 12, text: 'WIRA' },   // PQC WIRA
        { col: 13, text: 'REJECT' }, // PQC REJECT
        { col: 14, text: 'GOOD' }    // PQC GOOD
    ];

    subHeaders.forEach(({ col, text }) => {
        const cell = worksheet.getCell(headerRow2, col);
        cell.value = text;
        Object.assign(cell, subHeaderStyle);
    });

    currentRow++;

    // ===== DATA ROWS =====
    const dataRows: number[] = [];
    
    data.forEach((rowData: any) => {
        const dataRow = currentRow;
        dataRows.push(dataRow);
        
        // Format tanggal untuk display
        let tanggalDisplay = '';
        if (rowData.tanggal) {
            const date = new Date(rowData.tanggal);
            tanggalDisplay = date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        }
        
        const dataValues = isDailyExport ? [
            tanggalDisplay || rowData.tanggal || '-', // Col 1 - Tanggal (untuk daily export)
            supervisorName || resolvedLineLabel || rowData.line || '-',           // Col 2 - LINE
            rowData.wo || '-',             // Col 3 - WO
            rowData.style || '-',          // Col 4 - Style
            rowData.item || '-',           // Col 5 - Item
            rowData.buyer || '-',         // Col 6 - Buyer
            rowData.outputSewing || 0,     // Col 7 - Output Sewing
            rowData.qcRework || 0,         // Col 8 - QC Endline REWORK
            rowData.qcWira || 0,           // Col 9 - QC Endline WIRA
            rowData.qcReject || 0,        // Col 10 - QC Endline REJECT
            rowData.qcGood || 0,           // Col 11 - QC Endline GOOD
            rowData.pqcRework || 0,        // Col 12 - PQC REWORK
            rowData.pqcWira || 0,         // Col 13 - PQC WIRA
            rowData.pqcReject || 0,       // Col 14 - PQC REJECT
            rowData.pqcGood || 0,          // Col 15 - PQC GOOD
            rowData.goodSewing || 0,       // Col 16 - GOOD SEWING
            rowData.balance || 0           // Col 17 - BALANCE
        ] : [
            supervisorName || resolvedLineLabel || rowData.line || '-',           // Col 1 - LINE
            rowData.wo || '-',             // Col 2 - WO
            rowData.style || '-',          // Col 3 - Style
            rowData.item || '-',           // Col 4 - Item
            rowData.buyer || '-',         // Col 5 - Buyer
            rowData.outputSewing || 0,     // Col 6 - Output Sewing
            rowData.qcRework || 0,         // Col 7 - QC Endline REWORK
            rowData.qcWira || 0,           // Col 8 - QC Endline WIRA
            rowData.qcReject || 0,        // Col 9 - QC Endline REJECT
            rowData.qcGood || 0,           // Col 10 - QC Endline GOOD
            rowData.pqcRework || 0,        // Col 11 - PQC REWORK
            rowData.pqcWira || 0,         // Col 12 - PQC WIRA
            rowData.pqcReject || 0,       // Col 13 - PQC REJECT
            rowData.pqcGood || 0,          // Col 14 - PQC GOOD
            rowData.goodSewing || 0,       // Col 15 - GOOD SEWING
            rowData.balance || 0           // Col 16 - BALANCE
        ];

        dataValues.forEach((value, colIdx) => {
            const col = colIdx + 1;
            const cell = worksheet.getCell(dataRow, col);
            
            // Isi semua cell dengan value (termasuk yang akan di-merge)
            cell.value = value;
            Object.assign(cell, dataCellStyle);

            // Balance column - red if negative (adjust column number based on export type)
            const balanceCol = isDailyExport ? 17 : 16;
            if (col === balanceCol && typeof value === 'number' && value < 0) {
                cell.font = { color: { argb: 'FFFF0000' }, bold: true, size: 11 };
            }
        });

        worksheet.getRow(dataRow).height = 30;
        currentRow++;
    });

    // Tambahkan baris total untuk export daily
    if (isDailyExport && dataRows.length > 0) {
        const totalRow = currentRow;
        
        // Hitung total
        const totalOutputSewing = data.reduce((sum: number, row: any) => sum + (row.outputSewing || 0), 0);
        const totalPqcGood = data.reduce((sum: number, row: any) => sum + (row.pqcGood || 0), 0);
        const balanceFinal = totalOutputSewing - totalPqcGood;
        
        // Style untuk baris total
        const totalRowStyle = {
            font: { size: 11, bold: true, color: { argb: 'FF000000' } },
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE8E8E8' } // Light gray background
            },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top: { style: 'medium', color: { argb: 'FF000000' } },
                bottom: { style: 'medium', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
            }
        };
        
        // Col 1-6: Label "TOTAL" (merged)
        worksheet.getCell(totalRow, 1).value = 'TOTAL';
        worksheet.getCell(totalRow, 1).font = { size: 11, bold: true, color: { argb: 'FF000000' } };
        worksheet.getCell(totalRow, 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8E8E8' }
        };
        worksheet.getCell(totalRow, 1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getCell(totalRow, 1).border = {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            bottom: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
        
        // Merge cells untuk label TOTAL (col 1-6)
        try {
            worksheet.mergeCells(totalRow, 1, totalRow, 6);
        } catch (e) {
            // Ignore jika merge gagal
        }
        
        // Col 7: Total Sewing Output
        worksheet.getCell(totalRow, 7).value = totalOutputSewing;
        Object.assign(worksheet.getCell(totalRow, 7), totalRowStyle);
        
        // Col 8-14: Kosong (QC Endline dan PQC detail)
        for (let col = 8; col <= 14; col++) {
            const cell = worksheet.getCell(totalRow, col);
            Object.assign(cell, totalRowStyle);
            cell.value = '';
        }
        
        // Col 15: Total PQC Good
        worksheet.getCell(totalRow, 15).value = totalPqcGood;
        Object.assign(worksheet.getCell(totalRow, 15), totalRowStyle);
        
        // Col 16: GOOD SEWING (sama dengan Total PQC Good)
        worksheet.getCell(totalRow, 16).value = totalPqcGood;
        Object.assign(worksheet.getCell(totalRow, 16), totalRowStyle);
        
        // Col 17: Balance Final
        worksheet.getCell(totalRow, 17).value = balanceFinal;
        Object.assign(worksheet.getCell(totalRow, 17), totalRowStyle);
        if (balanceFinal < 0) {
            worksheet.getCell(totalRow, 17).font = { color: { argb: 'FFFF0000' }, bold: true, size: 11 };
        }
        
        worksheet.getRow(totalRow).height = 30;
        currentRow++;
    }

    // Merge cells setelah semua data diisi
    if (dataRows.length > 0) {
        try {
            // Adjust merge columns based on export type
            const mergeHeaderColumns = isDailyExport 
                ? [1, 2, 3, 4, 5, 6, 7, 16, 17] // Tanggal, LINE, WO, Style, Item, Buyer, Output Sewing, GOOD SEWING, BALANCE
                : [1, 2, 3, 4, 5, 6, 15, 16]; // LINE, WO, Style, Item, Buyer, Output Sewing, GOOD SEWING, BALANCE
            
            // Merge QC Endline dan PQC dari headerRow1 ke headerRow2
            if (isDailyExport) {
                try {
                    worksheet.mergeCells(headerRow1, 8, headerRow2, 11); // QC Endline H1:K1 -> H2:K2
                } catch (e) {
                    // Ignore jika sudah di-merge atau error
                }
                try {
                    worksheet.mergeCells(headerRow1, 12, headerRow2, 15); // PQC L1:O1 -> L2:O2
                } catch (e) {
                    // Ignore jika sudah di-merge atau error
                }
            } else {
                try {
                    worksheet.mergeCells(headerRow1, 7, headerRow2, 10); // QC Endline G1:J1 -> G2:J2
                } catch (e) {
                    // Ignore jika sudah di-merge atau error
                }
                try {
                    worksheet.mergeCells(headerRow1, 11, headerRow2, 14); // PQC K1:N1 -> K2:N2
                } catch (e) {
                    // Ignore jika sudah di-merge atau error
                }
            }
            
            // Merge cells untuk kolom yang perlu merge vertikal
            mergeHeaderColumns.forEach(col => {
                try {
                    worksheet.mergeCells(headerRow1, col, headerRow2, col);
                } catch (e) {
                    // Ignore error jika merge gagal
                }
            });
        } catch (e) {
            // Ignore error dan tetap lanjutkan export
        }
    }

    // Set row heights
    worksheet.getRow(headerRow1).height = 25;
    worksheet.getRow(headerRow2).height = 22;

    // Nama file: {jenis_dashboard}{line_x}{date_from}to{date_to}.extension
    const lineX = `Line${lineId}`;
    const filename = buildExportFilename(
        'RFID_Tracking_',
        lineX,
        format === 'excel' ? 'xlsx' : 'csv',
        filterDateFrom,
        filterDateTo
    );

    // Export
    if (format === 'excel') {
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    } else {
        // CSV export (simplified)
        const csvData: string[][] = [];

        // Add title
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                           'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        
        let tanggalStr = '';
        if (filterDateFrom && filterDateTo) {
            // Jika ada filter dari dan sampai tanggal
            const fromDate = new Date(filterDateFrom);
            const toDate = new Date(filterDateTo);
            const fromStr = `${fromDate.getDate()} ${monthNames[fromDate.getMonth()]} ${fromDate.getFullYear()}`;
            const toStr = `${toDate.getDate()} ${monthNames[toDate.getMonth()]} ${toDate.getFullYear()}`;
            tanggalStr = `${fromStr} - ${toStr}`;
        } else if (filterDateFrom) {
            // Jika hanya ada filter dari tanggal
            const fromDate = new Date(filterDateFrom);
            tanggalStr = `${fromDate.getDate()} ${monthNames[fromDate.getMonth()]} ${fromDate.getFullYear()}`;
        } else {
            // Jika tidak ada filter, gunakan tanggal hari ini
            const now = new Date();
            tanggalStr = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        }
               const lineSuffix = supervisorName ? `LINE ${supervisorName.toUpperCase()}` : `LINE ${lineId}`;
        csvData.push([`Daily Output Line - RFID TRACKING REPORT DAILY - ${lineSuffix} - ${tanggalStr}`]);
        csvData.push([]);

        // Add headers - Row 1: Main Headers
        if (isDailyExport) {
            csvData.push([
                'Tanggal', 'SPV LINE', 'WO', 'Style', 'Item', 'Buyer',
                'Output Sewing',
                'QC Endline', 'QC Endline', 'QC Endline', 'QC Endline',
                'PQC', 'PQC', 'PQC', 'PQC',
                'GOOD SEWING', 'BALANCE'
            ]);

            // Add headers - Row 2: Sub Headers
            csvData.push([
                '', '', '', '', '', '',
                '',
                'REWORK', 'WIRA', 'REJECT', 'GOOD',
                'REWORK', 'WIRA', 'REJECT', 'GOOD',
                '', ''
            ]);

            // Add data
            data.forEach((row: any) => {
                let tanggalDisplay = '';
                if (row.tanggal) {
                    const date = new Date(row.tanggal);
                    tanggalDisplay = date.toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                }
                csvData.push([
                    tanggalDisplay || row.tanggal || '-',
                    supervisorName || resolvedLineLabel || row.line || '-',
                    row.wo || '-',
                    row.style || '-',
                    row.item || '-',
                    row.buyer || '-',
                    (row.outputSewing || 0).toString(),
                    (row.qcRework || 0).toString(),
                    (row.qcWira || 0).toString(),
                    (row.qcReject || 0).toString(),
                    (row.qcGood || 0).toString(),
                    (row.pqcRework || 0).toString(),
                    (row.pqcWira || 0).toString(),
                    (row.pqcReject || 0).toString(),
                    (row.pqcGood || 0).toString(),
                    (row.goodSewing || 0).toString(),
                    (row.balance || 0).toString()
                ]);
            });
            
            // Tambahkan baris total untuk CSV daily export
            if (data.length > 0) {
                const totalOutputSewing = data.reduce((sum: number, row: any) => sum + (row.outputSewing || 0), 0);
                const totalPqcGood = data.reduce((sum: number, row: any) => sum + (row.pqcGood || 0), 0);
                const balanceFinal = totalOutputSewing - totalPqcGood;
                
                csvData.push([]); // Baris kosong
                csvData.push([
                    'TOTAL', '', '', '', '', '',
                    totalOutputSewing.toString(),
                    '', '', '', '',
                    '', '', '', '',
                    totalPqcGood.toString(),
                    totalPqcGood.toString(),
                    balanceFinal.toString()
                ]);
            }
        } else {
            csvData.push([
                'SPV LINE', 'WO', 'Style', 'Item', 'Buyer',
                'Output Sewing',
                'QC Endline', 'QC Endline', 'QC Endline', 'QC Endline',
                'PQC', 'PQC', 'PQC', 'PQC',
                'GOOD SEWING', 'BALANCE'
            ]);

            // Add headers - Row 2: Sub Headers
            csvData.push([
                '', '', '', '', '',
                '',
                'REWORK', 'WIRA', 'REJECT', 'GOOD',
                'REWORK', 'WIRA', 'REJECT', 'GOOD',
                '', ''
            ]);

            // Add data
            data.forEach((row: any) => {
                csvData.push([
                    supervisorName || resolvedLineLabel || row.line || '-',
                    row.wo || '-',
                    row.style || '-',
                    row.item || '-',
                    row.buyer || '-',
                    (row.outputSewing || 0).toString(),
                    (row.qcRework || 0).toString(),
                    (row.qcWira || 0).toString(),
                    (row.qcReject || 0).toString(),
                    (row.qcGood || 0).toString(),
                    (row.pqcRework || 0).toString(),
                    (row.pqcWira || 0).toString(),
                    (row.pqcReject || 0).toString(),
                    (row.pqcGood || 0).toString(),
                    (row.goodSewing || 0).toString(),
                    (row.balance || 0).toString()
                ]);
            });
        }

        const csv = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }
}

// Interface untuk data List RFID
interface ListRFIDItem {
    id: string | number;
    rfid: string;
    style?: string;
    buyer?: string;
    nomor_wo?: string;
    item?: string;
    color?: string;
    size?: string;
    status: string;
    lokasi?: string;
    line?: string;
    lineNumber?: string;
    timestamp?: string;
}

interface ListRFIDSummary {
    totalData: number;
    statusCounts: {
        Good: number;
        Rework: number;
        Reject: number;
        OUTPUT: number;
        Unknown: number;
    };
    lokasiCounts: Record<string, number>;
    line: string;
    exportDate: string;
    statusChartImage?: string;
    lokasiChartImage?: string;
}

export async function exportListRFIDToExcel(
    data: ListRFIDItem[],
    lineId: string,
    format: 'excel' | 'csv' = 'excel',
    summary?: ListRFIDSummary,
    filterDateFrom?: string,
    filterDateTo?: string
) {
    // Buat workbook baru
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('List RFID', {
        pageSetup: {
            paperSize: 9, // A4
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: {
                left: 0.5,
                right: 0.5,
                top: 0.5,
                bottom: 0.5,
                header: 0.3,
                footer: 0.3
            }
        }
    });

    // Style definitions - sesuai dengan design tabel
    const headerStyle = {
        font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E3A8A' } // Dark blue seperti header tabel
        },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        }
    };

    const summaryHeaderStyle = {
        font: { bold: true, size: 15, color: { argb: 'FFFFFFFF' } },
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0073EE' } // Blue #0073EE
        },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            bottom: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'medium', color: { argb: 'FF000000' } },
            right: { style: 'medium', color: { argb: 'FF000000' } }
        }
    };

    const summaryLabelStyle = {
        font: { bold: true, size: 11, color: { argb: 'FF000000' } },
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFECF5FF' } // Light blue border #ECF5FF
        },
        alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
        border: {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        }
    };

    const summaryValueStyle = {
        font: { size: 11, bold: true, color: { argb: 'FF000000' } },
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' } // White
        },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        }
    };

    const dataRowStyle = {
        font: { size: 11, color: { argb: 'FF000000' } },
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' } // White
        },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        }
    };

    const dataRowStyleAlt = {
        font: { size: 11, color: { argb: 'FF000000' } },
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' } // Light gray untuk zebra striping
        },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        }
    };

    let currentRow = 1;

    // ===== TITLE SECTION =====
    worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = 'LIST RFID DATA REPORT';
    titleCell.font = { bold: true, size: 20, color: { argb: 'FF0073EE' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(currentRow).height = 30;
    currentRow++;

    // ===== SUMMARY SECTION =====
    // Calculate summary jika tidak disediakan
    const calculatedSummary: ListRFIDSummary = summary || {
        totalData: data.length,
        statusCounts: {
            Good: data.filter(item => item.status === 'Good').length,
            Rework: data.filter(item => item.status === 'Rework').length,
            Reject: data.filter(item => item.status === 'Reject').length,
            OUTPUT: data.filter(item => item.status === 'OUTPUT').length,
            Unknown: data.filter(item => !['Good', 'Rework', 'Reject', 'OUTPUT'].includes(item.status)).length
        },
        lokasiCounts: {},
        line: `Line ${lineId}`,
        exportDate: new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    };

    // Calculate lokasi counts
    data.forEach(item => {
        const lokasi = item.lokasi || 'Unknown';
        calculatedSummary.lokasiCounts[lokasi] = (calculatedSummary.lokasiCounts[lokasi] || 0) + 1;
    });

    // Summary Header
    worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
    const summaryHeader = worksheet.getCell(`A${currentRow}`);
    summaryHeader.value = 'SUMMARY DATA';
    Object.assign(summaryHeader, summaryHeaderStyle);
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    // Summary Content - 2 kolom layout
    const summaryLabels = [
        { label: 'Total Data', value: calculatedSummary.totalData.toString() },
        { label: 'Line', value: calculatedSummary.line },
        { label: 'Tanggal Export', value: calculatedSummary.exportDate },
        { label: 'Status GOOD', value: calculatedSummary.statusCounts.Good.toString() },
        { label: 'Status REWORK', value: calculatedSummary.statusCounts.Rework.toString() },
        { label: 'Status REJECT', value: calculatedSummary.statusCounts.Reject.toString() },
        { label: 'Status OUTPUT', value: calculatedSummary.statusCounts.OUTPUT.toString() },
        { label: 'Status UNKNOWN', value: calculatedSummary.statusCounts.Unknown.toString() }
    ];

    // Set column widths untuk summary
    worksheet.getColumn(1).width = 18;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 18;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 18;
    worksheet.getColumn(6).width = 15;

    // Buat summary dalam format 3 pasang kolom per baris
    for (let i = 0; i < summaryLabels.length; i += 3) {
        const row = currentRow;
        const items = summaryLabels.slice(i, i + 3);

        items.forEach((info, colIndex) => {
            const labelCol = colIndex * 2 + 1; // Kolom 1, 3, 5
            const valueCol = labelCol + 1;     // Kolom 2, 4, 6
            const labelCell = worksheet.getCell(row, labelCol);
            const valueCell = worksheet.getCell(row, valueCol);

            labelCell.value = info.label;
            Object.assign(labelCell, summaryLabelStyle);

            valueCell.value = info.value;
            Object.assign(valueCell, summaryValueStyle);
        });

        currentRow++;
    }

    // Lokasi Summary
    const lokasiEntries = Object.entries(calculatedSummary.lokasiCounts).sort((a, b) => b[1] - a[1]);
    if (lokasiEntries.length > 0) {
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        const lokasiHeader = worksheet.getCell(`A${currentRow}`);
        lokasiHeader.value = 'Distribusi Lokasi:';
        Object.assign(lokasiHeader, summaryLabelStyle);
        worksheet.getRow(currentRow).height = 20;
        currentRow++;

        for (let i = 0; i < lokasiEntries.length; i += 3) {
            const row = currentRow;
            const items = lokasiEntries.slice(i, i + 3);

            items.forEach(([lokasi, count], colIndex) => {
                const labelCol = colIndex * 2 + 1;
                const valueCol = labelCol + 1;
                const labelCell = worksheet.getCell(row, labelCol);
                const valueCell = worksheet.getCell(row, valueCol);

                labelCell.value = lokasi;
                Object.assign(labelCell, summaryLabelStyle);

                valueCell.value = count.toString();
                Object.assign(valueCell, summaryValueStyle);
            });

            currentRow++;
        }
    }

    // Chart section (jika ada)
    if (calculatedSummary.statusChartImage || calculatedSummary.lokasiChartImage) {
        currentRow++;
        worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
        const chartHeader = worksheet.getCell(`A${currentRow}`);
        chartHeader.value = 'GRAFIK DATA';
        Object.assign(chartHeader, summaryHeaderStyle);
        worksheet.getRow(currentRow).height = 25;
        currentRow++;

    // Set column widths untuk chart area
        worksheet.getColumn(8).width = 12;
        worksheet.getColumn(9).width = 12;
        worksheet.getColumn(10).width = 12;
        worksheet.getColumn(11).width = 12;

        // Insert Status Chart
        if (calculatedSummary.statusChartImage) {
        const imageId = workbook.addImage({
                base64: calculatedSummary.statusChartImage.replace('data:image/png;base64,', ''),
            extension: 'png',
        });
            worksheet.addImage(imageId, `A${currentRow}:D${currentRow + 5}`);
    }

        // Insert Lokasi Chart
        if (calculatedSummary.lokasiChartImage) {
        const imageId = workbook.addImage({
                base64: calculatedSummary.lokasiChartImage.replace('data:image/png;base64,', ''),
            extension: 'png',
        });
            worksheet.addImage(imageId, `E${currentRow}:H${currentRow + 5}`);
        }

        currentRow += 6;
    }

    currentRow++; // Spacing sebelum tabel

    // ===== DATA TABLE SECTION =====
    // Table Header
    const tableHeaders = [
        'RFID ID', 'WO', 'STYLE', 'BUYER', 'ITEM', 'COLOR', 'SIZE', 'STATUS', 'LOKASI', 'LINE', 'TIMESTAMP'
    ];

    // Set column widths untuk tabel
    // A: RFID ID, B: WO, C: STYLE, D: BUYER, E: ITEM, F: COLOR, G: SIZE, H: STATUS, I: LOKASI, J: LINE, K: TIMESTAMP
    // Berdasarkan masalah: 220 menjadi 1539 (rasio ~7), 70 menjadi 489 (rasio ~7)
    // Untuk mendapatkan width ~200: 200 / 7.7 ≈ 26, tapi karena terlalu besar, coba 13
    // Untuk mendapatkan width ~70: 70 / 7.0 ≈ 10, tapi karena terlalu besar, coba 4.5
    worksheet.getColumn(1).width = 18; // A: RFID ID
    worksheet.getColumn(2).width = 12; // B: WO
    worksheet.getColumn(3).width = 12; // C: STYLE
    worksheet.getColumn(4).width = 27; // D: BUYER (untuk ~200 pixel, berdasarkan rasio 220→1539, jadi 200/7.7≈26, disesuaikan ke 13)
    worksheet.getColumn(5).width = 29; // E: ITEM (untuk ~200 pixel)
    worksheet.getColumn(6).width = 12; // F: COLOR
    worksheet.getColumn(7).width = 12; // G: SIZE (untuk ~70 pixel, berdasarkan rasio 70→489, jadi 70/7.0≈10, disesuaikan ke 4.5)
    worksheet.getColumn(8).width = 12; // H: STATUS (untuk ~70 pixel)
    worksheet.getColumn(9).width = 12; // I: LOKASI (untuk ~70 pixel)
    worksheet.getColumn(10).width = 12; // J: LINE (untuk ~70 pixel)
    worksheet.getColumn(11).width = 30; // K: TIMESTAMP (untuk ~200 pixel)

    // Header row
    tableHeaders.forEach((header, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = header;
        Object.assign(cell, headerStyle);
    });
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    // Data rows
    data.forEach((item, index) => {
        const rowStyle = index % 2 === 0 ? dataRowStyle : dataRowStyleAlt;
        
        const rowData = [
            item.rfid || '-',
            item.nomor_wo || '-',
            item.style || '-',
            item.buyer || '-',
            item.item || '-',
            item.color || '-',
            item.size || '-',
            (item.status || 'Unknown').toUpperCase(),
            item.lokasi || '-',
            item.line || '-',
            item.timestamp || '-'
        ];

        rowData.forEach((value, colIndex) => {
            const cell = worksheet.getCell(currentRow, colIndex + 1);
            cell.value = value;
            Object.assign(cell, rowStyle);

            // RFID ID column - hijau muda background, biru tua teks
            if (colIndex === 0) { // RFID ID column
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; // Light green background
                cell.font = { size: 11, bold: true, color: { argb: 'FF1E40AF' } }; // Dark blue text
            }

            // Status column - color coding
            if (colIndex === 7) { // STATUS column
                const status = (value as string).toUpperCase();
                if (status === 'GOOD') {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; // Green
                    cell.font = { size: 11, bold: true, color: { argb: 'FF065F46' } };
                } else if (status === 'REWORK') {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Yellow
                    cell.font = { size: 11, bold: true, color: { argb: 'FF92400E' } };
                } else if (status === 'REJECT') {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Red
                    cell.font = { size: 11, bold: true, color: { argb: 'FF991B1B' } };
                } else if (status === 'OUTPUT') {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // Blue
                    cell.font = { size: 11, bold: true, color: { argb: 'FF1E40AF' } };
                }
            }
        });

        worksheet.getRow(currentRow).height = 22.5; // Height dalam points (30 menjadi 40, rasio 1.33, jadi 30/1.33 ≈ 22.5)
        currentRow++;
    });

    // Nama file: {jenis_dashboard}{line_x}{date_from}to{date_to}.extension
    const filename = buildExportFilename(
        'List_RFID_',
        `Line${lineId}`,
        format === 'excel' ? 'xlsx' : 'csv',
        filterDateFrom,
        filterDateTo
    );

    // Export
    if (format === 'excel') {
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    } else {
        // CSV export
        const csvData: string[][] = [];

        // Add summary
        csvData.push(['LIST RFID DATA REPORT']);
        csvData.push([]);
        csvData.push(['SUMMARY DATA']);
        summaryLabels.forEach(info => {
            csvData.push([info.label, info.value]);
        });
        csvData.push([]);
        csvData.push(['Distribusi Lokasi:']);
        lokasiEntries.forEach(([lokasi, count]) => {
            csvData.push([lokasi, count.toString()]);
        });
        csvData.push([]);

        // Add headers
        csvData.push(tableHeaders);

        // Add data
        data.forEach(item => {
            csvData.push([
                item.rfid || '-',
                item.nomor_wo || '-',
                item.style || '-',
                item.buyer || '-',
                item.item || '-',
                item.color || '-',
                item.size || '-',
                (item.status || 'Unknown').toUpperCase(),
                item.lokasi || '-',
                item.line || '-',
                item.timestamp || '-'
            ]);
        });

        const csv = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }
}