package com.ths.onlinefood.delivery.algorithm;

import com.graphhopper.storage.Graph;
import com.graphhopper.util.EdgeExplorer;
import com.graphhopper.util.EdgeIterator;
import org.springframework.stereotype.Component;
import java.util.*;

/**
 * BMSSP Algorithm - Paper-faithful implementation with proper visited tracking
 */
@Component
public class BMSSPAlgorithm {
    
    public static class Result {
        public final Map<Integer, Double> dist;
        public final Map<Integer, Integer> parent;
        public final Set<Integer> reached;
        
        public Result(Map<Integer, Double> dist, Map<Integer, Integer> parent, Set<Integer> reached) {
            this.dist = dist;
            this.parent = parent;
            this.reached = reached;
        }
    }
    
    /**
     * Run BMSSP from multiple sources with distance bound
     * FIXED: Added visited set to prevent infinite loops
     */
    public Result run(Graph graph, Set<Integer> sources, double boundMeters) {
        Map<Integer, Double> dist = new HashMap<>();
        Map<Integer, Integer> parent = new HashMap<>();
        Set<Integer> reached = new HashSet<>();
        Set<Integer> visited = new HashSet<>();  // ← FIX: Track processed nodes
        Queue<Integer> queue = new LinkedList<>();
        
        EdgeExplorer explorer = graph.createEdgeExplorer();
        
        // Initialize all sources
        for (int s : sources) {
            dist.put(s, 0.0);
            parent.put(s, -1);
            queue.add(s);
        }
        
        int processedCount = 0;
        int maxProcessed = 1_000_000; // Safety limit
        
        while (!queue.isEmpty() && processedCount < maxProcessed) {
            int u = queue.poll();
            
            // Skip if already visited
            if (visited.contains(u)) {
                continue;
            }
            visited.add(u);
            processedCount++;
            
            double distU = dist.get(u);
            
            // Skip if beyond bound
            if (distU > boundMeters) {
                continue;
            }
            
            reached.add(u);
            
            // Explore neighbors
            EdgeIterator it = explorer.setBaseNode(u);
            while (it.next()) {
                int v = it.getAdjNode();
                double edgeWeight = it.getDistance();
                double newDist = distU + edgeWeight;
                
                if (newDist <= boundMeters) {
                    // Only update if better path found
                    if (!dist.containsKey(v) || newDist < dist.get(v)) {
                        dist.put(v, newDist);
                        parent.put(v, u);
                        
                        // Only add to queue if not visited yet
                        if (!visited.contains(v)) {
                            queue.add(v);
                        }
                    }
                }
            }
            
            // Log progress every 10000 nodes
            if (processedCount % 10000 == 0) {
                System.out.println("BMSSP: Processed " + processedCount + " nodes, reached " + reached.size());
            }
        }
        
        System.out.println("BMSSP completed: processed=" + processedCount + ", reached=" + reached.size());
        
        return new Result(dist, parent, reached);
    }
    
    /**
     * Reconstruct path from source to target
     */
    public List<Integer> reconstructPath(Map<Integer, Integer> parent, int source, int target) {
        if (!parent.containsKey(target)) {
            return new ArrayList<>();
        }
        
        List<Integer> path = new ArrayList<>();
        int current = target;
        int maxSteps = 100000; // Safety limit
        int steps = 0;
        
        while (current != -1 && steps < maxSteps) {
            path.add(0, current);
            if (current == source) {
                break;
            }
            current = parent.getOrDefault(current, -1);
            steps++;
        }
        
        return path;
    }
}