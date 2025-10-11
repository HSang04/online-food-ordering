/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.service;

import java.util.Map;
import java.util.HashMap;

import com.ths.onlinefood.delivery.dto.LocationUpdateRequest;
import com.ths.onlinefood.delivery.model.DeliveryLocation;
import com.ths.onlinefood.delivery.model.DeliveryStatus;
import com.ths.onlinefood.delivery.repository.DeliveryLocationRepository;
import com.ths.onlinefood.delivery.service.DeliveryTrackingService;
import com.ths.onlinefood.delivery.service.DijkstraService;
import com.ths.onlinefood.model.DonHang;
import com.ths.onlinefood.repository.DonHangRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryTrackingServiceTest {
    
    @Mock
    private DeliveryLocationRepository locationRepository;
    
    @Mock
    private DonHangRepository donHangRepository;
    
    @Mock
    private DijkstraService dijkstraService;
    
    @InjectMocks
    private DeliveryTrackingService trackingService;
    
    private DonHang donHang;
    private LocationUpdateRequest request;
    
    @BeforeEach
    void setUp() {
        donHang = new DonHang();
        donHang.setId(1L);
        donHang.setLatGiaoHang(10.7640);
        donHang.setLonGiaoHang(106.6813);
        
        request = new LocationUpdateRequest();
        request.setDonHangId(1L);
        request.setLatitude(10.7726);
        request.setLongitude(106.6980);
        request.setSpeed(25.0);
        request.setStatus(DeliveryStatus.DELIVERING);
    }
    
    @Test
    void testUpdateLocation_Success() {
        // Arrange
        when(donHangRepository.findById(1L)).thenReturn(Optional.of(donHang));
        when(locationRepository.save(any(DeliveryLocation.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        
        // Act
        DeliveryLocation result = trackingService.updateLocation(request);
        
        // Assert
        assertNotNull(result);
        assertEquals(request.getLatitude(), result.getLatitude());
        assertEquals(request.getLongitude(), result.getLongitude());
        assertEquals(request.getStatus(), result.getStatus());
        verify(locationRepository, times(1)).save(any(DeliveryLocation.class));
    }
    
    @Test
    void testUpdateLocation_DonHangNotFound() {
        // Arrange
        when(donHangRepository.findById(1L)).thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            trackingService.updateLocation(request);
        });
    }
}