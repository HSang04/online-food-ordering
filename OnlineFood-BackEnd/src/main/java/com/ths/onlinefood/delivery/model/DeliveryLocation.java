
package com.ths.onlinefood.delivery.model;


import com.ths.onlinefood.model.DonHang;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "delivery_location", indexes = {
    @Index(name = "idx_don_hang_timestamp", columnList = "don_hang_id,timestamp")
})
public class DeliveryLocation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "don_hang_id", nullable = false)
    private DonHang donHang;
    
    @Column(nullable = false)
    private Double latitude;
    
    @Column(nullable = false)
    private Double longitude;
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    private Double speed; // km/h
    
    private Double heading; // Hướng di chuyển (0-360 độ)
    
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private DeliveryStatus status;
    
    private Double accuracy; // Độ chính xác GPS (meters)
    
    private Double batteryLevel; // Pin thiết bị shipper
    
    @Column(length = 500)
    private String note; // Ghi chú (nếu có vấn đề)
}