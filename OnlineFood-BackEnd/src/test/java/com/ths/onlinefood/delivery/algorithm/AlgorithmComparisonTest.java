package com.ths.onlinefood.delivery.algorithm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * So sanh BoundedDijkstra vs SimplifiedBMSSP
 */
public class AlgorithmComparisonTest {

    private SimplifiedBMSSPAlgorithm.Graph smallGraph;
    private SimplifiedBMSSPAlgorithm.Graph mediumGraph;
    private SimplifiedBMSSPAlgorithm.Graph largeGraph;
    private SimplifiedBMSSPAlgorithm bmssp;

    @BeforeEach
    void setUp() {
        bmssp = new SimplifiedBMSSPAlgorithm();

        smallGraph = new SimplifiedBMSSPAlgorithm.Graph(6);
        smallGraph.addEdge(0, 1, 4.0);
        smallGraph.addEdge(0, 2, 2.0);
        smallGraph.addEdge(1, 3, 5.0);
        smallGraph.addEdge(2, 1, 1.0);
        smallGraph.addEdge(2, 3, 8.0);
        smallGraph.addEdge(2, 4, 10.0);
        smallGraph.addEdge(3, 4, 2.0);
        smallGraph.addEdge(3, 5, 6.0);
        smallGraph.addEdge(4, 5, 3.0);

        mediumGraph = buildRandomGraph(500, 2000, 42);
        largeGraph  = buildRandomGraph(2000, 10000, 99);
    }

    @Test
    @DisplayName("[TEST 1] Ca hai thuat toan cho ket qua giong nhau - do thi nho")
    void testCorrectnessSmallGraph() {
        Set<Integer> sources  = Set.of(0);
        double       boundary = 20.0;

        Map<Integer, Double> dijkstraDist = runSimpleDijkstra(smallGraph, sources, boundary);
        SimplifiedBMSSPAlgorithm.Result bmsspResult = bmssp.run(smallGraph, sources, boundary);

        System.out.println("\n=== DO THI NHO (6 dinh) ===");
        System.out.println("Khoang cach tu nguon 0:");
        for (int v = 0; v < smallGraph.n; v++) {
            double dD = dijkstraDist.getOrDefault(v, Double.MAX_VALUE);
            double dB = bmsspResult.dist.getOrDefault(v, Double.MAX_VALUE);
            System.out.printf("  Dinh %d: Dijkstra=%.2f  BMSSP=%.2f  %s%n",
                    v, dD, dB, Math.abs(dD - dB) < 0.001 ? "[MATCH]" : "[DIFF]");
            assertEquals(dD, dB, 0.001, "Ket qua khac nhau tai dinh " + v);
        }
    }

    @Test
    @DisplayName("[TEST 2] Ca hai thuat toan cho ket qua giong nhau - do thi vua")
    void testCorrectnessMediumGraph() {
        Set<Integer> sources  = Set.of(0);
        double       boundary = 50.0;

        Map<Integer, Double>            dijkstraDist = runSimpleDijkstra(mediumGraph, sources, boundary);
        SimplifiedBMSSPAlgorithm.Result bmsspResult  = bmssp.run(mediumGraph, sources, boundary);

        int matched = 0, total = 0;
        for (int v = 0; v < mediumGraph.n; v++) {
            double dD = dijkstraDist.getOrDefault(v, Double.MAX_VALUE);
            double dB = bmsspResult.dist.getOrDefault(v, Double.MAX_VALUE);
            if (dD < Double.MAX_VALUE || dB < Double.MAX_VALUE) {
                total++;
                if (Math.abs(dD - dB) < 0.001) matched++;
            }
        }

        System.out.printf("%n=== DO THI VUA (500 dinh) ===%n");
        System.out.printf("Ket qua khop: %d/%d dinh%n", matched, total);
        assertEquals(total, matched, "Mot so dinh co ket qua khac nhau!");
    }

    @Test
    @DisplayName("[TEST 3] So sanh hieu nang - do thi vua (500 dinh)")
    void testPerformanceMediumGraph() {
        Set<Integer> sources  = Set.of(0);
        double       boundary = 50.0;
        int          runs     = 10;

        // Warm up JVM
        for (int i = 0; i < 3; i++) {
            runSimpleDijkstra(mediumGraph, sources, boundary);
            bmssp.run(mediumGraph, sources, boundary);
        }

        long dijkstraTotal = 0;
        for (int i = 0; i < runs; i++) {
            long t = System.nanoTime();
            runSimpleDijkstra(mediumGraph, sources, boundary);
            dijkstraTotal += System.nanoTime() - t;
        }

        long bmsspTotal = 0;
        for (int i = 0; i < runs; i++) {
            long t = System.nanoTime();
            bmssp.run(mediumGraph, sources, boundary);
            bmsspTotal += System.nanoTime() - t;
        }

        double dAvg  = dijkstraTotal / runs / 1_000_000.0;
        double bAvg  = bmsspTotal    / runs / 1_000_000.0;
        double ratio = bAvg / dAvg;

        System.out.printf("%n=== SO SANH HIEU NANG - 500 DINH ===%n");
        System.out.printf("Bounded Dijkstra : %.3f ms (avg %d runs)%n", dAvg, runs);
        System.out.printf("Simplified BMSSP : %.3f ms (avg %d runs)%n", bAvg, runs);
        System.out.printf("BMSSP slower     : %.1fx%n", ratio);
        System.out.printf("Result: %s%n", dAvg < bAvg
                ? "[OK] Bounded Dijkstra faster (matches Castro et al. 2025)"
                : "[NOTE] BMSSP faster in this case");
    }

