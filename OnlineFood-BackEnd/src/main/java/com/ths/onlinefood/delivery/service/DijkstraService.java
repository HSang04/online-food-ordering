package com.ths.onlinefood.delivery.service;

import com.graphhopper.GHRequest;
import com.graphhopper.GHResponse;
import com.graphhopper.GraphHopper;
import com.graphhopper.ResponsePath;
import com.graphhopper.util.PointList;
import com.ths.onlinefood.delivery.model.DeliveryRoute;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DijkstraService {
    
    private final GraphHopper graphHopper;
    
    public DeliveryRoute findShortestPath(Double latStart, Double lonStart, 
                                          Double latEnd, Double lonEnd) {
        
        log.info("🔍 Tìm đường từ ({}, {}) đến ({}, {})", 
                 latStart, lonStart, latEnd, lonEnd);
        
        try {
            // ✅ Chỉ cần profile, không cần CustomModel nữa
            GHRequest request = new GHRequest(latStart, lonStart, latEnd, lonEnd)
                .setProfile("car")
                .setLocale(java.util.Locale.forLanguageTag("vi"));
            
            GHResponse response = graphHopper.route(request);
            
            if (response.hasErrors()) {
                log.error("❌ Lỗi: {}", response.getErrors());
                return createDirectRoute(latStart, lonStart, latEnd, lonEnd);
            }
            
            ResponsePath path = response.getBest();
            DeliveryRoute route = new DeliveryRoute();
            
            PointList pointList = path.getPoints();
            List<double[]> coordinates = new ArrayList<>();
            
            for (int i = 0; i < pointList.size(); i++) {
                coordinates.add(new double[]{
                    pointList.getLat(i),
                    pointList.getLon(i)
                });
            }
            
            route.setCoordinates(coordinates);
            route.setTotalDistance(path.getDistance() / 1000.0);
            route.setRouteSummary(String.format("%.2f km", route.getTotalDistance()));
            route.setNodes(new ArrayList<>());
            route.setSteps(new ArrayList<>());
            
            log.info("✅ Tìm thấy: {:.2f} km, {} điểm", 
                     route.getTotalDistance(), coordinates.size());
            
            return route;
            
        } catch (Exception e) {
            log.error("❌ Lỗi: ", e);
            return createDirectRoute(latStart, lonStart, latEnd, lonEnd);
        }
    }
    
    private DeliveryRoute createDirectRoute(Double latStart, Double lonStart, 
                                           Double latEnd, Double lonEnd) {
        DeliveryRoute route = new DeliveryRoute();
        
        List<double[]> coordinates = new ArrayList<>();
        coordinates.add(new double[]{latStart, lonStart});
        coordinates.add(new double[]{latEnd, lonEnd});
        
        Double distance = calculateDistance(latStart, lonStart, latEnd, lonEnd);
        
        route.setCoordinates(coordinates);
        route.setTotalDistance(distance);
        route.setRouteSummary("Đường thẳng: " + distance + " km");
        route.setNodes(new ArrayList<>());
        route.setSteps(new ArrayList<>());
        
        return route;
    }
    
    public Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        final int R = 6371;
        Double latDistance = Math.toRadians(lat2 - lat1);
        Double lonDistance = Math.toRadians(lon2 - lon1);
        
        Double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        Double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
}
