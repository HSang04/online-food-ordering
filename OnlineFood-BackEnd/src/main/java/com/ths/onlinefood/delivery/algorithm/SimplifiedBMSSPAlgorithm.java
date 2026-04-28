package com.ths.onlinefood.delivery.algorithm;

import org.springframework.stereotype.Component;

import java.util.*;


@Component
public class SimplifiedBMSSPAlgorithm {

    public static class Result {
        public final Map<Integer, Double>  dist;
        public final Map<Integer, Integer> parent;
        public final Set<Integer>          reached;
        public final long                  relaxCount;  

        public Result(Map<Integer, Double> dist,
                      Map<Integer, Integer> parent,
                      Set<Integer> reached,
                      long relaxCount) {
            this.dist       = dist;
            this.parent     = parent;
            this.reached    = reached;
            this.relaxCount = relaxCount;
        }
    }

   
    public static class Graph {
        public final int n;
        public final List<int[]>[] adj; 

        @SuppressWarnings("unchecked")
        public Graph(int n) {
            this.n   = n;
            this.adj = new List[n];
            for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        }

        public void addEdge(int u, int v, double w) {
            adj[u].add(new int[]{v, (int)(w * 1000)});
        }
    }

    private final long[] relaxCounter = {0};

   
    public Result run(Graph graph, Set<Integer> sources, double boundary) {
        relaxCounter[0] = 0;

        Map<Integer, Double>  dist   = new HashMap<>();
        Map<Integer, Integer> parent = new HashMap<>();
        Set<Integer>          reached = new HashSet<>();

        for (int s : sources) {
            dist.put(s, 0.0);
            parent.put(s, -1);
        }

        bmssp(graph, sources, boundary, dist, parent, reached,
              (int) Math.ceil(Math.log(graph.n + 1) / Math.log(2)));

        return new Result(dist, parent, reached, relaxCounter[0]);
    }

 
    private void bmssp(Graph graph,
                       Set<Integer> frontier,
                       double boundary,
                       Map<Integer, Double>  dist,
                       Map<Integer, Integer> parent,
                       Set<Integer>          reached,
                       int level) {

        if (level <= 0 || frontier.isEmpty()) {
       
            dijkstraBase(graph, frontier, boundary, dist, parent, reached);
            return;
        }

        double halfBound = boundary / 2.0;

        // de quy b/2
        bmssp(graph, frontier, halfBound, dist, parent, reached, level - 1);

        
        Set<Integer> newFrontier = new HashSet<>();
        for (int v : reached) {
            double dv = dist.getOrDefault(v, Double.MAX_VALUE);
            if (dv <= halfBound) {
                for (int[] edge : graph.adj[v]) {
                    int    w      = edge[0];
                    double weight = edge[1] / 1000.0;
                    double nd     = dv + weight;
                    if (nd <= boundary && nd < dist.getOrDefault(w, Double.MAX_VALUE)) {
                        newFrontier.add(v);
                        break;
                    }
                }
            }
        }
        if (!newFrontier.isEmpty()) {
            bmssp(graph, newFrontier, boundary, dist, parent, reached, level - 1);
        }
    }


    private void dijkstraBase(Graph graph,
                               Set<Integer> frontier,
                               double boundary,
                               Map<Integer, Double>  dist,
                               Map<Integer, Integer> parent,
                               Set<Integer>          reached) {

        PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(a -> a[0]));

        for (int s : frontier) {
            double d = dist.getOrDefault(s, Double.MAX_VALUE);
            if (d <= boundary) {
                pq.offer(new long[]{(long)(d * 1000), s});
            }
        }
        while (!pq.isEmpty()) {
            long[] cur   = pq.poll();
            double distU = cur[0] / 1000.0;
            int    u     = (int) cur[1];

            if (distU > dist.getOrDefault(u, Double.MAX_VALUE)) continue;
            if (distU > boundary) break;

            reached.add(u);

            for (int[] edge : graph.adj[u]) {
                int    v      = edge[0];
                double weight = edge[1] / 1000.0;
                double nd     = distU + weight;
                relaxCounter[0]++;

                if (nd <= boundary && nd < dist.getOrDefault(v, Double.MAX_VALUE)) {
                    dist.put(v, nd);
                    parent.put(v, u);
                    pq.offer(new long[]{(long)(nd * 1000), v});
                }
            }
        }
    }
}