package com.ths.onlinefood.repository;

import com.ths.onlinefood.model.NguoiDung;
import com.ths.onlinefood.model.USER_ROLE;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NguoiDungRepository extends JpaRepository<NguoiDung, Long> {
    
    Optional<NguoiDung> findByUsername(String username);
    Optional<NguoiDung> findByEmail(String email);
    List<NguoiDung> findByVaiTro(USER_ROLE vaiTro);
    
    List<NguoiDung> findByTrangThaiTrue();
    List<NguoiDung> findByTrangThaiFalse();

    
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    
    
}