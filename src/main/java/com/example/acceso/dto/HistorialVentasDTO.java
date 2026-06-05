package com.example.acceso.dto;

import java.math.BigDecimal;

public class HistorialVentasDTO {
    private Object idVenta;
    private String numDoc;
    private Object fecha;
    private String cliente;
    private String vendedor;
    private String formaPago;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
    private String estado;

    // CONSTRUCTOR TOTALMENTE COMPATIBLE
    public HistorialVentasDTO(Object idVenta, String numDoc, Object fecha, String cliente,
            String vendedor, String formaPago, Integer cantidad,
            BigDecimal precioUnitario, BigDecimal subtotal, String estado) {
        this.idVenta = idVenta;
        this.numDoc = numDoc;
        this.fecha = fecha;
        this.cliente = cliente;
        this.vendedor = vendedor;
        this.formaPago = formaPago;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.subtotal = subtotal;
        this.estado = estado;
    }

    // Getters y Setters
    public Object getIdVenta() {
        return idVenta;
    }

    public void setIdVenta(Object idVenta) {
        this.idVenta = idVenta;
    }

    public String getNumDoc() {
        return numDoc;
    }

    public void setNumDoc(String numDoc) {
        this.numDoc = numDoc;
    }

    public Object getFecha() {
        return fecha;
    }

    public void setFecha(Object fecha) {
        this.fecha = fecha;
    }

    public String getCliente() {
        return cliente;
    }

    public void setCliente(String cliente) {
        this.cliente = cliente;
    }

    public String getVendedor() {
        return vendedor;
    }

    public void setVendedor(String vendedor) {
        this.vendedor = vendedor;
    }

    public String getFormaPago() {
        return formaPago;
    }

    public void setFormaPago(String formaPago) {
        this.formaPago = formaPago;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}