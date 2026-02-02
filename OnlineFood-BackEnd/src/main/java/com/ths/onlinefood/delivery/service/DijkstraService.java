package com.ths.onlinefood.delivery.service;

import com.graphhopper.GraphHopper;
import com.graphhopper.storage.Graph;
import com.graphhopper.storage.NodeAccess;
import com.graphhopper.storage.index.LocationIndex;
import com.graphhopper.storage.index.Snap;
import com.ths.onlinefood.delivery.algorithm.DijkstraAlgorithm;
import com.ths.onlinefood.delivery.model.DeliveryRoute;
import com.ths.onlinefood.delivery.model.RouteStep;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@RequiredArgsConstructor
@Service
public class DijkstraService {

    private final GraphHopper graphHopper;
    private final DijkstraAlgorithm dijkstra;

    public DeliveryRoute findShortestPath(
            double latStart, double lonStart,
            double latEnd, double lonEnd
    ) {

        Graph graph = graphHopper.getBaseGraph();
        LocationIndex index = graphHopper.getLocationIndex();

        Snap s = index.findClosest(latStart, lonStart, e -> true);
        Snap t = index.findClosest(latEnd, lonEnd, e -> true);

        if (!s.isValid() || !t.isValid()) {
            return createFallbackRoute(latStart, lonStart, latEnd, lonEnd);
        }

        int source = s.getClosestNode();
        int target = t.getClosestNode();

        DijkstraAlgorithm.Result r =
                dijkstra.run(graph, source, target);

        if (!r.reached) {
            return createFallbackRoute(latStart, lonStart, latEnd, lonEnd);
        }

        List<Integer> path =
                dijkstra.reconstructPath(r.parent, source, target);

        return buildRouteFromNodes(
                path, r.dist, target, graph.getNodeAccess()
        );
    }

    // ================== BUILD ROUTE ==================

    private DeliveryRoute buildRouteFromNodes(
            List<Integer> nodePath,
            Map<Integer, Double> distances,
            int targetNode,
            NodeAccess na
    ) {
        DeliveryRoute route = new DeliveryRoute();

        List<double[]> coordinates = new ArrayList<>();
        List<RouteStep> steps = new ArrayList<>();

        for (int i = 0; i < nodePath.size(); i++) {
            int node = nodePath.get(i);
            double lat = na.getLat(node);
            double lon = na.getLon(node);
            coordinates.add(new double[]{lat, lon});

            if (i < nodePath.size() - 1) {
                int next = nodePath.get(i + 1);
                double nLat = na.getLat(next);
                double nLon = na.getLon(next);

                double d = calculateDistance(lat, lon, nLat, nLon);

                RouteStep step = new RouteStep();
                step.setInstruction("Đi tiếp");
                step.setDistance(d);
                step.setDuration(d / 25.0 * 60.0);
                step.setStartCoordinate(new double[]{lat, lon});
                step.setEndCoordinate(new double[]{nLat, nLon});
                steps.add(step);
            }
        }

        double totalKm = distances.get(targetNode) / 1000.0;

        route.setCoordinates(coordinates);
        route.setSteps(steps);
        route.setTotalDistance(totalKm);
        route.setEstimatedDuration(totalKm / 25.0 * 60.0);
        route.setRouteSummary(
                String.format("Dijkstra: %.2f km, %d nodes",
                        totalKm, nodePath.size())
        );

        return route;
    }

    // ================== FALLBACK ==================

    private DeliveryRoute createFallbackRoute(
            double latStart, double lonStart,
            double latEnd, double lonEnd
    ) {
        DeliveryRoute route = new DeliveryRoute();

        List<double[]> coordinates = new ArrayList<>();
        coordinates.add(new double[]{latStart, lonStart});
        coordinates.add(new double[]{latEnd, lonEnd});

        double d = calculateDistance(latStart, lonStart, latEnd, lonEnd);

        route.setCoordinates(coordinates);
        route.setSteps(new ArrayList<>());
        route.setTotalDistance(d);
        route.setEstimatedDuration(d / 25.0 * 60.0);
        route.setRouteSummary("Fallback (chim bay)");

        return route;
    }

    // ================== DISTANCE ==================

    private double calculateDistance(
            double lat1, double lon1,
            double lat2, double lon2
    ) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
