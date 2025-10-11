/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.dto;

import com.ths.onlinefood.delivery.model.RouteStep;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RouteResponse {
    private Boolean success;
    private String message;
    private List<double[]> routePath;
    private Double totalDistance;
    private Double estimatedDuration;
    private String routeSummary;
    private List<RouteStep> steps;
    private Integer nodeCount;
}