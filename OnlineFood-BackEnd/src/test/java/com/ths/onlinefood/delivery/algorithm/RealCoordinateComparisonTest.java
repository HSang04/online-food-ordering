package com.ths.onlinefood.delivery.algorithm;

import com.graphhopper.GraphHopper;
import com.graphhopper.storage.Graph;
import com.graphhopper.storage.NodeAccess;
import com.graphhopper.storage.index.LocationIndex;
import com.graphhopper.storage.index.Snap;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * So sanh hieu nang Bounded Dijkstra vs Simplified BMSSP tren ban do TP.HCM.
 *
 * Phuong phap do:
 *   - Moi tuyen chay RUNS=10 lan, lay trung binh
 *   - Warm up JVM 3 lan truoc khi do
 *   - Thoi gian convert GraphHopper -> SimpleGraph KHONG tinh vao ket qua
 *
 * Tat ca tuyen duoi 30 km thuc te, dung chung BOUND_METERS = 30_000 m.
 *
 * === BUG FIX ===
 * Van de cu: buildNodeMap va convertToSimpleGraph chi them node vao map khi
 * node do duoc POLL tu PQ (lam baseNode). Nhung targetNode co the chi la
 * adjNode chua bao gio duoc poll => khong vao nodeMap => simpleTarget = null.
 *
 * Fix: them tat ca adjNode vao nodeMap ngay khi kham pha (push vao PQ),
 * dam bao moi node co dist <= BOUND deu co mat trong nodeMap du da duoc
 * poll hay chua.
 */
@SpringBootTest
public class RealCoordinateComparisonTest {

    @Autowired
    private GraphHopper graphHopper;

    private final SimplifiedBMSSPAlgorithm bmsspAlgorithm = new SimplifiedBMSSPAlgorithm();

    private static final double BOUND_METERS = 30_000.0;
    private static final int    MAX_REACH    = 1 << 30;
    private static final int    RUNS         = 10;

    private static final Object[][] TEST_CASES = {

        // < 4 km thuc te
        { "Ho Con Rua - Dinh Doc Lap",
            10.7813, 106.6990,   10.7770, 106.6955 },

        { "Ben Thanh - Nha Tho Duc Ba",
            10.7725, 106.6980,   10.7797, 106.6990 },

        { "BV Cho Ray - DH Y Duoc",
            10.757846190922237, 106.65948574274563,
            10.7553031900159,   106.66305498704857 },

        { "Phu My Hung - Lotte Mart Quan 7",
            10.7310, 106.7000,
            10.740759950159893, 106.7017829486136 },

        // 
        { "Cho Kim Bien - Cho Binh Tay",
            10.7507, 106.6558,
            10.7499, 106.6509 },

        // ~5.5 km thuc te
        { "DH Bach Khoa - Lang Cha Ca",
            10.7726, 106.6579,   10.8012, 106.6659 },

        // ~6 km thuc te
        { "Cong vien Gia Dinh - DH Mo TPHCM (co so Vo Van Tan)",
            10.8124, 106.6766,   10.7764, 106.6901 },

        // ~4-5 km thuc te
        { "Ben Thanh - BV Cho Ray",
            10.7725, 106.6980,   10.7578, 106.65945 },

        // ~12 km thuc te
        { "Cong vien Gia Dinh - Lotte Mart Quan 7",
            10.8124, 106.6766,   10.7407, 106.7017 },

        // ~27 km thuc te
        { "San bay Tan Son Nhat - DH Mo (co so Nha Be)",
            10.8137, 106.6624,   10.6757, 106.6907 },
    };

