package com.ths.onlinefood.dto;

public class ToaDoDTO {

    private double viDo;
    private double kinhDo;

    public ToaDoDTO() {
    }

    public ToaDoDTO(double viDo, double kinhDo) {
        this.viDo = viDo;
        this.kinhDo = kinhDo;
    }

    public double getViDo() {
        return viDo;
    }

    public void setViDo(double viDo) {
        this.viDo = viDo;
    }

    public double getKinhDo() {
        return kinhDo;
    }

    public void setKinhDo(double kinhDo) {
        this.kinhDo = kinhDo;
    }
}
