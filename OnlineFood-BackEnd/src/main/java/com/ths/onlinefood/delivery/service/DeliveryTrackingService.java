
package com.ths.onlinefood.delivery.service;

import java.util.Map;
import java.util.HashMap;

import com.ths.onlinefood.delivery.dto.LocationUpdateRequest;
import com.ths.onlinefood.delivery.dto.TrackingResponse;
import com.ths.onlinefood.delivery.model.DeliveryLocation;
import com.ths.onlinefood.delivery.model.DeliveryStatus;
import com.ths.onlinefood.delivery.repository.DeliveryLocationRepository;
import com.ths.onlinefood.model.DonHang;
import com.ths.onlinefood.repository.DonHangRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryTrackingService {
    
    private final DeliveryLocationRepository locationRepository;
    private final DonHangRepository donHangRepository;
    private final DijkstraService dijkstraService;
    
    /**
     * Cập nhật vị trí shipper
     */
    @Transactional
    public DeliveryLocation updateLocation(LocationUpdateRequest request) {
        DonHang donHang = donHangRepository.findById(request.getDonHangId())
            .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));
        
        DeliveryLocation location = new DeliveryLocation();
        location.setDonHang(donHang);
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setSpeed(request.getSpeed());
        location.setHeading(request.getHeading());
        location.setStatus(request.getStatus());
        location.setAccuracy(request.getAccuracy());
        location.setBatteryLevel(request.getBatteryLevel());
        location.setNote(request.getNote());
        location.setTimestamp(LocalDateTime.now());
        
        DeliveryLocation saved = locationRepository.save(location);
        
        log.info("Cập nhật vị trí cho đơn hàng {}: ({}, {}), trạng thái: {}", 
                 request.getDonHangId(), request.getLatitude(), 
                 request.getLongitude(), request.getStatus());
        
        // Kiểm tra xem đã gần đến khách chưa
        checkNearCustomer(donHang, request.getLatitude(), request.getLongitude());
        
        return saved;
    }
    
    /**
     * Lấy vị trí hiện tại của shipper
     */
    public TrackingResponse getCurrentLocation(Long donHangId) {
        DonHang donHang = donHangRepository.findById(donHangId)
            .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));
        
        DeliveryLocation location = locationRepository.findLatestByDonHang(donHang)
            .orElse(null);
        
        if (location == null) {
            return createNoTrackingResponse(donHangId);
        }
        
        return convertToTrackingResponse(location, donHang);
    }
    
    /**
     * Lấy lịch sử di chuyển
     */
    public List<TrackingResponse> getLocationHistory(Long donHangId, Integer hours) {
        DonHang donHang = donHangRepository.findById(donHangId)
            .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));
        
        LocalDateTime since = LocalDateTime.now().minusHours(hours != null ? hours : 24);
        List<DeliveryLocation> locations = locationRepository.findRecentLocations(donHangId, since);
        
        return locations.stream()
            .map(loc -> convertToTrackingResponse(loc, donHang))
            .collect(Collectors.toList());
    }
    
    /**
     * Lấy tất cả vị trí của đơn hàng
     */
    public List<DeliveryLocation> getAllLocations(Long donHangId) {
        DonHang donHang = donHangRepository.findById(donHangId)
            .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));
        
        return locationRepository.findByDonHangOrderByTimestampDesc(donHang);
    }
    
    /**
     * Kiểm tra shipper đã gần khách hàng chưa
     */
    private void checkNearCustomer(DonHang donHang, Double currentLat, Double currentLon) {
        if (donHang.getLatGiaoHang() == null || donHang.getLonGiaoHang() == null) {
            return;
        }
        
        Double distance = dijkstraService.calculateDistance(
            currentLat, currentLon,
            donHang.getLatGiaoHang(), donHang.getLonGiaoHang()
        );
        
        // Nếu trong bán kính 500m
        if (distance < 0.5) {
            log.info("Shipper đã gần đến khách hàng ({}m)", Math.round(distance * 1000));
            // Có thể gửi notification ở đây
        }
    }
    
    /**
     * Convert DeliveryLocation sang TrackingResponse
     */
    private TrackingResponse convertToTrackingResponse(DeliveryLocation location, DonHang donHang) {
        TrackingResponse response = new TrackingResponse();
        response.setDonHangId(donHang.getId());
        response.setLatitude(location.getLatitude());
        response.setLongitude(location.getLongitude());
        response.setTimestamp(location.getTimestamp());
        response.setSpeed(location.getSpeed());
        response.setHeading(location.getHeading());
        response.setStatus(location.getStatus());
        
        // Tính khoảng cách đến khách hàng
        if (donHang.getLatGiaoHang() != null && donHang.getLonGiaoHang() != null) {
            Double distance = dijkstraService.calculateDistance(
                location.getLatitude(), location.getLongitude(),
                donHang.getLatGiaoHang(), donHang.getLonGiaoHang()
            );
            response.setDistanceToCustomer(distance);
            
            // Tính thời gian dự kiến (vận tốc trung bình 25 km/h)
            Double eta = (distance / 25.0) * 60.0; // phút
            response.setEstimatedArrivalTime(eta);
        }
        
        response.setStatusMessage(getStatusMessage(location.getStatus(), 
                                                   response.getDistanceToCustomer()));
        
        return response;
    }
    
    /**
     * Tạo response khi chưa có tracking
     */
    private TrackingResponse createNoTrackingResponse(Long donHangId) {
        TrackingResponse response = new TrackingResponse();
        response.setDonHangId(donHangId);
        response.setStatusMessage("Chưa có thông tin vị trí shipper");
        return response;
    }
    
    /**
     * Lấy thông báo trạng thái
     */
    private String getStatusMessage(DeliveryStatus status, Double distance) {
        String message = switch (status) {
            case WAITING -> "Đang chờ shipper nhận đơn";
            case PICKING_UP -> "Shipper đang đến lấy hàng";
            case PICKED_UP -> "Shipper đã lấy hàng";
            case DELIVERING -> "Đang giao hàng đến bạn";
            case NEAR_CUSTOMER -> "Shipper sắp đến nơi";
            case DELIVERED -> "Đã giao hàng thành công";
            case FAILED -> "Giao hàng thất bại";
            case RETURNING -> "Shipper đang quay về cửa hàng";
            default -> "Không rõ trạng thái";
        };
        
        if (distance != null && distance < 1.0 && status == DeliveryStatus.DELIVERING) {
            message += String.format(" (còn %.0f mét)", distance * 1000);
        } else if (distance != null && status == DeliveryStatus.DELIVERING) {
            message += String.format(" (còn %.1f km)", distance);
        }
        
        return message;
    }
    
    /**
     * Xóa dữ liệu tracking cũ (chạy định kỳ)
     */
    @Transactional
    public void cleanOldTrackingData(Integer daysToKeep) {
        LocalDateTime before = LocalDateTime.now().minusDays(daysToKeep != null ? daysToKeep : 30);
        locationRepository.deleteOldLocations(before);
        log.info("Đã xóa dữ liệu tracking cũ hơn {} ngày", daysToKeep);
    }
    
    /**
     * Lấy thống kê tracking
     */
    public Map<String, Object> getTrackingStats(Long donHangId) {
        Long totalUpdates = locationRepository.countByDonHangId(donHangId);
        List<DeliveryLocation> locations = getAllLocations(donHangId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUpdates", totalUpdates);
        stats.put("totalLocations", locations.size());
        
        if (!locations.isEmpty()) {
            DeliveryLocation first = locations.get(locations.size() - 1);
            DeliveryLocation last = locations.get(0);
            
            long minutes = ChronoUnit.MINUTES.between(first.getTimestamp(), last.getTimestamp());
            stats.put("trackingDuration", minutes + " phút");
            stats.put("startTime", first.getTimestamp());
            stats.put("lastUpdate", last.getTimestamp());
            stats.put("currentStatus", last.getStatus());
            
            // Tính tổng quãng đường đã đi
            Double totalDistance = 0.0;
            for (int i = 0; i < locations.size() - 1; i++) {
                DeliveryLocation loc1 = locations.get(i + 1);
                DeliveryLocation loc2 = locations.get(i);
                totalDistance += dijkstraService.calculateDistance(
                    loc1.getLatitude(), loc1.getLongitude(),
                    loc2.getLatitude(), loc2.getLongitude()
                );
            }
            stats.put("totalDistanceTraveled", String.format("%.2f km", totalDistance));
            
            // Tốc độ trung bình
            if (minutes > 0) {
                Double avgSpeed = (totalDistance / minutes) * 60.0;
                stats.put("averageSpeed", String.format("%.1f km/h", avgSpeed));
            }
        }
        
        return stats;
    }
}