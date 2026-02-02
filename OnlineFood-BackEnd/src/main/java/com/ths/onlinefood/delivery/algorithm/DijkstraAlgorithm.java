package com.ths.onlinefood.delivery.algorithm;

import com.graphhopper.storage.Graph;
import com.graphhopper.util.EdgeIterator;

import java.util.*;
import org.springframework.stereotype.Component;

@Component 
public class DijkstraAlgorithm {

    public static class Result {
        public final Map<Integer, Double> dist;
        public final Map<Integer, Integer> parent;
        public final int relaxedNodes;
        public final boolean reached;

        public Result(Map<Integer, Double> dist,
                      Map<Integer, Integer> parent,
                      int relaxedNodes,
                      boolean reached) {
            this.dist = dist;
            this.parent = parent;
            this.relaxedNodes = relaxedNodes;
            this.reached = reached;
        }
    }

    public Result run(Graph graph, int source, int target) {

        Map<Integer, Double> dist = new HashMap<>();
        Map<Integer, Integer> parent = new HashMap<>();
        Set<Integer> visited = new HashSet<>();

        PriorityQueue<int[]> pq = new PriorityQueue<>(
                Comparator.comparingDouble(a -> a[1])
        );

        dist.put(source, 0.0);
        parent.put(source, -1);
        pq.offer(new int[]{source, 0});

        int relaxedCount = 0;

        while (!pq.isEmpty()) {
            int[] cur = pq.poll();
            int u = cur[0];

            if (visited.contains(u)) continue;
            visited.add(u);
            relaxedCount++;

            if (u == target) {
                return new Result(dist, parent, relaxedCount, true);
            }

            EdgeIterator it = graph.createEdgeExplorer().setBaseNode(u);
            while (it.next()) {
                int v = it.getAdjNode();
                double w = it.getDistance();

                double newDist = dist.get(u) + w;
                if (newDist < dist.getOrDefault(v, Double.MAX_VALUE)) {
                    dist.put(v, newDist);
                    parent.put(v, u);
                    pq.offer(new int[]{v, (int) newDist});
                }
            }
        }

        return new Result(dist, parent, relaxedCount, false);
    }

    public List<Integer> reconstructPath(Map<Integer, Integer> parent,
                                         int source,
                                         int target) {

        List<Integer> path = new ArrayList<>();
        int cur = target;

        while (cur != -1) {
            path.add(0, cur);
            if (cur == source) break;
            cur = parent.get(cur);
        }

        return path;
    }
}
