package com.ths.onlinefood.repository;

import com.ths.onlinefood.model.KhuyenMai;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface KhuyenMaiRepository extends JpaRepository<KhuyenMai, Long> {
    Optional<KhuyenMai> findByMonAnId(Long monAnId);
}
