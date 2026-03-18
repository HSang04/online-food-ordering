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
 * So sanh hieu nang 2 thuat toan tim duong ngan nhat tren ban do TP.HCM.
 *
 * Thuat toan 1 - Bounded Dijkstra:
 *   Cai dat tai: method runBoundedDijkstra() trong file nay
 *   Cung logic voi BoundedDijkstraAlgorithm.java dung trong production.
 *   Chay truc tiep tren GraphHopper graph (OSM Vietnam), khong can convert.
 *
 * Thuat toan 2 - Simplified BMSSP:
 *   Cai dat tai: class SimplifiedBMSSPAlgorithm.java
 *   Phien ban don gian hoa cua BMSSP - Duan et al. STOC 2025.
 *   Chay tren SimpleGraph (phai convert tu GraphHopper truoc).
 *
 * Phuong phap do:
 *   - Moi tuyen duong chay RUNS=10 lan, lay trung binh
 *   - Warm up JVM 3 lan truoc khi do (tranh JIT lam lech ket qua)
 *   - Thoi gian convert GraphHopper -> SimpleGraph KHONG tinh vao ket qua
 *     de dam bao so sanh cong bang thuat toan thuan tuy
 *
 * Ket qua xuat ra 2 file CSV:
 *   algorithm_comparison.csv      -> trung binh, min, max, node, khoang cach
 *   algorithm_comparison_runs.csv -> tung lan chay (de ve line chart)
 */
@SpringBootTest
public class RealCoordinateComparisonTest {

    // GraphHopper chua ban do OSM Vietnam (~5 trieu node, ~5.7 trieu canh)
    @Autowired
    private GraphHopper graphHopper;

    // Thuat toan BMSSP - nam trong SimplifiedBMSSPAlgorithm.java
    private final SimplifiedBMSSPAlgorithm bmsspAlgorithm = new SimplifiedBMSSPAlgorithm();

    // 10 cap toa do thuc te tai TP.HCM
    // Format: { "ten tuyen", latStart, lonStart, latEnd, lonEnd }
    private static final Object[][] TEST_CASES = {
        { "Ben Thanh - Nha Tho Duc Ba",    10.7725, 106.6980, 10.7797, 106.6990 },
        { "Ben Thanh - Bui Vien",           10.7725, 106.6980, 10.7672, 106.6918 },
        { "Ho Con Rua - Dinh Doc Lap",      10.7813, 106.6990, 10.7770, 106.6955 },
        { "Cho Lon - DH Y Duoc",            10.7553, 106.6618, 10.7527, 106.6700 },
        { "Phu My Hung - SC VivoCity",      10.7310, 106.7000, 10.7280, 106.7190 },
        { "Quan 1 - Quan 3",                10.7769, 106.7009, 10.7850, 106.6900 },
        { "DHQG TPHCM - Vincom Thu Duc",    10.8700, 106.8030, 10.8510, 106.7720 },
        { "Tan Binh - Quan 10",             10.7956, 106.6522, 10.7731, 106.6669 },
        { "Quan 9 - Quan 2",                10.8500, 106.8200, 10.8000, 106.7400 },
        { "Thu Duc - Binh Duong ranh gioi", 10.8700, 106.8000, 10.9200, 106.7500 },
    };

    private static final double BOUND_METERS = 30000.0; // gioi han 30km
    private static final int    RUNS         = 10;      // so lan chay lay trung binh

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
        List<double[]> allTimings = new ArrayList<>();

