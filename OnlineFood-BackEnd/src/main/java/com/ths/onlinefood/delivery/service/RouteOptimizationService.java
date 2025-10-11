/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.service;


import com.ths.onlinefood.delivery.model.DeliveryRoute;
import com.ths.onlinefood.delivery.model.GraphNode;
import com.ths.onlinefood.delivery.repository.GraphNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service tối ưu hóa tuyến đường cho nhiều điểm giao hàng
 * Sử dụng thuật toán Nearest Neighbor (TSP approximation)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RouteOptimizationService {
    
    private final DijkstraService dijkstraService;
    private final GraphNodeRepository nodeRepository;
    
    /**
     * Tối ưu tuyến đường cho nhiều điểm giao hàng
     * Sử dụng thuật toán Nearest Neighbor
     */
    public OptimizedRoute optimizeMultipleDeliveries(List<DeliveryPoint> deliveryPoints) {
        if (deliveryPoints == null || deliveryPoints.isEmpty()) {
            throw new IllegalArgumentException("Danh sách điểm giao hàng trống");
        }
        
        log.info("Bắt đầu tối ưu tuyến đường cho {} điểm giao hàng", deliveryPoints.size());
        
        // Lấy vị trí cửa hàng
        Optional<GraphNode> storeNodeOpt = nodeRepository.findStoreNode();
        if (storeNodeOpt.isEmpty()) {
            throw new IllegalStateException("Không tìm thấy vị trí cửa hàng");
        }
        
        GraphNode storeNode = storeNodeOpt.get();
        DeliveryPoint storePoint = new DeliveryPoint(
            storeNode.getLatitude(), 
            storeNode.getLongitude(), 
            "Cửa hàng",
            null
        );
        
        // Thuật toán Nearest Neighbor
        List<DeliveryPoint> unvisited = new ArrayList<>(deliveryPoints);
        List<DeliveryPoint> route = new ArrayList<>();
        route.add(storePoint);
        
        DeliveryPoint currentPoint = storePoint;
        Double totalDistance = 0.0;
        Double totalDuration = 0.0;
        List<DeliveryRoute> segments = new ArrayList<>();
        
        while (!unvisited.isEmpty()) {
            DeliveryPoint nearest = null;
            Double minDistance = Double.MAX_VALUE;
            DeliveryRoute shortestSegment = null;
            
            // Tìm điểm gần nhất chưa đi
            for (DeliveryPoint point : unvisited) {
                DeliveryRoute segment = dijkstraService.findShortestPath(
                    currentPoint.latitude, currentPoint.longitude,
                    point.latitude, point.longitude
                );
                
                if (segment.getTotalDistance() < minDistance) {
                    minDistance = segment.getTotalDistance();
                    nearest = point;
                    shortestSegment = segment;
                }
            }
            
            if (nearest != null) {
                route.add(nearest);
                unvisited.remove(nearest);
                segments.add(shortestSegment);
                totalDistance += shortestSegment.getTotalDistance();
                totalDuration += shortestSegment.getEstimatedDuration();
                currentPoint = nearest;
            }
        }
        
        // Quay về cửa hàng (nếu cần)
        DeliveryRoute returnSegment = dijkstraService.findShortestPath(
            currentPoint.latitude, currentPoint.longitude,
            storePoint.latitude, storePoint.longitude
        );
        segments.add(returnSegment);
        totalDistance += returnSegment.getTotalDistance();
        totalDuration += returnSegment.getEstimatedDuration();
        
        OptimizedRoute optimizedRoute = new OptimizedRoute();
        optimizedRoute.setDeliverySequence(route);
        optimizedRoute.setRouteSegments(segments);
        optimizedRoute.setTotalDistance(totalDistance);
        optimizedRoute.setTotalDuration(totalDuration);
        optimizedRoute.setSummary(generateOptimizationSummary(route, totalDistance, totalDuration));
        
        log.info("Hoàn tất tối ưu: {} điểm, {:.2f} km, ~{} phút", 
                 route.size(), totalDistance, Math.ceil(totalDuration));
        
        return optimizedRoute;
    }
    
    /**
     * Tính toán thời gian giao hàng dự kiến cho từng điểm
     */
    public List<EstimatedArrival> calculateEstimatedArrivals(OptimizedRoute optimizedRoute) {
        List<EstimatedArrival> arrivals = new ArrayList<>();
        Double cumulativeDuration = 0.0;
        
        for (int i = 1; i < optimizedRoute.getDeliverySequence().size(); i++) {
            DeliveryRoute segment = optimizedRoute.getRouteSegments().get(i - 1);
            cumulativeDuration += segment.getEstimatedDuration();
            
            // Thêm thời gian giao hàng (5 phút mỗi điểm)
            cumulativeDuration += 5.0;
            
            DeliveryPoint point = optimizedRoute.getDeliverySequence().get(i);
            
            EstimatedArrival arrival = new EstimatedArrival();
            arrival.setDeliveryPoint(point);
            arrival.setSequenceNumber(i);
            arrival.setEstimatedArrivalMinutes(cumulativeDuration);
            arrival.setEstimatedArrivalTime(
                java.time.LocalDateTime.now().plusMinutes(Math.round(cumulativeDuration))
            );
            
            arrivals.add(arrival);
        }
        
        return arrivals;
    }
    
    private String generateOptimizationSummary(List<DeliveryPoint> route, 
                                               Double totalDistance, 
                                               Double totalDuration) {
        StringBuilder summary = new StringBuilder();
        summary.append(String.format("Tuyến đường tối ưu cho %d điểm giao hàng\n", route.size() - 1));
        summary.append(String.format("Tổng quãng đường: %.2f km\n", totalDistance));
        summary.append(String.format("Thời gian dự kiến: ~%d phút\n", Math.ceil(totalDuration)));
        summary.append("\nThứ tự giao hàng:\n");
        
        for (int i = 0; i < route.size(); i++) {
            DeliveryPoint point = route.get(i);
            summary.append(String.format("%d. %s\n", i, point.address));
        }
        
        return summary.toString();
    }
    
    // Inner classes
    public static class DeliveryPoint {
        private Double latitude;
        private Double longitude;
        private String address;
        private Long donHangId;
        
        public DeliveryPoint(Double latitude, Double longitude, String address, Long donHangId) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.address = address;
            this.donHangId = donHangId;
        }
        
        // Getters and setters
        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }
        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public Long getDonHangId() { return donHangId; }
        public void setDonHangId(Long donHangId) { this.donHangId = donHangId; }
    }
    
    public static class OptimizedRoute {
        private List<DeliveryPoint> deliverySequence;
        private List<DeliveryRoute> routeSegments;
        private Double totalDistance;
        private Double totalDuration;
        private String summary;
        
        // Getters and setters
        public List<DeliveryPoint> getDeliverySequence() { return deliverySequence; }
        public void setDeliverySequence(List<DeliveryPoint> deliverySequence) { 
            this.deliverySequence = deliverySequence; 
        }
        public List<DeliveryRoute> getRouteSegments() { return routeSegments; }
        public void setRouteSegments(List<DeliveryRoute> routeSegments) { 
            this.routeSegments = routeSegments; 
        }
        public Double getTotalDistance() { return totalDistance; }
        public void setTotalDistance(Double totalDistance) { this.totalDistance = totalDistance; }
        public Double getTotalDuration() { return totalDuration; }
        public void setTotalDuration(Double totalDuration) { this.totalDuration = totalDuration; }
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
    }
    
    public static class EstimatedArrival {
        private DeliveryPoint deliveryPoint;
        private Integer sequenceNumber;
        private Double estimatedArrivalMinutes;
        private java.time.LocalDateTime estimatedArrivalTime;
        
        // Getters and setters
        public DeliveryPoint getDeliveryPoint() { return deliveryPoint; }
        public void setDeliveryPoint(DeliveryPoint deliveryPoint) { 
            this.deliveryPoint = deliveryPoint; 
        }
        public Integer getSequenceNumber() { return sequenceNumber; }
        public void setSequenceNumber(Integer sequenceNumber) { 
            this.sequenceNumber = sequenceNumber; 
        }
        public Double getEstimatedArrivalMinutes() { return estimatedArrivalMinutes; }
        public void setEstimatedArrivalMinutes(Double estimatedArrivalMinutes) { 
            this.estimatedArrivalMinutes = estimatedArrivalMinutes; 
        }
        public java.time.LocalDateTime getEstimatedArrivalTime() { return estimatedArrivalTime; }
        public void setEstimatedArrivalTime(java.time.LocalDateTime estimatedArrivalTime) { 
            this.estimatedArrivalTime = estimatedArrivalTime; 
        }
    }
}