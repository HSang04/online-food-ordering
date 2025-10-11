/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.repository;

import com.ths.onlinefood.delivery.model.GraphNode;
import com.ths.onlinefood.delivery.model.NodeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GraphNodeRepository extends JpaRepository<GraphNode, Long> {
    
    // Tìm các nút gần vị trí cho trước (sử dụng Haversine formula)
    @Query("SELECT n FROM GraphNode n WHERE n.isActive = true AND " +
           "(6371 * acos(cos(radians(:lat)) * cos(radians(n.latitude)) * " +
           "cos(radians(n.longitude) - radians(:lon)) + " +
           "sin(radians(:lat)) * sin(radians(n.latitude)))) < :radius " +
           "ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(n.latitude)) * " +
           "cos(radians(n.longitude) - radians(:lon)) + " +
           "sin(radians(:lat)) * sin(radians(n.latitude))))")
    List<GraphNode> findNearbyNodes(@Param("lat") Double lat, 
                                     @Param("lon") Double lon, 
                                     @Param("radius") Double radius);
    
    // Tìm nút gần nhất
    @Query("SELECT n FROM GraphNode n WHERE n.isActive = true " +
           "ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(n.latitude)) * " +
           "cos(radians(n.longitude) - radians(:lon)) + " +
           "sin(radians(:lat)) * sin(radians(n.latitude)))) LIMIT 1")
    Optional<GraphNode> findNearestNode(@Param("lat") Double lat, 
                                         @Param("lon") Double lon);
    
    // Tìm theo loại nút
    List<GraphNode> findByNodeTypeAndIsActiveTrue(NodeType nodeType);
    
    // Tìm nút cửa hàng
    @Query("SELECT n FROM GraphNode n WHERE n.nodeType = 'STORE' AND n.isActive = true")
    Optional<GraphNode> findStoreNode();
    
    // Tìm theo tên
    List<GraphNode> findByNodeNameContainingIgnoreCaseAndIsActiveTrue(String nodeName);
    
    // Lấy tất cả nút hoạt động
    List<GraphNode> findByIsActiveTrue();
}