    // ══════════════════════════════════════════════════════════
    // TEST CHINH
    // ══════════════════════════════════════════════════════════
    @Test
    @DisplayName("So sanh BoundedDijkstra vs SimplifiedBMSSP tren toa do thuc te TP.HCM")
    void testCompareAlgorithmsOnRealCoordinates() throws Exception {

        Graph         graph = graphHopper.getBaseGraph();
        NodeAccess    na    = graph.getNodeAccess();
        LocationIndex index = graphHopper.getLocationIndex();

        PrintWriter csvMain = openCsvMain();
        PrintWriter csvRuns = openCsvRuns();

        int dijkstraWins = 0, bmsspWins = 0, ties = 0;

        for (Object[] tc : TEST_CASES) {
            String name     = (String) tc[0];
            double latStart = (double) tc[1];
            double lonStart = (double) tc[2];
            double latEnd   = (double) tc[3];
            double lonEnd   = (double) tc[4];

            Snap snapStart = index.findClosest(latStart, lonStart, e -> true);
            Snap snapEnd   = index.findClosest(latEnd,   lonEnd,   e -> true);
            if (!snapStart.isValid() || !snapEnd.isValid()) {
                System.err.println("[WARN] Khong snap duoc node cho tuyen: " + name);
                continue;
            }

            int          sourceNode = snapStart.getClosestNode();
            int          targetNode = snapEnd.getClosestNode();
            Set<Integer> sources    = Collections.singleton(sourceNode);

            // Warm up JVM
            warmUpJvm(graph, na, sources, sourceNode);

            // ── Do thoi gian Bounded Dijkstra ──
            double[] dijkstraTimes = new double[RUNS];
            int      dijkstraNodes = 0;
            double   dijkstraDist  = 0;

            for (int r = 0; r < RUNS; r++) {
                Map<Integer, Double>  dist    = new HashMap<>();
                Map<Integer, Integer> parent  = new HashMap<>();
                Set<Integer>          reached = new HashSet<>();

                long t = System.nanoTime();
                runBoundedDijkstra(graph, sources, dist, parent, reached);
                dijkstraTimes[r] = (System.nanoTime() - t) / 1_000_000.0;

                if (r == RUNS - 1) {
                    dijkstraNodes = countPathNodes(parent, sourceNode, targetNode);
                    dijkstraDist  = dist.getOrDefault(targetNode, -1.0) / 1000.0;
                }
            }

            // ── Chuan bi SimpleGraph cho BMSSP (KHONG tinh vao thoi gian do) ──
            //
            // [FIX] Dung buildNodeMapFixed() thay buildNodeMap() cu.
            // Ham moi them tat ca adjNode vao nodeMap ngay khi kham pha,
            // dam bao targetNode luon co mat du chua duoc poll tu PQ.
            Map<Integer, Integer> nodeMap =
                    buildNodeMapFixed(graph, sourceNode);
            SimplifiedBMSSPAlgorithm.Graph simpleGraph =
                    convertToSimpleGraphFixed(graph, sourceNode, nodeMap);
            Integer simpleTarget = nodeMap.get(targetNode);

            if (simpleTarget == null) {
                // Sau khi fix, truong hop nay chi xay ra neu targetNode
                // that su nam ngoai BOUND_METERS (dist > 30km).
                System.err.println("[WARN] targetNode nam ngoai BOUND "
                        + BOUND_METERS/1000 + " km: " + name);
            }

            for (int i = 0; i < 3; i++) {
                bmsspAlgorithm.run(simpleGraph, Set.of(0), BOUND_METERS);
            }

            // ── Do thoi gian Simplified BMSSP ──
            double[] bmsspTimes = new double[RUNS];
            int      bmsspNodes = 0;
            double   bmsspDist  = 0;

            for (int r = 0; r < RUNS; r++) {
                long t = System.nanoTime();
                SimplifiedBMSSPAlgorithm.Result result =
                        bmsspAlgorithm.run(simpleGraph, Set.of(0), BOUND_METERS);
                bmsspTimes[r] = (System.nanoTime() - t) / 1_000_000.0;

                if (r == RUNS - 1 && simpleTarget != null) {
                    bmsspNodes = countPathNodes(result.parent, 0, simpleTarget);
                    bmsspDist  = result.dist.getOrDefault(simpleTarget, -1.0) / 1000.0;
                }
            }

            // ── Thong ke ──
            double dAvg  = avg(dijkstraTimes);
            double bAvg  = avg(bmsspTimes);
            double dMin  = min(dijkstraTimes);
            double bMin  = min(bmsspTimes);
            double dMax  = max(dijkstraTimes);
            double bMax  = max(bmsspTimes);
            double ratio = bAvg / dAvg;

            String winner;
            if      (ratio > 1.05) { winner = "Dijkstra"; dijkstraWins++; }
            else if (ratio < 0.95) { winner = "BMSSP";    bmsspWins++;    }
            else                   { winner = "Equal";    ties++;          }

            System.out.printf("[%s] Dijkstra=%.2fms | BMSSP=%.2fms | Ratio=%.2f"
                    + " | %s | dist=%.3fkm%n",
                    name, dAvg, bAvg, ratio, winner, dijkstraDist);

            csvMain.printf("%s,%.4f,%.4f,%d,%d,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.2f,%s%n",
                    name,
                    dAvg, bAvg,
                    dijkstraNodes, bmsspNodes,
                    dijkstraDist, bmsspDist,
                    dMin, bMin,
                    dMax, bMax,
                    ratio, winner);

            for (int r = 0; r < RUNS; r++) {
                csvRuns.printf("%s,%d,%.4f,%.4f%n",
                        name, r + 1, dijkstraTimes[r], bmsspTimes[r]);
            }
        }

        csvMain.close();
        csvRuns.close();

        System.out.printf("%n=== KET QUA TONG HOP ===%n");
        System.out.printf("Dijkstra thang: %d | BMSSP thang: %d | Hoa: %d%n",
                dijkstraWins, bmsspWins, ties);

        assertTrue(dijkstraWins >= bmsspWins,
                "Unexpected: BMSSP faster in more cases than Dijkstra!");
    }