        for (Object[] tc : TEST_CASES) {
            String name     = (String) tc[0];
            double latStart = (double) tc[1];
            double lonStart = (double) tc[2];
            double latEnd   = (double) tc[3];
            double lonEnd   = (double) tc[4];

            // Snap toa do sang node gan nhat trong GraphHopper graph
            Snap snapStart = index.findClosest(latStart, lonStart, e -> true);
            Snap snapEnd   = index.findClosest(latEnd,   lonEnd,   e -> true);
            if (!snapStart.isValid() || !snapEnd.isValid()) continue;

            int          sourceNode = snapStart.getClosestNode();
            int          targetNode = snapEnd.getClosestNode();
            Set<Integer> sources    = Collections.singleton(sourceNode);

            // ──────────────────────────────────────────────────
            // BUOC 1: Warm up JVM - chay 3 lan, KHONG tinh vao ket qua
            // Muc dich: de JIT compile xong truoc khi do chinh thuc
            // ──────────────────────────────────────────────────
            warmUpJvm(graph, na, sources, sourceNode);

            // ──────────────────────────────────────────────────
            // BUOC 2: Do thoi gian BOUNDED DIJKSTRA - 10 lan
            //
            // Thuat toan: runBoundedDijkstra() trong file nay
            //             (cung logic voi BoundedDijkstraAlgorithm.java production)
            // Do thi    : GraphHopper graph goc (OSM Vietnam)
            //             Khong can convert, chay truc tiep
            // ──────────────────────────────────────────────────
            double[] dijkstraTimes = new double[RUNS];
            int      dijkstraNodes = 0;
            double   dijkstraDist  = 0;

            for (int r = 0; r < RUNS; r++) {
                Map<Integer, Double>  dist    = new HashMap<>();
                Map<Integer, Integer> parent  = new HashMap<>();
                Set<Integer>          reached = new HashSet<>();

                long t = System.nanoTime();
                runBoundedDijkstra(graph, sources, BOUND_METERS, dist, parent, reached); // <- DIJKSTRA
                dijkstraTimes[r] = (System.nanoTime() - t) / 1_000_000.0;

                if (r == RUNS - 1) {
                    dijkstraNodes = countPathNodes(parent, sourceNode, targetNode);
                    dijkstraDist  = dist.getOrDefault(targetNode, -1.0) / 1000.0;
                }
            }

            // ──────────────────────────────────────────────────
            // BUOC 3: Chuan bi do thi cho BMSSP - KHONG tinh vao thoi gian do
            //
            // BMSSP khong the chay truc tiep tren GraphHopper graph
            // vi dung cau truc do thi rieng (SimplifiedBMSSPAlgorithm.Graph)
            // => Phai convert truoc. Thoi gian nay khong tinh vao ket qua.
            // ──────────────────────────────────────────────────
            SimplifiedBMSSPAlgorithm.Graph simpleGraph =
                    convertGraphHopperToSimpleGraph(graph, na, sourceNode);
            Map<Integer, Integer> nodeMap     = buildNodeMap(graph, sourceNode);
            Integer               simpleTarget = nodeMap.get(targetNode);

            // Warm up BMSSP sau khi da co simpleGraph
            for (int i = 0; i < 3; i++) {
                bmsspAlgorithm.run(simpleGraph, Set.of(0), BOUND_METERS);
            }

            // ──────────────────────────────────────────────────
            // BUOC 4: Do thoi gian SIMPLIFIED BMSSP - 10 lan
            //
            // Thuat toan: SimplifiedBMSSPAlgorithm.java
            // Do thi    : SimpleGraph da convert o buoc 3
            // Chi tinh thoi gian chay thuat toan thuan tuy
            // ──────────────────────────────────────────────────
            double[] bmsspTimes = new double[RUNS];
            int      bmsspNodes = 0;
            double   bmsspDist  = 0;

            for (int r = 0; r < RUNS; r++) {
                long t = System.nanoTime();
                SimplifiedBMSSPAlgorithm.Result result =
                        bmsspAlgorithm.run(simpleGraph, Set.of(0), BOUND_METERS); // <- BMSSP
                bmsspTimes[r] = (System.nanoTime() - t) / 1_000_000.0;

                if (r == RUNS - 1 && simpleTarget != null) {
                    bmsspNodes = countPathNodes(result.parent, 0, simpleTarget);
                    bmsspDist  = result.dist.getOrDefault(simpleTarget, -1.0) / 1000.0;
                }
            }

            // ──────────────────────────────────────────────────
            // BUOC 5: Tinh thong ke va ghi CSV
            // ──────────────────────────────────────────────────
            double dAvg  = avg(dijkstraTimes);
            double dMin  = min(dijkstraTimes);
            double dMax  = max(dijkstraTimes);
            double bAvg  = avg(bmsspTimes);
            double bMin  = min(bmsspTimes);
            double bMax  = max(bmsspTimes);
            double ratio = bAvg / dAvg;

            String winner;
            if      (ratio > 1.05) { winner = "Dijkstra"; dijkstraWins++; }
            else if (ratio < 0.95) { winner = "BMSSP";    bmsspWins++;    }
            else                   { winner = "Equal";    ties++;          }

            // Ghi CSV chinh - cot lien ke de ve bieu do dang:
            // A:C  -> Bieu do 1: Thoi gian trung binh (ms)
            // D:E  -> Bieu do 2: So node tren duong di
            // F:G  -> Bieu do 3: Khoang cach (km)
            // H:K  -> Thong tin bo sung: min, max
            // L:M  -> Ratio va Winner
            csvMain.printf("%s,%.4f,%.4f,%d,%d,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.2f,%s%n",
                    name,
                    dAvg,  bAvg,
                    dijkstraNodes, bmsspNodes,
                    dijkstraDist,  bmsspDist,
                    dMin,  bMin,
                    dMax,  bMax,
                    ratio, winner);

            // Ghi CSV tung run de ve line chart on dinh
            for (int r = 0; r < RUNS; r++) {
                csvRuns.printf("%s,%d,%.4f,%.4f%n",
                        name, r + 1, dijkstraTimes[r], bmsspTimes[r]);
            }

            allTimings.add(new double[]{dAvg, bAvg, ratio,
                                        dijkstraNodes, bmsspNodes,
                                        dijkstraDist,  bmsspDist});
        }

