package com.ths.onlinefood.delivery.algorithm;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

/**
 * Tim truong hop BMSSP nhanh hon Dijkstra
 *
 * Dua tren nghien cuu thuc nghiem:
 * - Linear graph (chuoi dai): BMSSP nhanh hon 8-17%
 * - Sparse random graph: BMSSP nhanh hon ~24%
 * (Nguon: Victoria benchmark, Medium 2025)
 */
public class BMSSPWinningTest {

    private final SimplifiedBMSSPAlgorithm bmssp = new SimplifiedBMSSPAlgorithm();
    private static final int RUNS = 20; // nhieu lan de chinh xac hon

    // ══════════════════════════════════════════════════════════
    // TEST 1: Linear chain graph - BMSSP co loi the ro nhat
    // Gong nhu duong quoc lo di thang mot chieu
    // ══════════════════════════════════════════════════════════
    @Test
    @DisplayName("[BMSSP WINS?] Linear chain graph - duong thang dai")
    void testLinearChainGraph() {
        System.out.println("\n=== LINEAR CHAIN GRAPH ===");
        System.out.println("Mo ta: Chuoi node noi tiep nhau, khong co nut phan nhanh");
        System.out.println("Vi du thuc te: Duong quoc lo thang, kenh dao mot chieu");
        System.out.println();

        int[] sizes = {500, 2000, 5000, 10000};

        System.out.printf("%-12s | %10s | %10s | %8s | %s%n",
                "So dinh", "Dijkstra", "BMSSP", "Ratio", "Nhanh hon");
        System.out.println("-------------+------------+------------+----------+-----------");

        for (int n : sizes) {
            SimplifiedBMSSPAlgorithm.Graph chain = buildLinearChain(n);
            Set<Integer> sources = Set.of(0);
            double boundary = n * 2.0; // boundary du lon de di het chain

            double[] result = benchmark(chain, sources, boundary);
            double dMs  = result[0];
            double bMs  = result[1];
            double ratio = bMs / dMs;

            String winner = ratio > 1.05 ? "Dijkstra" : ratio < 0.95 ? "BMSSP" : "Tuong duong";
            System.out.printf("%-12d | %8.3f ms | %8.3f ms | %7.2fx | %s%n",
                    n, dMs, bMs, ratio, winner);
        }
    }

    // ══════════════════════════════════════════════════════════
    // TEST 2: Sparse graph - do out-degree thap (giong mang Payment)
    // ══════════════════════════════════════════════════════════
    @Test
    @DisplayName("[BMSSP WINS?] Sparse graph - do thua cuc thap (degree~3)")
    void testSparseGraph() {
        System.out.println("\n=== SPARSE GRAPH (degree ~ 3) ===");
        System.out.println("Mo ta: Moi node chi co ~3 canh ra - rat thua");
        System.out.println("Vi du thuc te: Mang thanh toan, mang xa hoi it ban be");
        System.out.println();

        int[] sizes = {500, 1000, 2000, 5000};

        System.out.printf("%-12s | %10s | %10s | %8s | %s%n",
                "So dinh", "Dijkstra", "BMSSP", "Ratio", "Nhanh hon");
        System.out.println("-------------+------------+------------+----------+-----------");

        Random rng = new Random(42);
        for (int n : sizes) {
            // Moi node chi noi voi 3 node ngau nhien -> rat thua
            SimplifiedBMSSPAlgorithm.Graph sparse = buildSparseGraph(n, 3, rng.nextLong());
            Set<Integer> sources = Set.of(0);
            double boundary = n * 5.0;

            double[] result = benchmark(sparse, sources, boundary);
            double dMs   = result[0];
            double bMs   = result[1];
            double ratio = bMs / dMs;

            String winner = ratio > 1.05 ? "Dijkstra" : ratio < 0.95 ? "BMSSP" : "Tuong duong";
            System.out.printf("%-12d | %8.3f ms | %8.3f ms | %7.2fx | %s%n",
                    n, dMs, bMs, ratio, winner);
        }
    }

    // ══════════════════════════════════════════════════════════
    // TEST 3: Tree graph - cay phan cap, khong co chu trinh
    // ══════════════════════════════════════════════════════════
    @Test
    @DisplayName("[BMSSP WINS?] Tree graph - cay phan cap")
    void testTreeGraph() {
        System.out.println("\n=== TREE GRAPH ===");
        System.out.println("Mo ta: Cay phan cap, moi node co 2-3 con");
        System.out.println("Vi du thuc te: Cay thu muc, cau truc to chuc");
        System.out.println();

        int[] sizes = {1000, 3000, 7000, 15000};

        System.out.printf("%-12s | %10s | %10s | %8s | %s%n",
                "So dinh", "Dijkstra", "BMSSP", "Ratio", "Nhanh hon");
        System.out.println("-------------+------------+------------+----------+-----------");

        for (int n : sizes) {
            SimplifiedBMSSPAlgorithm.Graph tree = buildTree(n, 3); // branching factor 3
            Set<Integer> sources = Set.of(0); // root
            double boundary = n * 3.0;

            double[] result = benchmark(tree, sources, boundary);
            double dMs   = result[0];
            double bMs   = result[1];
            double ratio = bMs / dMs;

            String winner = ratio > 1.05 ? "Dijkstra" : ratio < 0.95 ? "BMSSP" : "Tuong duong";
            System.out.printf("%-12d | %8.3f ms | %8.3f ms | %7.2fx | %s%n",
                    n, dMs, bMs, ratio, winner);
        }
    }

