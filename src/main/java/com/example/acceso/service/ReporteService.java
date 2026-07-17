package com.example.acceso.service;

import com.example.acceso.model.CajaSesion;
import com.example.acceso.model.Venta;
import com.lowagie.text.Document;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Element;
import com.lowagie.text.Phrase;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPCell;

import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReporteService {

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public byte[] generarExcelVentas(List<Venta> ventas) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Reporte de Ventas");

            // Row 1: Title "PERNOS VEGA - REPORTE DE VENTAS Y PAGOS"
            Row titleRow = sheet.createRow(1);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("PERNOS VEGA - REPORTE DE VENTAS Y PAGOS");

            // Style for Title
            org.apache.poi.ss.usermodel.Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setColor(IndexedColors.DARK_BLUE.getIndex());
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleCell.setCellStyle(titleStyle);

            // Merge cells from A2 to K2 (0 to 10)
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 1, 0, 10));

            // Row 3: Headers
            // Header Style
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 10);
            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);
            headerCellStyle.setBorderBottom(BorderStyle.MEDIUM);
            headerCellStyle.setBorderTop(BorderStyle.MEDIUM);
            headerCellStyle.setBorderRight(BorderStyle.THIN);
            headerCellStyle.setBorderLeft(BorderStyle.THIN);

            Row headerRow = sheet.createRow(3);
            String[] headers = {"ID", "Fecha", "Tipo", "Serie-Número", "Cliente", "Vendedor", "Método de Pago", "Subtotal", "IGV", "Total", "Estado"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // Cell Styles for Data
            CellStyle borderStyle = workbook.createCellStyle();
            borderStyle.setBorderBottom(BorderStyle.THIN);
            borderStyle.setBorderTop(BorderStyle.THIN);
            borderStyle.setBorderRight(BorderStyle.THIN);
            borderStyle.setBorderLeft(BorderStyle.THIN);

            CellStyle dateCellStyle = workbook.createCellStyle();
            dateCellStyle.cloneStyleFrom(borderStyle);
            dateCellStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle centerCellStyle = workbook.createCellStyle();
            centerCellStyle.cloneStyleFrom(borderStyle);
            centerCellStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle currencyCellStyle = workbook.createCellStyle();
            currencyCellStyle.cloneStyleFrom(borderStyle);
            currencyCellStyle.setDataFormat(workbook.createDataFormat().getFormat("S/ #,##0.00"));
            currencyCellStyle.setAlignment(HorizontalAlignment.RIGHT);

            int rowIdx = 4;
            for (Venta venta : ventas) {
                Row row = sheet.createRow(rowIdx++);

                Cell cell0 = row.createCell(0);
                cell0.setCellValue(venta.getId());
                cell0.setCellStyle(centerCellStyle);

                Cell cell1 = row.createCell(1);
                cell1.setCellValue(venta.getFecha() != null ? venta.getFecha().format(formatter) : "");
                cell1.setCellStyle(dateCellStyle);

                Cell cell2 = row.createCell(2);
                cell2.setCellValue(venta.getTipoComprobante());
                cell2.setCellStyle(borderStyle);

                Cell cell3 = row.createCell(3);
                cell3.setCellValue(venta.getSerie() + "-" + venta.getNumeroComprobante());
                cell3.setCellStyle(centerCellStyle);

                Cell cell4 = row.createCell(4);
                cell4.setCellValue(venta.getCliente() != null ? venta.getCliente().getNombre() : "Cliente General");
                cell4.setCellStyle(borderStyle);

                Cell cell5 = row.createCell(5);
                cell5.setCellValue(venta.getUsuario() != null ? venta.getUsuario().getNombre() : "");
                cell5.setCellStyle(borderStyle);

                Cell cell6 = row.createCell(6);
                cell6.setCellValue(obtenerMetodoPagoTexto(venta));
                cell6.setCellStyle(borderStyle);

                Cell cell7 = row.createCell(7);
                cell7.setCellValue(venta.getSubtotal() != null ? venta.getSubtotal() : 0.0);
                cell7.setCellStyle(currencyCellStyle);

                Cell cell8 = row.createCell(8);
                cell8.setCellValue(venta.getIgv() != null ? venta.getIgv() : 0.0);
                cell8.setCellStyle(currencyCellStyle);

                Cell cell9 = row.createCell(9);
                cell9.setCellValue(venta.getTotal() != null ? venta.getTotal() : 0.0);
                cell9.setCellStyle(currencyCellStyle);

                Cell cell10 = row.createCell(10);
                cell10.setCellValue(venta.getEstado() == 1 ? "ACTIVA" : "ANULADA");
                cell10.setCellStyle(centerCellStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar reporte de ventas en Excel", e);
        }
    }

    public byte[] generarPdfVentas(List<Venta> ventas) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD, new java.awt.Color(30, 58, 138));
            Font subtitleFont = new Font(Font.HELVETICA, 10, Font.ITALIC, java.awt.Color.GRAY);
            Font headerFont = new Font(Font.HELVETICA, 9, Font.BOLD, java.awt.Color.WHITE);
            Font bodyFont = new Font(Font.HELVETICA, 8);

            // Title
            Paragraph title = new Paragraph("PERNOS VEGA - REPORTE DE VENTAS Y PAGOS", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(5);
            document.add(title);

            // Subtitle
            Paragraph subtitle = new Paragraph("Generado el: " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")), subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            // Table
            PdfPTable table = new PdfPTable(11);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{4, 12, 8, 10, 16, 14, 10, 7, 7, 7, 7});

            String[] headers = {"ID", "Fecha", "Tipo", "Serie-Número", "Cliente", "Vendedor", "Método Pago", "Subtotal", "IGV", "Total", "Estado"};
            for (String headerText : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(headerText, headerFont));
                cell.setBackgroundColor(new java.awt.Color(30, 58, 138));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(6);
                table.addCell(cell);
            }

            for (Venta venta : ventas) {
                table.addCell(new PdfPCell(new Phrase(String.valueOf(venta.getId()), bodyFont)));
                table.addCell(new PdfPCell(new Phrase(venta.getFecha() != null ? venta.getFecha().format(formatter) : "", bodyFont)));
                table.addCell(new PdfPCell(new Phrase(venta.getTipoComprobante(), bodyFont)));
                table.addCell(new PdfPCell(new Phrase(venta.getSerie() + "-" + venta.getNumeroComprobante(), bodyFont)));
                table.addCell(new PdfPCell(new Phrase(venta.getCliente() != null ? venta.getCliente().getNombre() : "Cliente General", bodyFont)));
                table.addCell(new PdfPCell(new Phrase(venta.getUsuario() != null ? venta.getUsuario().getNombre() : "", bodyFont)));
                table.addCell(new PdfPCell(new Phrase(obtenerMetodoPagoTexto(venta), bodyFont)));
                table.addCell(new PdfPCell(new Phrase(String.format("S/ %.2f", venta.getSubtotal() != null ? venta.getSubtotal() : 0.0), bodyFont)));
                table.addCell(new PdfPCell(new Phrase(String.format("S/ %.2f", venta.getIgv() != null ? venta.getIgv() : 0.0), bodyFont)));
                table.addCell(new PdfPCell(new Phrase(String.format("S/ %.2f", venta.getTotal() != null ? venta.getTotal() : 0.0), bodyFont)));
                table.addCell(new PdfPCell(new Phrase(venta.getEstado() == 1 ? "ACTIVA" : "ANULADA", bodyFont)));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar reporte de ventas en PDF", e);
        }
    }

    public byte[] generarExcelCajas(List<CajaSesion> sesiones, CajaService cajaService) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Control de Cajas");

            // Row 1: Title "PERNOS VEGA - CONTROL DE CAJA"
            Row titleRow = sheet.createRow(1);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("PERNOS VEGA - CONTROL DE CAJA");

            // Style for Title
            org.apache.poi.ss.usermodel.Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setColor(IndexedColors.DARK_BLUE.getIndex());
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleCell.setCellStyle(titleStyle);

            // Merge cells from A2 to I2 (0 to 8)
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 1, 0, 8));

            // Row 3: Headers
            // Header Style
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 10);
            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);
            headerCellStyle.setBorderBottom(BorderStyle.MEDIUM);
            headerCellStyle.setBorderTop(BorderStyle.MEDIUM);
            headerCellStyle.setBorderRight(BorderStyle.THIN);
            headerCellStyle.setBorderLeft(BorderStyle.THIN);

            Row headerRow = sheet.createRow(3);
            String[] headers = {"ID", "Fecha Apertura", "Fecha Cierre", "Apertura (Empieza)", "Cierre (Queda)", "Total Efectivo", "Total Online", "Estado", "Usuario Apertura"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // Cell Styles for Data
            CellStyle borderStyle = workbook.createCellStyle();
            borderStyle.setBorderBottom(BorderStyle.THIN);
            borderStyle.setBorderTop(BorderStyle.THIN);
            borderStyle.setBorderRight(BorderStyle.THIN);
            borderStyle.setBorderLeft(BorderStyle.THIN);

            CellStyle dateCellStyle = workbook.createCellStyle();
            dateCellStyle.cloneStyleFrom(borderStyle);
            dateCellStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle centerCellStyle = workbook.createCellStyle();
            centerCellStyle.cloneStyleFrom(borderStyle);
            centerCellStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle currencyCellStyle = workbook.createCellStyle();
            currencyCellStyle.cloneStyleFrom(borderStyle);
            currencyCellStyle.setDataFormat(workbook.createDataFormat().getFormat("S/ #,##0.00"));
            currencyCellStyle.setAlignment(HorizontalAlignment.RIGHT);

            int rowIdx = 4;
            for (CajaSesion sesion : sesiones) {
                Row row = sheet.createRow(rowIdx++);

                Cell cell0 = row.createCell(0);
                cell0.setCellValue(sesion.getId());
                cell0.setCellStyle(centerCellStyle);

                Cell cell1 = row.createCell(1);
                cell1.setCellValue(sesion.getFechaApertura() != null ? sesion.getFechaApertura().format(formatter) : "");
                cell1.setCellStyle(dateCellStyle);

                Cell cell2 = row.createCell(2);
                cell2.setCellValue(sesion.getFechaCierre() != null ? sesion.getFechaCierre().format(formatter) : "Abierta");
                cell2.setCellStyle(dateCellStyle);

                Cell cell3 = row.createCell(3);
                cell3.setCellValue(sesion.getMontoApertura() != null ? sesion.getMontoApertura() : 0.0);
                cell3.setCellStyle(currencyCellStyle);

                Cell cell4 = row.createCell(4);
                cell4.setCellValue(sesion.getMontoCierre() != null ? sesion.getMontoCierre() : 0.0);
                cell4.setCellStyle(currencyCellStyle);

                Cell cell5 = row.createCell(5);
                cell5.setCellValue(cajaService.calcularTotalEfectivoAcumulado(sesion));
                cell5.setCellStyle(currencyCellStyle);

                Cell cell6 = row.createCell(6);
                cell6.setCellValue(cajaService.calcularTotalOnlineAcumulado(sesion));
                cell6.setCellStyle(currencyCellStyle);

                Cell cell7 = row.createCell(7);
                cell7.setCellValue(sesion.getEstado());
                cell7.setCellStyle(centerCellStyle);

                Cell cell8 = row.createCell(8);
                cell8.setCellValue(sesion.getUsuarioApertura() != null ? sesion.getUsuarioApertura().getNombre() : "");
                cell8.setCellStyle(borderStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar reporte de cajas en Excel", e);
        }
    }

    public byte[] generarPdfCajas(List<CajaSesion> sesiones, CajaService cajaService) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD, new java.awt.Color(30, 58, 138));
            Font subtitleFont = new Font(Font.HELVETICA, 10, Font.ITALIC, java.awt.Color.GRAY);
            Font headerFont = new Font(Font.HELVETICA, 9, Font.BOLD, java.awt.Color.WHITE);
            Font bodyFont = new Font(Font.HELVETICA, 8);

            // Title
            Paragraph title = new Paragraph("PERNOS VEGA - CONTROL DE CAJA", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(5);
            document.add(title);

            // Subtitle
            Paragraph subtitle = new Paragraph("Generado el: " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")), subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            // Table
            PdfPTable table = new PdfPTable(9);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{5, 15, 15, 12, 12, 12, 12, 10, 15});

            String[] headers = {"ID", "Fecha Apertura", "Fecha Cierre", "Apertura (Inicio)", "Cierre (Queda)", "T. Efectivo", "T. Online", "Estado", "Usuario Apertura"};
            for (String headerText : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(headerText, headerFont));
                cell.setBackgroundColor(new java.awt.Color(30, 58, 138));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(6);
                table.addCell(cell);
            }

            for (CajaSesion sesion : sesiones) {
                table.addCell(new PdfPCell(new Phrase(String.valueOf(sesion.getId()), bodyFont)));
                table.addCell(new PdfPCell(new Phrase(sesion.getFechaApertura() != null ? sesion.getFechaApertura().format(formatter) : "", bodyFont)));
                table.addCell(new PdfPCell(new Phrase(sesion.getFechaCierre() != null ? sesion.getFechaCierre().format(formatter) : "Abierta", bodyFont)));
                table.addCell(new PdfPCell(new Phrase(String.format("S/ %.2f", sesion.getMontoApertura()), bodyFont)));
                table.addCell(new PdfPCell(new Phrase(sesion.getMontoCierre() != null ? String.format("S/ %.2f", sesion.getMontoCierre()) : "-", bodyFont)));
                table.addCell(new PdfPCell(new Phrase(String.format("S/ %.2f", cajaService.calcularTotalEfectivoAcumulado(sesion)), bodyFont)));
                table.addCell(new PdfPCell(new Phrase(String.format("S/ %.2f", cajaService.calcularTotalOnlineAcumulado(sesion)), bodyFont)));
                table.addCell(new PdfPCell(new Phrase(sesion.getEstado(), bodyFont)));
                table.addCell(new PdfPCell(new Phrase(sesion.getUsuarioApertura() != null ? sesion.getUsuarioApertura().getNombre() : "", bodyFont)));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar reporte de cajas en PDF", e);
        }
    }

    private String obtenerMetodoPagoTexto(Venta venta) {
        if (venta.getMetodoPago() == null) return "EFECTIVO";
        if (venta.getMetodoPago().equalsIgnoreCase("MIXTO")) {
            StringBuilder sb = new StringBuilder("MIXTO: ");
            boolean first = true;
            if (venta.getMontoEfectivo() != null && venta.getMontoEfectivo() > 0) {
                sb.append("EF").append(String.format("(S/%.1f)", venta.getMontoEfectivo()));
                first = false;
            }
            if (venta.getMontoYape() != null && venta.getMontoYape() > 0) {
                if (!first) sb.append("+");
                sb.append("YP").append(String.format("(S/%.1f)", venta.getMontoYape()));
                first = false;
            }
            if (venta.getMontoTransferencia() != null && venta.getMontoTransferencia() > 0) {
                if (!first) sb.append("+");
                sb.append("TR").append(String.format("(S/%.1f)", venta.getMontoTransferencia()));
                first = false;
            }
            if (venta.getMontoTarjeta() != null && venta.getMontoTarjeta() > 0) {
                if (!first) sb.append("+");
                sb.append("TJ").append(String.format("(S/%.1f)", venta.getMontoTarjeta()));
            }
            return sb.toString();
        }
        return venta.getMetodoPago();
    }
}
