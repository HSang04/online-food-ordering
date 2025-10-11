/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RouteStep {
    private String instruction; // "Đi thẳng 500m trên đường Nguyễn Huệ"
    private Double distance; // km
    private Double duration; // minutes
    private String roadName;
    private double[] startCoordinate;
    private double[] endCoordinate;
}