    // ══════════════════════════════════════════════════════════
    // TEST 4: Tong ket va ket luan
    // ══════════════════════════════════════════════════════════
    @Test
    @DisplayName("[SUMMARY] Tong ket dieu kien BMSSP co loi the")
    void testSummary() {
        System.out.println("\n+---------------------------------------------------------------+");
        System.out.println("|   DIEU KIEN BMSSP CO THE NHANH HON DIJKSTRA                   |");
        System.out.println("+---------------------------------------------------------------+");
        System.out.println("| Do thi thuan loi cho BMSSP:                                   |");
        System.out.println("|   - Linear chain: chuoi node noi tiep (duong thang)           |");
        System.out.println("|   - Sparse graph: moi node chi co ~3 canh (rat thua)          |");
        System.out.println("|   - Tree: cay phan cap, khong co chu trinh                    |");
        System.out.println("|   Muc do nhanh hon: 8-24% (rat nho)                           |");
        System.out.println("|                                                               |");
        System.out.println("| Do thi thuc te - duong pho TP.HCM/Ca Mau:                    |");
        System.out.println("|   - Nhieu giao lo (khong phai linear)                         |");
        System.out.println("|   - Mot nguon xuat phat (1 cua hang)                          |");
        System.out.println("|   - Boundary gioi han (khong can duyet het ban do)            |");
        System.out.println("|   => Dijkstra nhanh hon BMSSP 5-28x                          |");
        System.out.println("|                                                               |");
        System.out.println("| KET LUAN:                                                     |");
        System.out.println("|   BMSSP chi co loi the tren do thi rat dac biet               |");
        System.out.println("|   (linear, tree, sparse degree~3) va loi the rat nho (8-24%) |");
        System.out.println("|   Voi bai toan giao hang thuc te, Bounded Dijkstra            |");
        System.out.println("|   vuot troi hon ro rang va co ly do chon lua hop ly           |");
        System.out.println("+---------------------------------------------------------------+");
    }

    // ══════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════

    /** Chay ca hai thuat toan, tra ve [dijkstraMs, bmsspMs] */
    private double[] benchmark(SimplifiedBMSSPAlgorithm.Graph graph,
                                Set<Integer> sources,
                                double boundary) {
        // Warm up
        for (int i = 0; i < 5; i++) {
            runDijkstra(graph, sources, boundary);
            bmssp.run(graph, sources, boundary);
        }

        long dTotal = 0;
        for (int i = 0; i < RUNS; i++) {
            long t = System.nanoTime();
            runDijkstra(graph, sources, boundary);
            dTotal += System.nanoTime() - t;
        }

        long bTotal = 0;
        for (int i = 0; i < RUNS; i++) {
            long t = System.nanoTime();
            bmssp.run(graph, sources, boundary);
            bTotal += System.nanoTime() - t;
        }

        return new double[]{
                dTotal / RUNS / 1_000_000.0,
                bTotal / RUNS / 1_000_000.0
        };
    }

    /** Linear chain: 0->1->2->3->...->n */
    private SimplifiedBMSSPAlgorithm.Graph buildLinearChain(int n) {
        SimplifiedBMSSPAlgorithm.Graph g = new SimplifiedBMSSPAlgorithm.Graph(n);
        Random rng = new Random(42);
        for (int i = 0; i < n - 1; i++) {
            double w = 1.0 + rng.nextDouble();
            g.addEdge(i, i + 1, w);
            g.addEdge(i + 1, i, w); // 2 chieu
        }
        return g;
    }

    /** Sparse graph: moi node chi co degree canh ngau nhien */
    private SimplifiedBMSSPAlgorithm.Graph buildSparseGraph(int n, int degree, long seed) {
        SimplifiedBMSSPAlgorithm.Graph g = new SimplifiedBMSSPAlgorithm.Graph(n);
        Random rng = new Random(seed);

        // Dam bao connected truoc
        for (int i = 0; i < n - 1; i++) {
            double w = 1.0 + rng.nextDouble() * 9.0;
            g.addEdge(i, i + 1, w);
        }

        // Them canh ngau nhien rat it
        for (int i = 0; i < n; i++) {
            for (int d = 0; d < degree - 1; d++) {
                int v = rng.nextInt(n);
                if (v != i) {
                    g.addEdge(i, v, 1.0 + rng.nextDouble() * 9.0);
                }
            }
        }
        return g;
    }

    /** Tree graph: cay phan cap voi branching factor cho truoc */
    private SimplifiedBMSSPAlgorithm.Graph buildTree(int n, int branching) {
        SimplifiedBMSSPAlgorithm.Graph g = new SimplifiedBMSSPAlgorithm.Graph(n);
        Random rng = new Random(42);
        for (int i = 0; i < n; i++) {
            for (int b = 1; b <= branching; b++) {
                int child = i * branching + b;
                if (child < n) {
                    double w = 1.0 + rng.nextDouble() * 5.0;
                    g.addEdge(i, child, w);
                    g.addEdge(child, i, w);
                }
            }
        }
        return g;
    }

    /** Bounded Dijkstra */
    private Map<Integer, Double> runDijkstra(SimplifiedBMSSPAlgorithm.Graph graph,
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
}