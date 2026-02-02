package com.ths.onlinefood.delivery.service;

import com.graphhopper.GraphHopper;
import com.graphhopper.storage.Graph;
import com.graphhopper.storage.NodeAccess;
import com.graphhopper.storage.index.LocationIndex;
import com.graphhopper.storage.index.Snap;
import com.ths.onlinefood.delivery.algorithm.BMSSPAlgorithm;
import com.ths.onlinefood.delivery.model.DeliveryRoute;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * BMSSP Service - Paper-faithful single-shot execution
 * No iterative wrapper, no adaptive bound increasing
 */
@Service
@RequiredArgsConstructor
public class BMSSPService {
    
    private final GraphHopper graphHopper;
    private final BMSSPAlgorithm bmssp;
    
    /**
     * Find route using pure BMSSP algorithm
     * - Single execution (no iterations)
     * - Uses given bound as-is
     * - Either finds path within bound or returns empty
     */
    public DeliveryRoute findRoute(
            double latStart,
            double lonStart,
            double latEnd,
            double lonEnd,
            double boundMeters
    ) {
        Graph graph = graphHopper.getBaseGraph();
        NodeAccess na = graph.getNodeAccess();
        LocationIndex index = graphHopper.getLocationIndex();
        
        // Find closest nodes to coordinates
        Snap snapStart = index.findClosest(latStart, lonStart, e -> true);
        Snap snapEnd = index.findClosest(latEnd, lonEnd, e -> true);
        
        if (!snapStart.isValid() || !snapEnd.isValid()) {
            return createEmptyRoute("❌ Không tìm thấy node gần tọa độ đã cho");
        }
        
        int sourceNode = snapStart.getClosestNode();
        int targetNode = snapEnd.getClosestNode();
        
        // Create single-source set (can be extended to multi-source)
        Set<Integer> sources = new HashSet<>();
        sources.add(sourceNode);
        
        // Run BMSSP once with given bound
        BMSSPAlgorithm.Result result = bmssp.run(graph, sources, boundMeters);
        
        // Check if target was reached
        if (!result.reached.contains(targetNode)) {
            return createEmptyRoute(
                String.format("❌ Target không trong tầm bound %.0fm. Đã explore %d nodes. Thử tăng bound lên.",
                    boundMeters, result.reached.size())
            );
        }
        
        // Reconstruct path
        List<Integer> nodePath = bmssp.reconstructPath(result.parent, sourceNode, targetNode);
        
        if (nodePath.isEmpty()) {
            return createEmptyRoute("❌ Không thể reconstruct path");
        }
        
        // Build route response
        return buildRouteFromNodes(nodePath, result.dist, targetNode, na);
    }
    
    /**
     * Build DeliveryRoute from node path
     */
    private DeliveryRoute buildRouteFromNodes(
            List<Integer> nodePath,
            Map<Integer, Double> distances,
            int targetNode,
            NodeAccess na
    ) {
        DeliveryRoute route = new DeliveryRoute();
        
        // Convert nodes to coordinates
        List<double[]> coordinates = new ArrayList<>();
        for (int node : nodePath) {
            double lat = na.getLat(node);
            double lon = na.getLon(node);
            coordinates.add(new double[]{lat, lon});
        }
        
        // Calculate total distance (in km)
        double totalDistanceMeters = distances.getOrDefault(targetNode, 0.0);
        double totalDistanceKm = totalDistanceMeters / 1000.0;
        
        // Estimate duration (assuming 30 km/h average speed)
        double estimatedDurationMinutes = (totalDistanceKm / 30.0) * 60.0;
        
        route.setCoordinates(coordinates);
        route.setTotalDistance(totalDistanceKm);
        route.setEstimatedDuration(estimatedDurationMinutes);
        route.setRouteSummary(
            String.format("✅ BMSSP tìm thấy đường đi qua %d điểm, %.2f km",
                nodePath.size(), totalDistanceKm)
        );
        route.setSteps(new ArrayList<>()); // Can add turn-by-turn later
        
        return route;
    }
    
    /**
     * Create empty route with error message
     */
    private DeliveryRoute createEmptyRoute(String message) {
        DeliveryRoute route = new DeliveryRoute();
        route.setCoordinates(new ArrayList<>());
        route.setSteps(new ArrayList<>());
        route.setRouteSummary(message);
        route.setTotalDistance(0.0);
        route.setEstimatedDuration(0.0);
        return route;
    }
}