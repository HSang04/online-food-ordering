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

@Service
@RequiredArgsConstructor
public class BMSSPService {

    private final GraphHopper graphHopper;
    private final BMSSPAlgorithm bmssp;

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

        Snap snapStart = index.findClosest(latStart, lonStart, e -> true);
        Snap snapEnd = index.findClosest(latEnd, lonEnd, e -> true);

        if (!snapStart.isValid() || !snapEnd.isValid()) {
            return createEmptyRoute("❌ Không tìm thấy node gần tọa độ đã cho");
        }

        int sourceNode = snapStart.getClosestNode();
        int targetNode = snapEnd.getClosestNode();

        Set<Integer> sources = new HashSet<>();
        sources.add(sourceNode);

        // Chọn recursion level phù hợp
        int recursionLevel = 16; // 2^16 ≈ 65,536 nodes

        BMSSPAlgorithm.Result result =
                bmssp.run(graph, sources, recursionLevel, boundMeters);

        if (!result.reached.contains(targetNode)) {
            return createEmptyRoute(
                    String.format(
                            "❌ Target không trong bound %.0fm hoặc vượt 2^l giới hạn.",
                            boundMeters)
            );
        }

        List<Integer> nodePath =
                reconstructPath(result.parent, sourceNode, targetNode);

        if (nodePath.isEmpty()) {
            return createEmptyRoute("❌ Không thể reconstruct path");
        }

        return buildRouteFromNodes(
                nodePath,
                result.dist,
                targetNode,
                na
        );
    }

    private List<Integer> reconstructPath(
            Map<Integer, Integer> parent,
            int source,
            int target
    ) {
        List<Integer> path = new ArrayList<>();
        int current = target;

        while (current != -1) {
            path.add(0, current);
            if (current == source) break;
            current = parent.getOrDefault(current, -1);
        }

        if (path.isEmpty() || path.get(0) != source) {
            return new ArrayList<>();
        }

        return path;
    }

    private DeliveryRoute buildRouteFromNodes(
            List<Integer> nodePath,
            Map<Integer, Double> distances,
            int targetNode,
            NodeAccess na
    ) {
        DeliveryRoute route = new DeliveryRoute();

        List<double[]> coordinates = new ArrayList<>();
        for (int node : nodePath) {
            coordinates.add(new double[]{
                    na.getLat(node),
                    na.getLon(node)
            });
        }

        double totalDistanceMeters =
                distances.getOrDefault(targetNode, 0.0);

        double totalDistanceKm = totalDistanceMeters / 1000.0;
        double estimatedDurationMinutes =
                (totalDistanceKm / 30.0) * 60.0;

        route.setCoordinates(coordinates);
        route.setTotalDistance(totalDistanceKm);
        route.setEstimatedDuration(estimatedDurationMinutes);
        route.setRouteSummary(
                String.format(
                        "✅ BMSSP tìm thấy đường đi qua %d điểm, %.2f km",
                        nodePath.size(),
                        totalDistanceKm
                )
        );

        route.setSteps(new ArrayList<>());

        return route;
    }

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