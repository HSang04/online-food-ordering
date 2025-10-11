/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.utils;

public class GeoUtils {
    
    private static final double EARTH_RADIUS = 6371; // km
    
    /**
     * Tính khoảng cách giữa 2 điểm (Haversine formula)
     */
    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return EARTH_RADIUS * c;
    }
    
    /**
     * Tính góc bearing giữa 2 điểm (0-360 độ)
     */
    public static double calculateBearing(double lat1, double lon1, double lat2, double lon2) {
        double dLon = Math.toRadians(lon2 - lon1);
        double y = Math.sin(dLon) * Math.cos(Math.toRadians(lat2));
        double x = Math.cos(Math.toRadians(lat1)) * Math.sin(Math.toRadians(lat2)) -
                   Math.sin(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.cos(dLon);
        double bearing = Math.toDegrees(Math.atan2(y, x));
        return (bearing + 360) % 360;
    }
    
    /**
     * Kiểm tra điểm có nằm trong bán kính từ tâm không
     */
    public static boolean isWithinRadius(double centerLat, double centerLon, 
                                        double pointLat, double pointLon, 
                                        double radiusKm) {
        double distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
        return distance <= radiusKm;
    }
    
    /**
     * Lấy hướng di chuyển dạng text từ bearing
     */
    public static String getDirectionText(double bearing) {
        if (bearing >= 337.5 || bearing < 22.5) return "Bắc";
        if (bearing >= 22.5 && bearing < 67.5) return "Đông Bắc";
        if (bearing >= 67.5 && bearing < 112.5) return "Đông";
        if (bearing >= 112.5 && bearing < 157.5) return "Đông Nam";
        if (bearing >= 157.5 && bearing < 202.5) return "Nam";
        if (bearing >= 202.5 && bearing < 247.5) return "Tây Nam";
        if (bearing >= 247.5 && bearing < 292.5) return "Tây";
        return "Tây Bắc";
    }
    
    /**
     * Tính điểm giữa của 2 tọa độ
     */
    public static double[] getMidpoint(double lat1, double lon1, double lat2, double lon2) {
        double dLon = Math.toRadians(lon2 - lon1);
        
        double lat1Rad = Math.toRadians(lat1);
        double lat2Rad = Math.toRadians(lat2);
        double lon1Rad = Math.toRadians(lon1);
        
        double bx = Math.cos(lat2Rad) * Math.cos(dLon);
        double by = Math.cos(lat2Rad) * Math.sin(dLon);
        
        double lat3 = Math.atan2(
            Math.sin(lat1Rad) + Math.sin(lat2Rad),
            Math.sqrt((Math.cos(lat1Rad) + bx) * (Math.cos(lat1Rad) + bx) + by * by)
        );
        
        double lon3 = lon1Rad + Math.atan2(by, Math.cos(lat1Rad) + bx);
        
        return new double[]{
            Math.toDegrees(lat3),
            Math.toDegrees(lon3)
        };
    }
    
    /**
     * Validate tọa độ
     */
    public static boolean isValidCoordinate(Double lat, Double lon) {
        return lat != null && lon != null && 
               lat >= -90 && lat <= 90 && 
               lon >= -180 && lon <= 180;
    }
}