        csvMain.close();
        csvRuns.close();

        assertTrue(dijkstraWins >= bmsspWins,
                "Unexpected: BMSSP faster in more cases than Dijkstra!");
    }

    // ══════════════════════════════════════════════════════════
    // THUAT TOAN 1: BOUNDED DIJKSTRA
    //
    // Cung logic voi BoundedDijkstraAlgorithm.java trong production.
    // Viet lai o day de tranh overhead cua Service layer khi do thoi gian.
    // Chay truc tiep tren GraphHopper graph - khong can convert.
    // ══════════════════════════════════════════════════════════
    private void runBoundedDijkstra(
            Graph                 graph,
            Set<Integer>          sources,
            double                boundMeters,
            Map<Integer, Double>  dist,
            Map<Integer, Integer> parent,
            Set<Integer>          reached) {

        PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(a -> a[0]));

        for (int s : sources) {
            dist.put(s, 0.0);
            parent.put(s, -1);
            pq.offer(new long[]{0L, s});
        }

        int maxReach = 1 << 16; // gioi han 2^16 node

        while (!pq.isEmpty() && reached.size() < maxReach) {
            long[] cur   = pq.poll();
            double distU = cur[0] / 1000.0;
            int    u     = (int) cur[1];

            if (distU > dist.getOrDefault(u, Double.MAX_VALUE)) continue;
            if (distU > boundMeters) break;

            reached.add(u);

            var it = graph.createEdgeExplorer().setBaseNode(u);
            while (it.next()) {
                int    v  = it.getAdjNode();
                double nd = distU + it.getDistance();
                if (nd <= boundMeters && nd < dist.getOrDefault(v, Double.MAX_VALUE)) {
                    dist.put(v, nd);
                    parent.put(v, u);
                    pq.offer(new long[]{(long)(nd * 1000), v});
                }
            }
        }
    }

    // ══════════════════════════════════════════════════════════
    // HO TRO: Convert GraphHopper.Graph -> SimplifiedBMSSP.Graph
    //
    // BMSSP dung cau truc do thi rieng nen can convert.
    // Chi lay cac node trong pham vi BOUND_METERS tu sourceNode.
    // Thoi gian convert KHONG tinh vao ket qua do hieu nang.
    // ══════════════════════════════════════════════════════════
    private SimplifiedBMSSPAlgorithm.Graph convertGraphHopperToSimpleGraph(
            Graph graph, NodeAccess na, int sourceNode) {

        Map<Integer, Double>  dist    = new HashMap<>();
        Map<Integer, Integer> nodeMap = new HashMap<>();
        List<Integer>         nodes   = new ArrayList<>();

        PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(a -> a[0]));
        dist.put(sourceNode, 0.0);
        pq.offer(new long[]{0L, sourceNode});

        while (!pq.isEmpty() && nodes.size() < (1 << 16)) {
            long[] cur   = pq.poll();
            double distU = cur[0] / 1000.0;
            int    u     = (int) cur[1];
            if (distU > dist.getOrDefault(u, Double.MAX_VALUE)) continue;
            if (distU > BOUND_METERS) break;
            if (!nodeMap.containsKey(u)) { nodeMap.put(u, nodes.size()); nodes.add(u); }
            var it = graph.createEdgeExplorer().setBaseNode(u);
            while (it.next()) {
                int    v  = it.getAdjNode();
                double nd = distU + it.getDistance();
                if (nd <= BOUND_METERS && nd < dist.getOrDefault(v, Double.MAX_VALUE)) {
                    dist.put(v, nd);
                    pq.offer(new long[]{(long)(nd * 1000), v});
                }
            }
        }

        SimplifiedBMSSPAlgorithm.Graph sg = new SimplifiedBMSSPAlgorithm.Graph(nodes.size());
        for (int ghId : nodes) {
            int simpleU = nodeMap.get(ghId);
            var it = graph.createEdgeExplorer().setBaseNode(ghId);
            while (it.next()) {
                int ghV = it.getAdjNode();
                if (nodeMap.containsKey(ghV))
                    sg.addEdge(simpleU, nodeMap.get(ghV), it.getDistance());
            }
        }
        return sg;
    }

    // ── Map GraphHopper node id -> SimpleGraph node id ────────
    private Map<Integer, Integer> buildNodeMap(Graph graph, int sourceNode) {
        Map<Integer, Double>  dist    = new HashMap<>();
        Map<Integer, Integer> nodeMap = new HashMap<>();
        List<Integer>         nodes   = new ArrayList<>();
        PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(a -> a[0]));
        dist.put(sourceNode, 0.0);
        pq.offer(new long[]{0L, sourceNode});

        while (!pq.isEmpty() && nodes.size() < (1 << 16)) {
            long[] cur   = pq.poll();
            double distU = cur[0] / 1000.0;
            int    u     = (int) cur[1];
            if (distU > dist.getOrDefault(u, Double.MAX_VALUE)) continue;
            if (distU > BOUND_METERS) break;
            if (!nodeMap.containsKey(u)) { nodeMap.put(u, nodes.size()); nodes.add(u); }
            var it = graph.createEdgeExplorer().setBaseNode(u);
            while (it.next()) {
                int    v  = it.getAdjNode();
                double nd = distU + it.getDistance();
                if (nd <= BOUND_METERS && nd < dist.getOrDefault(v, Double.MAX_VALUE)) {
                    dist.put(v, nd);
                    pq.offer(new long[]{(long)(nd * 1000), v});
                }
            }
        }
        return nodeMap;
    }

    // ── Dem so node tren duong di thuc te (truy vet nguoc parent) ──
    private int countPathNodes(Map<Integer, Integer> parent, int source, int target) {
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

    // ── Warm up JVM - chay 3 lan khong tinh ket qua ───────────
    private void warmUpJvm(Graph graph, NodeAccess na,
                            Set<Integer> sources, int sourceNode) {
        for (int i = 0; i < 3; i++) {
            Map<Integer, Double>  d = new HashMap<>();
            Map<Integer, Integer> p = new HashMap<>();
            Set<Integer>          r = new HashSet<>();
            runBoundedDijkstra(graph, sources, BOUND_METERS, d, p, r);
        }
        SimplifiedBMSSPAlgorithm.Graph sg =
                convertGraphHopperToSimpleGraph(graph, na, sourceNode);
        for (int i = 0; i < 3; i++) {
            bmsspAlgorithm.run(sg, Set.of(0), BOUND_METERS);
        }
    }

    // ── Mo file CSV va ghi header ──────────────────────────────
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

    // ── Helpers thong ke ──────────────────────────────────────
    private double avg(double[] a) { return Arrays.stream(a).average().orElse(0); }
    private double min(double[] a) { return Arrays.stream(a).min().orElse(0); }
    private double max(double[] a) { return Arrays.stream(a).max().orElse(0); }
}