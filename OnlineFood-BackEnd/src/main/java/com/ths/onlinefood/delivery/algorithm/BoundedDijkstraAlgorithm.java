package com.ths.onlinefood.delivery.algorithm;

import com.graphhopper.storage.Graph;
import com.graphhopper.util.EdgeExplorer;
import com.graphhopper.util.EdgeIterator;
import org.springframework.stereotype.Component;

import java.util.*;


@Component
public class BoundedDijkstraAlgorithm {

    public static class Result {
        public final double boundaryPrime;
        public final Set<Integer> reached;
        public final Map<Integer, Double> dist;
        public final Map<Integer, Integer> parent;

        public Result(double boundaryPrime,
                      Set<Integer> reached,
                      Map<Integer, Double> dist,
                      Map<Integer, Integer> parent) {
            this.boundaryPrime = boundaryPrime;
            this.reached = reached;
            this.dist = dist;
            this.parent = parent;
        }
    }

    private static class NodeDistance implements Comparable<NodeDistance> {
        int node;
        double distance;

        NodeDistance(int node, double distance) {
            this.node = node;
            this.distance = distance;
        }

        @Override
        public int compareTo(NodeDistance other) {
            return Double.compare(this.distance, other.distance);
        }
    }

    /**
     * Chạy Bounded Multi-Source Dijkstra với recursion level l và distance bound B
     */
    public Result run(Graph graph,
                      Set<Integer> sources,
                      int recursionLevel,
                      double boundary) {
        if (recursionLevel < 0)
            throw new IllegalArgumentException("Recursion level must be >= 0");
        if (boundary < 0)
            throw new IllegalArgumentException("Boundary must be >= 0");

        EdgeExplorer explorer = graph.createEdgeExplorer();
        Map<Integer, Double> dist = new HashMap<>();
        Map<Integer, Integer> parent = new HashMap<>();
        Set<Integer> reached = new HashSet<>();
        PriorityQueue<NodeDistance> pq = new PriorityQueue<>();

        // Khởi tạo multi-source
        for (int s : sources) {
            dist.put(s, 0.0);
            parent.put(s, -1);
            pq.add(new NodeDistance(s, 0.0));
        }

        int maxReach = 1 << recursionLevel; // 2^l

        while (!pq.isEmpty() && reached.size() < maxReach) {
            NodeDistance current = pq.poll();
            int u = current.node;
            double distU = current.distance;

            // Bỏ qua entry cũ
            if (distU > dist.getOrDefault(u, Double.MAX_VALUE))
                continue;

            if (distU > boundary)
                break;

            reached.add(u);

            EdgeIterator it = explorer.setBaseNode(u);
            while (it.next()) {
                int v = it.getAdjNode();
                double newDist = distU + it.getDistance();
                if (newDist <= boundary &&
                        newDist < dist.getOrDefault(v, Double.MAX_VALUE)) {
                    dist.put(v, newDist);
                    parent.put(v, u);
                    pq.add(new NodeDistance(v, newDist));
                }
            }
        }

        return new Result(boundary, reached, dist, parent);
    }
}