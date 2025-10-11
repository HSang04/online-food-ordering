/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "graph_edge", indexes = {
    @Index(name = "idx_start_node", columnList = "start_node_id"),
    @Index(name = "idx_end_node", columnList = "end_node_id")
})
public class GraphEdge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "start_node_id", nullable = false)
    private GraphNode startNode;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "end_node_id", nullable = false)
    private GraphNode endNode;
    
    @Column(nullable = false)
    private Double distance; // km
    
    @Column(nullable = false)
    private Double duration; // minutes (thời gian trung bình)
    
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private RoadType roadType;
    
    private Boolean isTwoWay = true; // Đường 2 chiều
    
    private Boolean isActive = true; // Đường có hoạt động không
    
    private Integer trafficLevel = 1; // Mức độ tắc nghẽn (1-5)
    
    @Column(length = 200)
    private String roadName; // Tên đường
}