    // ══════════════════════════════════════════════════════════
    // THUAT TOAN 1: BOUNDED DIJKSTRA
    // ══════════════════════════════════════════════════════════
    private void runBoundedDijkstra(
            Graph                 graph,
            Set<Integer>          sources,
            Map<Integer, Double>  dist,
            Map<Integer, Integer> parent,
            Set<Integer>          reached) {

        PriorityQueue<long[]> pq =
                new PriorityQueue<>(Comparator.comparingLong(a -> a[0]));

        for (int s : sources) {
            dist.put(s, 0.0);
            parent.put(s, -1);
            pq.offer(new long[]{0L, s});
        }

        while (!pq.isEmpty() && reached.size() < MAX_REACH) {
            long[] cur   = pq.poll();
            double distU = cur[0] / 1000.0;
            int    u     = (int) cur[1];

            if (distU > dist.getOrDefault(u, Double.MAX_VALUE)) continue;
            if (distU > BOUND_METERS) break;

            reached.add(u);

            var it = graph.createEdgeExplorer().setBaseNode(u);
            while (it.next()) {
                int    v  = it.getAdjNode();
                double nd = distU + it.getDistance();
                if (nd <= BOUND_METERS
                        && nd < dist.getOrDefault(v, Double.MAX_VALUE)) {
                    dist.put(v, nd);
                    parent.put(v, u);
                    pq.offer(new long[]{(long)(nd * 1000), v});
                }
            }
        }
    }

    // ══════════════════════════════════════════════════════════
    // [FIX] buildNodeMapFixed
    //
    // Khac biet so voi ban cu:
    //   Ban cu: chi them node u vao nodeMap khi u duoc POLL (lam baseNode).
    //   Ban moi: them ca adjNode v vao nodeMap ngay khi kham pha v,
    //            miễn la dist[v] <= BOUND_METERS.
    //
    // Dieu nay dam bao moi node co the tiep can duoc (dist <= BOUND) deu
    // co mat trong nodeMap, ke ca chua duoc poll.
    // ══════════════════════════════════════════════════════════
    private Map<Integer, Integer> buildNodeMapFixed(Graph graph, int sourceNode) {
        Map<Integer, Double>  dist    = new HashMap<>();
        Map<Integer, Integer> nodeMap = new LinkedHashMap<>(); // giu thu tu insert

        PriorityQueue<long[]> pq =
                new PriorityQueue<>(Comparator.comparingLong(a -> a[0]));
        dist.put(sourceNode, 0.0);
        // [FIX] them sourceNode vao nodeMap ngay tu dau
        nodeMap.put(sourceNode, nodeMap.size());
        pq.offer(new long[]{0L, sourceNode});

        while (!pq.isEmpty() && nodeMap.size() < MAX_REACH) {
            long[] cur   = pq.poll();
            double distU = cur[0] / 1000.0;
            int    u     = (int) cur[1];

            if (distU > dist.getOrDefault(u, Double.MAX_VALUE)) continue;
            if (distU > BOUND_METERS) break;

            var it = graph.createEdgeExplorer().setBaseNode(u);
            while (it.next()) {
                int    v  = it.getAdjNode();
                double nd = distU + it.getDistance();
                if (nd <= BOUND_METERS
                        && nd < dist.getOrDefault(v, Double.MAX_VALUE)) {
                    dist.put(v, nd);
                    // [FIX] them v vao nodeMap ngay khi kham pha, khong cho den khi poll
                    if (!nodeMap.containsKey(v)) {
                        nodeMap.put(v, nodeMap.size());
                    }
                    pq.offer(new long[]{(long)(nd * 1000), v});
                }
            }
        }
        return nodeMap;
    }

