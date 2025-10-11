/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.repository;

import com.ths.onlinefood.delivery.model.GraphEdge;
import com.ths.onlinefood.delivery.model.GraphNode;
import com.ths.onlinefood.delivery.model.RoadType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GraphEdgeRepository extends JpaRepository<GraphEdge, Long> {
    
    // Tìm các cạnh xuất phát từ một nút
    List<GraphEdge> findByStartNodeAndIsActiveTrue(GraphNode startNode);
    
    // Tìm các cạnh đến một nút
    List<GraphEdge> findByEndNodeAndIsActiveTrue(GraphNode endNode);
    
    // Tìm cạnh giữa 2 nút
    @Query("SELECT e FROM GraphEdge e WHERE e.startNode = :start " +
           "AND e.endNode = :end AND e.isActive = true")
    Optional<GraphEdge> findEdgeBetweenNodes(@Param("start") GraphNode start, 
                                              @Param("end") GraphNode end);
    
    // Tìm tất cả cạnh 2 chiều
    List<GraphEdge> findByIsTwoWayTrueAndIsActiveTrue();
    
    // Tìm theo loại đường
    List<GraphEdge> findByRoadTypeAndIsActiveTrue(RoadType roadType);
    
    // Lấy tất cả cạnh hoạt động
    List<GraphEdge> findByIsActiveTrue();
    
    // Tính tổng khoảng cách của đồ thị
    @Query("SELECT SUM(e.distance) FROM GraphEdge e WHERE e.isActive = true")
    Double calculateTotalDistance();
    
    // Đếm số cạnh của một nút
    @Query("SELECT COUNT(e) FROM GraphEdge e WHERE " +
           "(e.startNode = :node OR e.endNode = :node) AND e.isActive = true")
    Long countEdgesByNode(@Param("node") GraphNode node);
}