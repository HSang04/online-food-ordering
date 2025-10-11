/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeliveryRoute {
    private List<GraphNode> nodes = new ArrayList<>();
    private List<double[]> coordinates = new ArrayList<>();
    private Double totalDistance; // km
    private Double estimatedDuration; // minutes
    private String routeSummary;
    private List<RouteStep> steps = new ArrayList<>();
}