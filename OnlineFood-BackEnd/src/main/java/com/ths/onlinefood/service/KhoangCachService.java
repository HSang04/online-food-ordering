package com.ths.onlinefood.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class KhoangCachService {

    private static final String API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjA0MmIzM2NhMWNlNzRiYjNiYjZhYzhhNmM4MjZkZjE5IiwiaCI6Im11cm11cjY0In0="; 
    private static final double QUAN_AN_LAT = 10.773829;
    private static final double QUAN_AN_LNG = 106.705659;

    public Double tinhKhoangCach(double userLat, double userLng) {
        String url = "https://api.openrouteservice.org/v2/directions/driving-car?api_key=" + API_KEY
                + "&start=" + QUAN_AN_LNG + "," + QUAN_AN_LAT
                + "&end=" + userLng + "," + userLat;

        RestTemplate restTemplate = new RestTemplate();

        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                Map.class
        );

        Map<?, ?> body = response.getBody();
        if (body != null && body.containsKey("features")) {
            var features = (List<?>) body.get("features");
            if (!features.isEmpty()) {
                var firstFeature = (Map<?, ?>) features.get(0);
                var properties = (Map<?, ?>) firstFeature.get("properties");
                var summary = (Map<?, ?>) properties.get("summary");
                double distanceMeters = (Double) summary.get("distance");
                return distanceMeters / 1000.0;
            }
        }

        throw new RuntimeException("Không lấy được khoảng cách từ OpenRouteService.");
    }
}