    // ══════════════════════════════════════════════════════════
    // [FIX] convertToSimpleGraphFixed
    //
    // Nhan nodeMap tu buildNodeMapFixed (da co day du cac node),
    // xay dung SimpleGraph tuong ung.
    // Khong chay Dijkstra lan thu 2 doc lap nhu ban cu => nhat quan.
    // ══════════════════════════════════════════════════════════
    private SimplifiedBMSSPAlgorithm.Graph convertToSimpleGraphFixed(
            Graph graph, int sourceNode, Map<Integer, Integer> nodeMap) {

        SimplifiedBMSSPAlgorithm.Graph sg =
                new SimplifiedBMSSPAlgorithm.Graph(nodeMap.size());

        for (int ghId : nodeMap.keySet()) {
            int simpleU = nodeMap.get(ghId);
            var it = graph.createEdgeExplorer().setBaseNode(ghId);
            while (it.next()) {
                int ghV = it.getAdjNode();
                if (nodeMap.containsKey(ghV)) {
                    sg.addEdge(simpleU, nodeMap.get(ghV), it.getDistance());
                }
            }
        }
        return sg;
    }

    // ══════════════════════════════════════════════════════════
    // HO TRO
    // ══════════════════════════════════════════════════════════
    private int countPathNodes(Map<Integer, Integer> parent,
                                int source, int target) {
        if (!parent.containsKey(target)) return 0;
        int count   = 0;
        int current = target;
        while (current != -1 && count < 100_000) {
            count++;
            if (current == source) break;
            current = parent.getOrDefault(current, -1);
        }
        return count;
    }

    private void warmUpJvm(Graph graph, NodeAccess na,
                            Set<Integer> sources, int sourceNode) {
        for (int i = 0; i < 3; i++) {
            Map<Integer, Double>  d = new HashMap<>();
            Map<Integer, Integer> p = new HashMap<>();
            Set<Integer>          r = new HashSet<>();
            runBoundedDijkstra(graph, sources, d, p, r);
        }
        Map<Integer, Integer> nm = buildNodeMapFixed(graph, sourceNode);
        SimplifiedBMSSPAlgorithm.Graph sg =
                convertToSimpleGraphFixed(graph, sourceNode, nm);
        for (int i = 0; i < 3; i++) {
            bmsspAlgorithm.run(sg, Set.of(0), BOUND_METERS);
        }
    }

    private PrintWriter openCsvMain() throws Exception {
        PrintWriter pw = new PrintWriter(new FileWriter("algorithm_comparison.csv"));
        pw.println("Tuyen_duong," +
                   "Dijkstra_avg_ms,BMSSP_avg_ms," +
                   "Dijkstra_nodes,BMSSP_nodes," +
                   "Dijkstra_dist_km,BMSSP_dist_km," +
                   "Dijkstra_min_ms,BMSSP_min_ms," +
                   "Dijkstra_max_ms,BMSSP_max_ms," +
                   "Ratio,Winner");
        return pw;
    }

    private PrintWriter openCsvRuns() throws Exception {
        PrintWriter pw = new PrintWriter(new FileWriter("algorithm_comparison_runs.csv"));
        pw.println("Tuyen_duong,Run,Dijkstra_ms,BMSSP_ms");
        return pw;
    }

    private double avg(double[] a) { return Arrays.stream(a).average().orElse(0); }
    private double min(double[] a) { return Arrays.stream(a).min().orElse(0); }
    private double max(double[] a) { return Arrays.stream(a).max().orElse(0); }
}