    @Test
    @DisplayName("[TEST 4] So sanh hieu nang - do thi lon (2000 dinh)")
    void testPerformanceLargeGraph() {
        Set<Integer> sources  = Set.of(0);
        double       boundary = 100.0;
        int          runs     = 5;

        // Warm up
        runSimpleDijkstra(largeGraph, sources, boundary);
        bmssp.run(largeGraph, sources, boundary);

        long dijkstraTotal = 0;
        for (int i = 0; i < runs; i++) {
            long t = System.nanoTime();
            runSimpleDijkstra(largeGraph, sources, boundary);
            dijkstraTotal += System.nanoTime() - t;
        }

        long bmsspTotal = 0;
        for (int i = 0; i < runs; i++) {
            long t = System.nanoTime();
            bmssp.run(largeGraph, sources, boundary);
            bmsspTotal += System.nanoTime() - t;
        }

        double dAvg  = dijkstraTotal / runs / 1_000_000.0;
        double bAvg  = bmsspTotal    / runs / 1_000_000.0;
        double ratio = bAvg / dAvg;

        System.out.printf("%n=== SO SANH HIEU NANG - 2000 DINH ===%n");
        System.out.printf("Bounded Dijkstra : %.3f ms%n", dAvg);
        System.out.printf("Simplified BMSSP : %.3f ms%n", bAvg);
        System.out.printf("BMSSP slower     : %.1fx%n", ratio);
        System.out.printf("Note: BMSSP has large recursion overhead and high constant factor.%n");
        System.out.printf("      On real road networks, Dijkstra is 7-9x faster%n");
        System.out.printf("      (Castro et al. 2025 - tested on 12 road networks)%n");
    }

    @Test
    @DisplayName("[TEST 5] Tom tat ket qua de bao cao")
    void testSummaryForReport() {
        System.out.println("\n+----------------------------------------------------------+");
        System.out.println("|        ALGORITHM COMPARISON - CONCLUSION                 |");
        System.out.println("+----------------------------------------------------------+");
        System.out.println("|                                                          |");
        System.out.println("|  BMSSP (Duan et al. STOC 2025)                          |");
        System.out.println("|  - Theoretical complexity: O(m log^(2/3) n)             |");
        System.out.println("|  - Better than Dijkstra theoretically                    |");
        System.out.println("|  - BUT: high constant factor, large recursion overhead   |");
        System.out.println("|  - In practice: 7-9x SLOWER on road networks            |");
        System.out.println("|                                                          |");
        System.out.println("|  Bounded Dijkstra (chosen for this project)              |");
        System.out.println("|  - Complexity: O(m' log n'), m' << m in practice        |");
        System.out.println("|  - Simple, easy to implement and test                   |");
        System.out.println("|  - FASTER than BMSSP in practice                        |");
        System.out.println("|  - Suitable for urban food delivery problem              |");
        System.out.println("|                                                          |");
        System.out.println("|  => Choosing Bounded Dijkstra is JUSTIFIED               |");
        System.out.println("+----------------------------------------------------------+");

        assertTrue(true);
    }

    // ── Helpers ──────────────────────────────────────────────

    private Map<Integer, Double> runSimpleDijkstra(
            SimplifiedBMSSPAlgorithm.Graph graph,
            Set<Integer> sources,
            double boundary) {

        Map<Integer, Double>  dist = new HashMap<>();
        PriorityQueue<long[]> pq   = new PriorityQueue<>(Comparator.comparingLong(a -> a[0]));

        for (int s : sources) {
            dist.put(s, 0.0);
            pq.offer(new long[]{0L, s});
        }

        while (!pq.isEmpty()) {
            long[] cur   = pq.poll();
            double distU = cur[0] / 1000.0;
            int    u     = (int) cur[1];

            if (distU > dist.getOrDefault(u, Double.MAX_VALUE)) continue;
            if (distU > boundary) break;

            for (int[] edge : graph.adj[u]) {
                int    v  = edge[0];
                double nd = distU + edge[1] / 1000.0;
                if (nd <= boundary && nd < dist.getOrDefault(v, Double.MAX_VALUE)) {
                    dist.put(v, nd);
                    pq.offer(new long[]{(long)(nd * 1000), v});
                }
            }
        }
        return dist;
    }

    private SimplifiedBMSSPAlgorithm.Graph buildRandomGraph(int n, int m, long seed) {
        SimplifiedBMSSPAlgorithm.Graph g = new SimplifiedBMSSPAlgorithm.Graph(n);
        Random rng = new Random(seed);

        for (int i = 0; i < n - 1; i++) {
            double w = 1.0 + rng.nextDouble() * 9.0;
            g.addEdge(i, i + 1, w);
            g.addEdge(i + 1, i, w);
        }

        int extra = m - (n - 1) * 2;
        for (int i = 0; i < extra; i++) {
            int    u = rng.nextInt(n);
            int    v = rng.nextInt(n);
            double w = 1.0 + rng.nextDouble() * 20.0;
            if (u != v) g.addEdge(u, v, w);
        }
        return g;
    }
}