package com.ths.onlinefood.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeoLocationService {

    private static final double QUAN_AN_LAT = 10.773829;
    private static final double QUAN_AN_LNG = 106.705659;

   
    public double[] getLatLngFromAddress(String diaChi) {
        String url = "https://nominatim.openstreetmap.org/search?format=json&q=" + diaChi;

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Spring Boot App");

        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
        List<Map<String, Object>> body = response.getBody();

        if (body != null && !body.isEmpty()) {
            Map<String, Object> location = body.get(0);
            double lat = Double.parseDouble((String) location.get("lat"));
            double lon = Double.parseDouble((String) location.get("lon"));
            return new double[]{lat, lon};
        }
        throw new RuntimeException("Không tìm thấy tọa độ cho địa chỉ này.");
    }

 
    public double tinhKhoangCach(double lat, double lng) {
        String apiKey = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjA0MmIzM2NhMWNlNzRiYjNiYjZhYzhhNmM4MjZkZjE5IiwiaCI6Im11cm11cjY0In0=";
        String url = "https://api.openrouteservice.org/v2/directions/driving-car?api_key=" + apiKey
                + "&start=" + QUAN_AN_LNG + "," + QUAN_AN_LAT
                + "&end=" + lng + "," + lat;

        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        Map<?, ?> body = response.getBody();

        if (body != null && body.containsKey("features")) {
            var features = (List<?>) body.get("features");
            if (!features.isEmpty()) {
                var firstFeature = (Map<?, ?>) features.get(0);
                var properties = (Map<?, ?>) firstFeature.get("properties");
                var summary = (Map<?, ?>) properties.get("summary");
                double distanceMeters = (Double) summary.get("distance");
                return distanceMeters / 1000.0; // km
            }
        }
        throw new RuntimeException("Không tính được khoảng cách.");
    }
}
